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
import functools
import re
import six

from designateclient import exceptions as designate_exceptions
from django.core.exceptions import ValidationError  # noqa
from django.core import validators
from django.template.loader import render_to_string
from django.utils.translation import ugettext_lazy as _  # noqa

from horizon import forms
from horizon import messages

from designatedashboard import api
from designatedashboard.dashboards.project.dns_domains.utils\
    import limit_records_to_fips
from oslo_log import log as logging


LOG = logging.getLogger(__name__)

MAX_TTL = 2147483647
# These regexes were given to me by Kiall Mac Innes here:
# https://gerrit.hpcloud.net/#/c/25300/2/
DOMAIN_NAME_REGEX = r'^(?!.{255,})(?:(?!\-)[A-Za-z0-9_\-]{1,63}(?<!\-)\.)+$'
WILDCARD_DOMAIN_NAME_REGEX = r'^(?!.{255,})(?:(^\*|(?!\-)[A-Za-z0-9_\-]{1,63})(?<!\-)\.)+$'  # noqa
SRV_NAME_REGEX = r'^(?:_[A-Za-z0-9_\-]{1,62}\.){2}'
SRV_DATA_REGEX = r'^(?:(?:6553[0-5]|655[0-2][0-9]|65[0-4][0-9]{2}|6[0-4][0-9]{3}|[1-5][0-9]{4}|[1-9][0-9]{1,3}|[0-9])\s){2}(?!.{255,})((?!\-)[A-Za-z0-9_\-]{1,63}(?<!\-)\.)+$'  # noqa
SSHFP_DATA_REGEX = r'^[1-4]\s[1-2]\s\b([0-9a-fA-F]{5,40}|[0-9a-fA-F]{64})\b$'
# The max length for a dns label
NAME_MAX_LENGTH = 63


def handle_exc(func):
    @functools.wraps(func)
    def wrapped(form, request, *args, **kwargs):
        try:
            return func(form, request, *args, **kwargs)
        except designate_exceptions.RemoteError as ex:
            msg = ""
            data = {}

            if six.text_type(ex) is not None:
                data['message'] = six.text_type(ex)
                msg += "Error: %(message)s"
            else:
                data["type"] = ex.type
                msg += "Error Type: %(type)s"

            if ex.code >= 500:
                msg += " (Request ID: %(request_id)s"
                data["request_id"] = ex.request_id

            form.api_error(_(msg) % data)  # noqa

            return False
        except Exception:
            messages.error(request, form.exc_message)
            return True

    return wrapped


class DomainForm(forms.SelfHandlingForm):

    '''Base class for DomainCreate and DomainUpdate forms.

    Sets-up all of the common form fields.
    '''

    name = forms.RegexField(
        label=_("Domain Name"),
        regex=DOMAIN_NAME_REGEX,
        error_messages={'invalid': _('Enter a valid domain name.')},
    )

    email = forms.EmailField(
        label=_("Email"),
        max_length=255,
    )

    ttl = forms.IntegerField(
        label=_("TTL (seconds)"),
        min_value=1,
        max_value=MAX_TTL,
        required=False,
    )

    description = forms.CharField(
        label=_("Description"),
        required=False,
        max_length=160,
        widget=forms.Textarea(),
    )


class DomainCreate(DomainForm):

    '''Form for creating new domain records.

    Name and email address are
    required.
    '''
    exc_message = _("Unable to create domain.")

    @handle_exc
    def handle(self, request, data):
        domain = api.designate.domain_create(
            request,
            name=data['name'],
            email=data['email'],
            ttl=data['ttl'],
            description=data['description'])
        messages.success(request,
                         _('Domain %(name)s created.') %
                         {"name": domain.name})
        return domain


