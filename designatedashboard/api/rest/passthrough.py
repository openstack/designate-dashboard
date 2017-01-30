# Copyright 2016, Hewlett Packard Enterprise Development, LP
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""API for the passthrough service.
"""
from django.conf import settings
from django.views import generic
import functools
import requests
from requests.exceptions import HTTPError

from horizon import exceptions
from openstack_dashboard.api import base
from openstack_dashboard.api.rest import urls
from openstack_dashboard.api.rest import utils as rest_utils
from oslo_log import log as logging

LOG = logging.getLogger(__name__)


def _passthrough_request(request_method, url,
                         request, data=None, params=None):
    """Makes a request to the appropriate service API with an optional payload.

    Should set any necessary auth headers and SSL parameters.
    """

    # Set verify if a CACERT is set and SSL_NO_VERIFY isn't True
    verify = getattr(settings, 'OPENSTACK_SSL_CACERT', None)
    if getattr(settings, 'OPENSTACK_SSL_NO_VERIFY', False):
        verify = False

    service_url = _get_service_url(request, 'dns')
    request_url = '{}{}'.format(
        service_url,
        url if service_url.endswith('/') else ('/' + url)
    )

    response = request_method(
        request_url,
        headers={'X-Auth-Token': request.user.token.id},
        json=data,
        verify=verify,
        params=params
    )

    try:
        response.raise_for_status()
    except HTTPError as e:
        LOG.debug(e.response.content)
        for error in rest_utils.http_errors:
            if (e.response.status_code == getattr(error, 'status_code', 0) and
                    exceptions.HorizonException in error.__bases__):
                raise error
        raise

    return response


# Create some convenience partial functions
passthrough_get = functools.partial(_passthrough_request, requests.get)
passthrough_post = functools.partial(_passthrough_request, requests.post)
passthrough_put = functools.partial(_passthrough_request, requests.put)
passthrough_patch = functools.partial(_passthrough_request, requests.patch)
passthrough_delete = functools.partial(_passthrough_request, requests.delete)


def _get_service_url(request, service):
    """Get service's URL from keystone; allow an override in settings"""
    service_url = getattr(settings, service.upper() + '_URL', None)
    try:
        service_url = base.url_for(request, service)
    except exceptions.ServiceCatalogException:
        pass
    # Currently the keystone endpoint is http://host:port/
    # without the version.
    return service_url


@urls.register
class Passthrough(generic.View):
    """Pass-through API for executing service requests.

       Horizon only adds auth and CORS proxying.
    """
    url_regex = r'dns/(?P<path>.+)$'

    @rest_utils.ajax()
    def get(self, request, path):
        return passthrough_get(path, request).json()

    @rest_utils.ajax()
    def post(self, request, path):
        data = dict(request.DATA) if request.DATA else {}
        return passthrough_post(path, request, data).json()

    @rest_utils.ajax()
    def put(self, request, path):
        data = dict(request.DATA) if request.DATA else {}
        return passthrough_put(path, request, data).json()

    @rest_utils.ajax()
    def patch(self, request, path):
        data = dict(request.DATA) if request.DATA else {}
        return passthrough_patch(path, request, data).json()

    @rest_utils.ajax()
    def delete(self, request, path):
        return passthrough_delete(path, request).json()
