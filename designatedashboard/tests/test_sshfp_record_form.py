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


class SSHFPRecordFormTests(base.BaseRecordFormCleanTests):

    TEXT = '2 1 d1eb0d876ec69d18bcefc4263ae43ec33ae14f4c'
    MSG_INVALID_RECORD = "Enter a valid SSHFP record"

    def setUp(self):
        super(SSHFPRecordFormTests, self).setUp()
        self.form.cleaned_data['type'] = 'SSHFP'
        self.form.cleaned_data['name'] = self.HOSTNAME
        self.form.cleaned_data['txt'] = self.TEXT

    def test_valid_field_values(self):
        self.form.clean()
        self.assert_no_errors()

    def test_valid_name_field_wild_card(self):
        self.form.cleaned_data['name'] = '*'
        self.form.clean()
        self.assert_no_errors()

    def test_missing_txt_field(self):
        self.form.cleaned_data['txt'] = ''
        self.form.clean()
        self.assert_error('txt', self.MSG_INVALID_RECORD)

    def test_invalid_txt_field(self):
        self.form.cleaned_data['txt'] = 'foo'
        self.form.clean()
        self.assert_error('txt', self.MSG_INVALID_RECORD)

    def test_invalid_text_field_starting_dash(self):
        self.form.cleaned_data['txt'] = '-2 1 d1eb0d876ec69d18bcef\
                                         c4263ae43ec33ae14f4c'
        self.form.clean()
        self.assert_error('txt', self.MSG_INVALID_RECORD)

    def test_invalid_text_field_trailing_dash(self):
        self.form.cleaned_data['txt'] = '2 1 d1eb0d876ec69d18bcef\
                                         c4263ae43ec33ae14f4c-'
        self.form.clean()
        self.assert_error('txt', self.MSG_INVALID_RECORD)

    def test_invalid_text_field_bad_wild_card(self):
        self.form.cleaned_data['txt'] = '1 2 e0d5320e7e36dea8e369b*'
        self.form.clean()
        self.assert_error('txt', self.MSG_INVALID_RECORD)

    def test_default_assignment_data_field(self):
        self.form.clean()
        self.assertEqual(self.TEXT, self.form.cleaned_data['data'])

    def test_invalid_name_field(self):
        self.form.cleaned_data['name'] = 'foo-'
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
        self.form.cleaned_data['name'] = 'derp.*'
        self.form.clean()
        self.assert_error('name', self.MSG_INVALID_HOSTNAME)

    def test_outside_of_domain_name_field(self):
        self.form.cleaned_data['name'] = 'www.bar.com.'
        self.form.clean()
        self.assert_error('name', self.MSG_INVALID_HOSTNAME)