class DomainUpdate(DomainForm):

    '''Form for displaying domain record details and updating them.'''
    exc_message = _('Unable to update domain.')

    id = forms.CharField(
        required=False,
        widget=forms.HiddenInput()
    )

    serial = forms.CharField(
        label=_("Serial"),
        required=False,
        widget=forms.TextInput(attrs={'readonly': 'readonly'}),
    )

    created_at = forms.CharField(
        label=_("Created At"),
        required=False,
        widget=forms.TextInput(attrs={'readonly': 'readonly'}),
    )

    updated_at = forms.CharField(
        label=_("Updated At"),
        required=False,
        widget=forms.TextInput(attrs={'readonly': 'readonly'}),
    )

    def __init__(self, request, *args, **kwargs):
        super(DomainUpdate, self).__init__(request, *args, **kwargs)

        # Mark name as read-only
        self.fields['name'].required = False
        self.fields['name'].widget.attrs['readonly'] = 'readonly'

        self.fields['ttl'].required = True

        # Customize display order for fields
        self.fields.keyOrder = [
            'id',
            'name',
            'serial',
            'email',
            'ttl',
            'description',
            'created_at',
            'updated_at',
        ]

    @handle_exc
    def handle(self, request, data):
        domain = api.designate.domain_update(
            request,
            domain_id=data['id'],
            email=data['email'],
            ttl=data['ttl'],
            description=data['description'])
        messages.success(request,
                         _('Domain %(name)s updated.') %
                         {"name": domain.name})
        return domain


class PrefixWidget(forms.TextInput):

    def render(self, name, value, attrs=None):
        template_name = 'project/dns_domains/prefix_html_widget.html'
        result = super(PrefixWidget, self).render(name, value, attrs)
        view_data = {'input': result,
                     'suffix': getattr(self, "suffix", '')}
        return render_to_string(template_name, view_data)


