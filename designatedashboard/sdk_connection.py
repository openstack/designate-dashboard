#  Copyright Red Hat
#
#     Licensed under the Apache License, Version 2.0 (the "License"); you may
#     not use this file except in compliance with the License. You may obtain
#     a copy of the License at
#
#          http://www.apache.org/licenses/LICENSE-2.0
#
#     Unless required by applicable law or agreed to in writing, software
#     distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
#     WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
#     License for the specific language governing permissions and limitations
#     under the License.
from django.conf import settings

import designatedashboard
from openstack import config as occ
from openstack import connection


def get_sdk_connection(request):
    """Creates an SDK connection based on the request.

    :param request: Django request object
    :returns: SDK connection object
    """
    # NOTE(mordred) Nothing says love like two inverted booleans
    # The config setting is NO_VERIFY which is, in fact, insecure.
    # get_one_cloud wants verify, so we pass 'not insecure' to verify.
    insecure = getattr(settings, 'OPENSTACK_SSL_NO_VERIFY', False)
    cacert = getattr(settings, 'OPENSTACK_SSL_CACERT', None)
    # Pass interface to honor 'OPENSTACK_ENDPOINT_TYPE'
    interface = getattr(settings, 'OPENSTACK_ENDPOINT_TYPE', 'publicURL')
    # Pass load_yaml_config as this is a Django service with its own config
    # and we don't want to accidentally pick up a clouds.yaml file. We want to
    # use the settings we're passing in.
    cloud_config = occ.OpenStackConfig(load_yaml_config=False).get_one_cloud(
        verify=not insecure,
        cacert=cacert,
        interface=interface,
        region_name=request.user.services_region,
        auth_type='token',
        auth=dict(
            project_id=request.user.project_id,
            project_domain_id=request.user.domain_id,
            auth_token=request.user.token.unscoped_token,
            auth_url=request.user.endpoint),
        app_name='designate-dashboard',
        app_version=designatedashboard.__version__)
    return connection.from_config(cloud_config=cloud_config)
