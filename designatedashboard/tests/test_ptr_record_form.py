# Copyright 2015 NEC Corporation.  All rights reserved.
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

from designatedashboard.tests import base


class PTRRecordFormTests(base.BaseRecordFormCleanTests):

    PTR = "6.0.0.10.in-addr.arpa."

    def setUp(self):
        super(PTRRecordFormTests, self).setUp()
        self.form.cleaned_data['type'] = 'PTR'
        self.form.cleaned_data['name'] = self.HOSTNAME
        self.form.cleaned_data['data'] = self.PTR

    def test_valid_field_values(self):
        self.form.clean()
        self.assert_no_errors()

    def test_valid_name_field_wild_card(self):
        self.form.cleaned_data['name'] = '*'
        self.form.clean()
        self.assert_no_errors()

    def test_missing_name_field(self):
        self.form.cleaned_data['name'] = ''
        self.form.clean()
        self.assert_no_errors()
        self.assertIsNotNone(self.form.cleaned_data['name'])

    def test_invalid_name_field(self):
        self.form.cleaned_data['name'] = '#@$foo!!'
        self.form.clean()
        self.assert_error('name', self.MSG_INVALID_HOSTNAME)

    def test_invalid_name_field_starting_dash(self):
        self.form.cleaned_data['name'] = '-ww.foo.com'
        self.form.clean()
        self.assert_error('name', self.MSG_INVALID_HOSTNAME)

    def test_invalid_name_field_trailing_dash(self):
        self.form.cleaned_data['name'] = 'www.foo.co-'
        self.form.clean()
        self.assert_error('name', self.MSG_INVALID_HOSTNAME)

    def test_invalid_name_field_bad_wild_card(self):
        self.form.cleaned_data['name'] = 'derp.*.' + self.DOMAIN_NAME
        self.form.clean()
        self.assert_error('name', self.MSG_INVALID_HOSTNAME)

    def test_outside_of_domain_name_field(self):
        self.form.cleaned_data['name'] = 'www.bar.com.'
        self.form.clean()

    def test_invalid_data_field(self):
        self.form.cleaned_data['data'] = '#@$' + self.PTR + '!!'
        self.form.clean()
        self.assert_error('data', self.MSG_INVALID_HOSTNAME_SHORT)

    def test_invalid_data_field_starting_dash(self):
        self.form.cleaned_data['data'] = '-' + self.PTR
        self.form.clean()
        self.assert_error('data', self.MSG_INVALID_HOSTNAME_SHORT)

    def test_invalid_data_field_trailing_dash(self):
        self.form.cleaned_data['data'] = self.PTR + '-'
        self.form.clean()
        self.assert_error('data', self.MSG_INVALID_HOSTNAME_SHORT)

    def test_invalid_data_field_bad_wild_card(self):
        self.form.cleaned_data['data'] = 'derp.*.' + self.PTR
        self.form.clean()
        self.assert_error('data', self.MSG_INVALID_HOSTNAME_SHORT)