class RecordForm(forms.SelfHandlingForm):

    '''Base class for RecordCreate and RecordUpdate forms.

    Sets-up all of
    the form fields and implements the complex validation logic.
    '''

    domain_id = forms.CharField(
        widget=forms.HiddenInput())

    domain_name = forms.CharField(
        widget=forms.HiddenInput())

    type = forms.ChoiceField(
        label=_("Record Type"),
        required=False,
        choices=[
            ('a', _('A - Address record')),
            ('aaaa', _('AAAA - IPv6 address record')),
            ('cname', _('CNAME - Canonical name record')),
            ('mx', _('MX - Mail exchange record')),
            ('ptr', _('PTR - Pointer record')),
            ('spf', _('SPF - Sender Policy Framework')),
            ('srv', _('SRV - Service locator')),
            ('sshfp', _('SSHFP - SSH Public Key Fingerprint')),
            ('txt', _('TXT - Text record')),
        ],
        widget=forms.Select(attrs={
            'class': 'switchable',
            'data-slug': 'record_type',
        }),
    )

    name = forms.CharField(
        required=False,
        widget=PrefixWidget(attrs={
            'class': 'switched',
            'data-switch-on': 'record_type',
            'data-record_type-a': _('Name'),
            'data-record_type-aaaa': _('Name'),
            'data-record_type-cname': _('Name'),
            'data-record_type-mx': _('Name'),
            'data-record_type-ns': _('Name'),
            'data-record_type-ptr': _('Name'),
            'data-record_type-soa': _('Name'),
            'data-record_type-spf': _('Name'),
            'data-record_type-srv': _('Name'),
            'data-record_type-sshfp': _('Name'),
            'data-record_type-txt': _('Name'),
        }),
    )

    data = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'switched',
            'data-switch-on': 'record_type',
            'data-record_type-a': _('IP Address'),
            'data-record_type-aaaa': _('IP Address'),
            'data-record_type-cname': _('Canonical Name'),
            'data-record_type-ns': _('Name Server'),
            'data-record_type-mx': _('Mail Server'),
            'data-record_type-ptr': _('PTR Domain Name'),
            'data-record_type-soa': _('Value'),
            'data-record_type-srv': _('Value'),
        }),
    )

    ip_addr = forms.ChoiceField(
        required=False,
        widget=forms.Select(attrs={
            'class': 'switched',
            'data-switch-on': 'record_type',
            'data-record_type-a': _('IP Address'),
            'data-record_type-aaaa': _('IP Address'),
        }),
    )

    txt = forms.CharField(
        label=_('TXT'),
        required=False,
        widget=forms.Textarea(attrs={
            'class': 'switched',
            'data-switch-on': 'record_type',
            'data-record_type-txt': _('Text'),
            'data-record_type-spf': _('Text'),
            'data-record_type-sshfp': _('Text'),
        }),
    )

    priority = forms.IntegerField(
        min_value=0,
        max_value=65535,
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'switched',
            'data-switch-on': 'record_type',
            'data-record_type-mx': _('Priority'),
            'data-record_type-srv': _('Priority'),
        }),
    )

    ttl = forms.IntegerField(
        label=_('TTL'),
        min_value=1,
        max_value=MAX_TTL,
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'switched',
            'data-switch-on': 'record_type',
            'data-record_type-a': _('TTL'),
            'data-record_type-aaaa': _('TTL'),
            'data-record_type-cname': _('TTL'),
            'data-record_type-mx': _('TTL'),
            'data-record_type-ptr': _('TTL'),
            'data-record_type-soa': _('TTL'),
            'data-record_type-spf': _('TTL'),
            'data-record_type-srv': _('TTL'),
            'data-record_type-sshfp': _('TTL'),
            'data-record_type-txt': _('TTL'),
        }),
    )

    description = forms.CharField(
        label=_("Description"),
        required=False,
        max_length=160,
        widget=forms.Textarea(),
    )

    def __init__(self, request, *args, **kwargs):
        super(RecordForm, self).__init__(request, *args, **kwargs)
        initial = kwargs.get('initial', {})
        domain_suffix = "." + initial['domain_name']
        self.fields['name'].widget.suffix = domain_suffix
        self.fields['name'].max_length = min(NAME_MAX_LENGTH,
                                             255 - len(domain_suffix))
        if limit_records_to_fips():
            del self.fields['data'].widget.attrs['data-record_type-a']
            del self.fields['data'].widget.attrs['data-record_type-aaaa']
            self.fields['ip_addr'].choices = \
                self.populate_ip_addr_choices(request,
                                              initial)
        else:
            del self.fields['ip_addr']

    def _generate_fip_list(self, fips, instances):
        instance_dict = {instance.id: instance for instance in instances}
        for fip in fips:
            instance_name = _("Unknown instance name")
            if getattr(fip, "instance_id", "None") in instance_dict:
                instance_name = instance_dict[getattr(fip, "instance_id")].name
            yield (fip.ip, "%s (%s)" % (fip.ip, instance_name))

    def populate_ip_addr_choices(self, request, initial):
        results = [(None, _('Select an IP')), ]
        if (initial.get('ip_addr') and
                initial['ip_addr'] not in [fip.ip for fip in initial['fips']]):
            """The record is currently using an ip not in the list
            of fips - this can happen when instance goes away or in
            multi region setups
            """
            results.append((initial['ip_addr'], initial['ip_addr']))
        results.extend(self._generate_fip_list(initial['fips'],
                                               initial['instances']))
        if len(results) == 1:
            messages.warning(request, _("There are no floating IP addresses "
                                        "currently in use to select from."))
        return results

    def clean_type(self):
        '''Type value needs to be uppercased before it is sent to the API.'''
        return self.cleaned_data['type'].upper()

    def clean(self):
        '''Handles the validation logic for the domain record form.

        Validation gets pretty complicated due to the fact that the different
        record types (A, AAAA, MX, etc) have different requirements for
        each of the fields.
        '''

        cleaned_data = super(RecordForm, self).clean()
        record_type = cleaned_data['type']
        domain_name = cleaned_data['domain_name']
        if limit_records_to_fips():
            ip_addr = cleaned_data.pop('ip_addr')
            if (record_type in ['AAAA', 'A'] and limit_records_to_fips()):
                cleaned_data['data'] = ip_addr

        #  Name field
        if self._is_field_blank(cleaned_data, 'name'):
            if record_type in ['CNAME', 'SRV']:
                self._add_required_field_error('name')
            elif record_type in ['MX', 'A', 'AAAA', 'TXT', 'PTR']:
                cleaned_data['name'] = domain_name
        else:
            if record_type == 'SRV':
                if not re.match(SRV_NAME_REGEX, cleaned_data['name']):
                    self._add_field_error('name', _('Enter a valid SRV name'))
                else:
                    cleaned_data['name'] += domain_name
            else:
                cleaned_data['name'] += "." + domain_name
                if not re.match(WILDCARD_DOMAIN_NAME_REGEX,
                                cleaned_data['name']):
                    self._add_field_error('name',
                                          _('Enter a valid hostname. The '
                                            'hostname should contain letters '
                                            'and numbers, and be no more than '
                                            '63 characters.'))
        # Data field
        if self._is_field_blank(cleaned_data, 'data'):
            if record_type in ['A', 'AAAA', 'CNAME', 'MX', 'SRV']:
                self._add_required_field_error('data')
        else:
            if record_type == 'A':
                try:
                    validators.validate_ipv4_address(cleaned_data['data'])
                except ValidationError:
                    self._add_field_error('data',
                                          _('Enter a valid IPv4 address'))

            elif record_type == 'AAAA':
                try:
                    validators.validate_ipv6_address(cleaned_data['data'])
                except ValidationError:
                    self._add_field_error('data',
                                          _('Enter a valid IPv6 address'))

            elif record_type in ['CNAME', 'MX', 'PTR']:
                if not re.match(DOMAIN_NAME_REGEX, cleaned_data['data']):
                    self._add_field_error('data', _('Enter a valid hostname'))

            elif record_type == 'SRV':
                if not re.match(SRV_DATA_REGEX, cleaned_data['data']):
                    self._add_field_error('data',
                                          _('Enter a valid SRV record'))

        # Txt field
        if self._is_field_blank(cleaned_data, 'txt'):
            if record_type == 'TXT':
                self._add_required_field_error('txt')
        else:
            if record_type == 'TXT':
                cleaned_data['data'] = cleaned_data['txt']

        if record_type == 'SSHFP':
            if not re.match(SSHFP_DATA_REGEX, cleaned_data['txt']):
                self._add_field_error('txt',
                                      _('Enter a valid SSHFP record'))
            cleaned_data['data'] = cleaned_data['txt']

        cleaned_data.pop('txt')

        # Priority field
        # Check against '' instead of using _is_field_blank because we need to
        # allow a valud of 0.
        if ('priority' not in cleaned_data or
                cleaned_data['priority'] == '' or
                cleaned_data['priority'] is None):
            if record_type in ['MX', 'SRV']:
                self._add_required_field_error('priority')

        # Rename 'id' to 'record_id'
        if 'id' in cleaned_data:
            cleaned_data['record_id'] = cleaned_data.pop('id')

        # Remove domain_name
        cleaned_data.pop('domain_name')

        return cleaned_data

    def _add_required_field_error(self, field):
        '''Set a required field error on the specified field.'''
        self._add_field_error(field, _('This field is required'))

    def _add_field_error(self, field, msg):
        '''Set the specified msg as an error on the field.'''
        self._errors[field] = self.error_class([msg])

    def _is_field_blank(self, cleaned_data, field):
        '''Returns a flag indicating whether the specified field is blank.'''
        return field in cleaned_data and not cleaned_data[field]


