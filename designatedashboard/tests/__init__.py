# vim: tabstop=4 shiftwidth=4 softtabstop=4

# Copyright 2012 United States Government as represented by the
# Administrator of the National Aeronautics and Space Administration.
# All Rights Reserved.
#
# Copyright 2012 Nebula, Inc.
#
#    Licensed under the Apache License, Version 2.0 (the "License"); you may
#    not use this file except in compliance with the License. You may obtain
#    a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
#    WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
#    License for the specific language governing permissions and limitations
#    under the License.

# from designatedashboard import api

from openstack_dashboard.test import helpers as test

from designatedashboard.dashboards.project.dns_domains import forms


class BaseRecordFormCleanTests(test.TestCase):

    DOMAIN_NAME = 'foo.com.'
    HOSTNAME = 'www'

    MSG_FIELD_REQUIRED = 'This field is required'
    MSG_INVALID_HOSTNAME = 'Enter a valid hostname. The '\
                           'hostname should contain letters '\
                           'and numbers, and be no more than '\
                           '63 characters.'
    MSG_INVALID_HOSTNAME_SHORT = 'Enter a valid hostname'

    def setUp(self):
        super(BaseRecordFormCleanTests, self).setUp()

        # Request object with messages support
        self.request = self.factory.get('', {})

        # Set-up form instance
        kwargs = {}
        kwargs['initial'] = {'domain_name': self.DOMAIN_NAME}
        self.form = forms.RecordCreate(self.request, **kwargs)
        self.form._errors = {}
        self.form.cleaned_data = {
            'domain_name': self.DOMAIN_NAME,
            'name': '',
            'data': '',
            'txt': '',
            'priority': None,
            'ttl': None,
        }

    def assert_no_errors(self):
        self.assertEqual(self.form._errors, {})

    def assert_error(self, field, msg):
        self.assertIn(msg, self.form._errors[field])

    def assert_required_error(self, field):
        self.assert_error(field, self.MSG_FIELD_REQUIRED)
