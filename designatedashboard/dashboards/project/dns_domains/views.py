# Copyright 2013 Hewlett-Packard Development Company, L.P.
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.
from django.core.urlresolvers import reverse, reverse_lazy  # noqa
from django.utils.translation import ugettext_lazy as _  # noqa

from horizon import exceptions
from horizon import forms
from horizon import tables
from horizon.views import HorizonTemplateView   # noqa

from openstack_dashboard.api.neutron import tenant_floating_ip_list
from openstack_dashboard.api.nova import server_list

from designatedashboard import api

from .forms import DomainCreate  # noqa
from .forms import DomainUpdate  # noqa
from .forms import RecordCreate  # noqa
from .forms import RecordUpdate  # noqa
from .tables import DomainsTable  # noqa
from .tables import RecordsTable  # noqa
from .utils import limit_records_to_fips  # noqa


class IndexView(tables.DataTableView):
    table_class = DomainsTable
    template_name = 'project/dns_domains/index.html'

    def get_data(self):
        try:
            return api.designate.domain_list(self.request)
        except Exception:
            exceptions.handle(self.request,
                              _('Unable to retrieve domain list.'))
            return []


class CreateDomainView(forms.ModalFormView):
    form_class = DomainCreate
    template_name = 'project/dns_domains/create_domain.html'
    success_url = reverse_lazy('horizon:project:dns_domains:index')

    def get_object_display(self, obj):
        return obj.ip


class DomainDetailView(HorizonTemplateView):
    template_name = 'project/dns_domains/domain_detail.html'

    def get_context_data(self, **kwargs):
        context = super(DomainDetailView, self).get_context_data(**kwargs)
        domain_id = self.kwargs['domain_id']
        try:
            context["domain"] = api.designate.domain_get(self.request,
                                                         domain_id)
            table = DomainsTable(self.request)
            context["actions"] = table.render_row_actions(context["domain"])
        except Exception:
            redirect = reverse('horizon:project:dns_domains:index')
            exceptions.handle(self.request,
                              _('Unable to retrieve domain record.'),
                              redirect=redirect)
        return context


class UpdateDomainView(forms.ModalFormView):
    form_class = DomainUpdate
    template_name = 'project/dns_domains/update_domain.html'
    success_url = reverse_lazy('horizon:project:dns_domains:index')

    def get_object(self):
        domain_id = self.kwargs['domain_id']
        try:
            return api.designate.domain_get(self.request, domain_id)
        except Exception:
            redirect = reverse('horizon:project:dns_domains:index')
            exceptions.handle(self.request,
                              _('Unable to retrieve domain record.'),
                              redirect=redirect)

    def get_initial(self):
        self.domain = self.get_object()
        return self.domain

    def get_context_data(self, **kwargs):
        context = super(UpdateDomainView, self).get_context_data(**kwargs)
        context["domain"] = self.domain
        return context


class RecordsView(tables.DataTableView):
    table_class = RecordsTable
    template_name = 'project/dns_domains/records.html'

    def get_data(self):
        domain_id = self.kwargs['domain_id']
        records = []
        try:
            self.domain = api.designate.domain_get(self.request, domain_id)
            self.servers = api.designate.server_list(self.request, domain_id)
            records = api.designate.record_list(self.request, domain_id)
        except Exception:
            redirect = reverse('horizon:project:dns_domains:index')
            exceptions.handle(self.request,
                              _('Unable to retrieve record list.'),
                              redirect=redirect)

        return records

    def get_context_data(self, **kwargs):
        context = super(RecordsView, self).get_context_data(**kwargs)
        context['domain'] = self.domain
        context['servers'] = self.servers

        return context


class BaseRecordFormView(forms.ModalFormView):
    cancel_label = _("Cancel")

    def get_success_url(self):
        return reverse('horizon:project:dns_domains:records',
                       args=(self.kwargs['domain_id'],))

    def get_domain(self):
        domain_id = self.kwargs['domain_id']
        try:
            return api.designate.domain_get(self.request, domain_id)
        except Exception:
            redirect = reverse('horizon:project:dns_domains:records',
                               args=(self.kwargs['domain_id'],))
            exceptions.handle(self.request,
                              ('Unable to retrieve domain record.'),
                              redirect=redirect)
            # NotAuthorized errors won't be redirected automatically. Need
            # to force the issue
            raise exceptions.Http302(redirect)

    def get_initial(self):
        self.domain = self.get_domain()
        results = {'domain_id': self.domain.id,
                   'domain_name': self.domain.name, }
        if limit_records_to_fips():
            results.update({'fips': tenant_floating_ip_list(self.request),
                            'instances': server_list(self.request)[0]})
        return results

    def get_context_data(self, **kwargs):
        """Set the cancel url

        the cancel_url needs a variable in it
        so we cannot do this with a simple class attr
        this is critical to perform before the super.get_context_data
        """
        self.cancel_url = reverse('horizon:project:dns_domains:records',
                                  args=(self.kwargs['domain_id'],))
        context = super(BaseRecordFormView, self).get_context_data(**kwargs)
        context['domain'] = self.domain
        return context


class CreateRecordView(BaseRecordFormView):
    form_class = RecordCreate
    submit_label = _("Create Record")
    template_name = 'project/dns_domains/create_record.html'


class ViewRecordDetailsView(HorizonTemplateView):
    template_name = 'project/dns_domains/record_detail.html'

    def get_record(self):
        domain_id = self.kwargs['domain_id']
        record_id = self.kwargs['record_id']
        try:
            return api.designate.record_get(self.request, domain_id, record_id)
        except Exception:
            redirect = reverse('horizon:project:dns_domains:records',
                               args=(self.kwargs['domain_id'],))
            exceptions.handle(self.request,
                              _('Unable to retrieve domain record.'),
                              redirect=redirect)

    def get_context_data(self, **kwargs):
        context = super(ViewRecordDetailsView, self).get_context_data(**kwargs)
        self.record = self.get_record()
        context["record"] = self.record
        context["domain_id"] = self.kwargs['domain_id']
        return context


class UpdateRecordView(BaseRecordFormView):
    form_class = RecordUpdate
    submit_label = _("Update Record")
    template_name = 'project/dns_domains/update_record.html'

    def get_record(self):
        domain_id = self.kwargs['domain_id']
        record_id = self.kwargs['record_id']

        try:
            return api.designate.record_get(self.request, domain_id, record_id)
        except Exception:
            redirect = reverse('horizon:project:dns_domains:records',
                               args=(self.kwargs['domain_id'],))
            exceptions.handle(self.request,
                              _('Unable to retrieve domain record.'),
                              redirect=redirect)

    def get_initial(self):
        initial = super(UpdateRecordView, self).get_initial()
        self.record = self.get_record()

        initial.update({
            'id': self.record.id,
            'name': self.record.name.replace("." + initial['domain_name'], ''),
            'data': self.record.data,
            'txt': self.record.data,
            'priority': self.record.priority,
            'ttl': self.record.ttl,
            'type': self.record.type.lower(),
            'description': self.record.description,
        })
        if limit_records_to_fips():
            initial.update({'ip_addr': self.record.data})

        return initial

    def get_context_data(self, **kwargs):
        context = super(UpdateRecordView, self).get_context_data(**kwargs)
        context["record"] = self.record
        return context
