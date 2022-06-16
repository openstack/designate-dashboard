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

# This file is to be included for configuring application which relates
# to dns(Designate) functions.
from django.conf import settings

settings.POLICY_FILES.update({
    'dns': 'designate_policy.yaml'
})

settings.DEFAULT_POLICY_FILES.update({
    'dns': 'default_policies/designate.yaml'
})
