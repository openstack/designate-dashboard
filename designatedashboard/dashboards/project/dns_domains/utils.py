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
from django.conf import settings


def limit_records_to_fips():
    # This method checks the settings to determine if the
    # record creation / update screen should limit the ip input
    # to be a dropdown of floating ips
    return getattr(settings, "DESIGNATE",
                   {}).get("records_use_fips", False)
