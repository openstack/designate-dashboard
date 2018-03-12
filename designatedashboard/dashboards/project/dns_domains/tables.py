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
from django.core import urlresolvers
from django.utils.translation import ugettext_lazy as _  # noqa
from django.utils.translation import ungettext_lazy

from horizon import messages
from horizon import tables
from horizon.utils import memoized

from designatedashboard import api

from openstack_dashboard import policy
from oslo_log import log as logging

LOG = logging.getLogger(__name__)

EDITABLE_RECORD_TYPES = (
    "A",
    "AAAA",
    "CNAME",
    "MX",
    "PTR",
    "SPF",
    "SRV",
    "SSHFP",
    "TXT",
)


class CreateDomain(tables.LinkAction):

    '''Link action for navigating to the CreateDomain view.'''
    name = "create_domain"
    verbose_name = _("Create Domain")
    url = "horizon:project:dns_domains:create_domain"
    classes = ("ajax-modal", "btn-create")
    policy_rules = (("dns", "create_domain"),)

    @memoized.memoized_method
    def allowed(self, request, datum):
        if policy.check((("dns", "get_quota"),), request):
            try:
                if self.table:
                    quota = api.designate.quota_get(request)
                    return quota['domains'] > len(self.table.data)
            except Exception:
                msg = _("The quotas could not be retrieved.")
                messages.warning(request, msg)
        return True


class EditDomain(tables.LinkAction):

    '''Link action for navigating to the UpdateDomain view.'''
    name = "edit_domain"
    verbose_name = _("Edit Domain")
    url = "horizon:project:dns_domains:update_domain"
    classes = ("ajax-modal", "btn-edit")
    policy_rules = (("dns", "update_domain"),)


class ManageRecords(tables.LinkAction):

    '''Link action for navigating to the ManageRecords view.'''
    name = "manage_records"
    verbose_name = _("Manage Records")
    url = "horizon:project:dns_domains:records"
    classes = ("btn-edit")
    policy_rules = (("dns", "get_records"),)


class DeleteDomain(tables.BatchAction):

    '''Batch action for deleting domains.'''
    name = "delete"
    classes = ('btn-danger', 'btn-delete')
    policy_rules = (("dns", "delete_domain"),)

    @staticmethod
    def action_present(count):
        return ungettext_lazy(
            u"Delete Domain",
            u"Delete Domains",
            count
        )

    @staticmethod
    def action_past(count):
        return ungettext_lazy(
            u"Deleted Domain",
            u"Deleted Domains",
            count
        )

    def action(self, request, domain_id):
        api.designate.domain_delete(request, domain_id)


class CreateRecord(tables.LinkAction):

    '''Link action for navigating to the CreateRecord view.'''
    name = "create_record"
    verbose_name = _("Create Record")
    classes = ("ajax-modal", "btn-create")
    policy_rules = (("dns", "create_record"),)

    def get_link_url(self, datum=None):
        url = "horizon:project:dns_domains:create_record"
        return urlresolvers.reverse(url, kwargs=self.table.kwargs)


class EditRecord(tables.LinkAction):

    '''Link action for navigating to the UpdateRecord view.'''
    name = "edit_record"
    verbose_name = _("Edit Record")
    classes = ("ajax-modal", "btn-edit")
    policy_rules = (("dns", "update_record"),)

    def get_link_url(self, datum=None):
        url = "horizon:project:dns_domains:update_record"
        kwargs = {
            'domain_id': datum.domain_id,
            'record_id': datum.id,
        }

        return urlresolvers.reverse(url, kwargs=kwargs)

    def allowed(self, request, record=None):
        return record.type in EDITABLE_RECORD_TYPES


class DeleteRecord(tables.DeleteAction):

    '''Link action for navigating to the UpdateRecord view.'''
    policy_rules = (("dns", "delete_record"),)

    @staticmethod
    def action_present(count):
        return ungettext_lazy(
            u"Delete Record",
            u"Delete Records",
            count
        )

    @staticmethod
    def action_past(count):
        return ungettext_lazy(
            u"Deleted Record",
            u"Deleted Records",
            count
        )

    def delete(self, request, record_id):
        domain_id = self.table.kwargs['domain_id']
        return api.designate.record_delete(request, domain_id, record_id)

    def allowed(self, request, record=None):
        return record.type in EDITABLE_RECORD_TYPES


class BatchDeleteRecord(tables.BatchAction):

    '''Batch action for deleting domain records.'''

    name = "delete"
    classes = ('btn-danger', 'btn-delete')
    policy_rules = (("dns", "delete_record"),)

    @staticmethod
    def action_present(count):
        return ungettext_lazy(
            u"Delete Record",
            u"Delete Records",
            count
        )

    @staticmethod
    def action_past(count):
        return ungettext_lazy(
            u"Deleted Record",
            u"Deleted Records",
            count
        )

    def action(self, request, record_id):
        domain_id = self.table.kwargs['domain_id']
        api.designate.record_delete(request, domain_id, record_id)


class DomainsTable(tables.DataTable):

    '''Data table for displaying domain summary information.'''

    name = tables.Column("name",
                         verbose_name=_("Name"),
                         link=("horizon:project:dns_domains:domain_detail"))

    email = tables.Column("email",
                          verbose_name=_("Email"))

    ttl = tables.Column("ttl",
                        verbose_name=_("TTL"))

    serial = tables.Column("serial",
                           verbose_name=_("Serial"))

    class Meta(object):
        name = "domains"
        verbose_name = _("Domains")
        table_actions = (CreateDomain, DeleteDomain,)
        row_actions = (ManageRecords, EditDomain, DeleteDomain,)


def record__details_link(record):
    '''Returns a link to the view for updating DNS records.'''

    return urlresolvers.reverse(
        "horizon:project:dns_domains:view_record",
        args=(record.domain_id, record.id))


class RecordsTable(tables.DataTable):

    '''Data table for displaying summary information for a domains records.'''

    name = tables.Column("name",
                         verbose_name=_("Name"),
                         link=record__details_link,
                         )

    type = tables.Column("type",
                         verbose_name=_("Type")
                         )

    data = tables.Column("data",
                         verbose_name=_("Data")
                         )

    priority = tables.Column("priority",
                             verbose_name=_("Priority"),
                             )

    ttl = tables.Column("ttl",
                        verbose_name=_("TTL")
                        )

    class Meta(object):
        name = "records"
        verbose_name = _("Records")
        table_actions = (CreateRecord,)
        row_actions = (EditRecord, DeleteRecord,)
        multi_select = False