class RecordCreate(RecordForm):

    '''Form for creating a new domain record.'''
    exc_message = _('Unable to create record.')

    @handle_exc
    def handle(self, request, data):
        record = api.designate.record_create(request, **data)
        messages.success(request,
                         _('Domain record %(name)s created.') %
                         {"name": record.name})
        return record


class RecordUpdate(RecordForm):

    '''Form for editing a domain record.'''
    exc_message = _('Unable to create record.')

    id = forms.CharField(widget=forms.HiddenInput())

    def __init__(self, request, *args, **kwargs):
        super(RecordUpdate, self).__init__(request, *args, **kwargs)

        # Force the type field to be read-only
        self.fields['type'].widget.attrs['readonly'] = 'readonly'

        if self['type'].value() in ('soa', 'ns'):
            self.fields['type'].choices.append(('ns', _('NS')))
            self.fields['type'].choices.append(('soa', _('SOA')))

            self.fields['name'].widget.attrs['readonly'] = 'readonly'
            self.fields['data'].widget.attrs['readonly'] = 'readonly'
            self.fields['description'].widget.attrs['readonly'] = 'readonly'
            self.fields['ttl'].widget.attrs['readonly'] = 'readonly'

        # Filter the choice list so that it only contains the type for
        # the current record. Ideally, we would just disable the select
        # field, but that has the unfortunate side-effect of breaking
        # the 'selectable' javascript code.
        self.fields['type'].choices = (
            [choice for choice in self.fields['type'].choices
             if choice[0] == self.initial['type']])

    @handle_exc
    def handle(self, request, data):

        if data['type'] in ('SOA', 'NS'):
            return True

        record = api.designate.record_update(request, **data)

        messages.success(request,
                         _('Domain record %(name)s updated.') %
                         {"name": record.name})

        return record
