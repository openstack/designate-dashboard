# Copyright (c) 2023 Binero
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

from designatedashboard.sdk_connection import get_sdk_connection
from django.views import generic
import logging

from openstack_dashboard.api.rest import urls
from openstack_dashboard.api.rest import utils as rest_utils


LOG = logging.getLogger(__name__)


def _sdk_object_to_list(object):
    """Converts an SDK generator object to a list of dictionaries.

    :param object: SDK generator object
    :returns: List of dictionaries
    """
    result_list = []
    for item in object:
        result_list.append(item.to_dict())
    return result_list


def create_zone(request):
    """Create zone."""
    data = request.DATA

    conn = get_sdk_connection(request)
    build_kwargs = dict(
        name=data['name'],
        email=data['email'],
        type=data['type'],
    )
    if data.get('description', None):
        build_kwargs['description'] = data['description']
    if data.get('ttl', None):
        build_kwargs['ttl'] = data['ttl']
    if data.get('masters', None):
        build_kwargs['masters'] = data['masters']

    zone = conn.dns.create_zone(**build_kwargs)
    return zone.to_dict()


def update_zone(request, **kwargs):
    """Update zone."""
    data = request.DATA
    zone_id = kwargs.get('zone_id')

    conn = get_sdk_connection(request)
    build_kwargs = dict(
        email=data['email'],
        description=data['description'],
        ttl=data['ttl'],
    )
    zone = conn.dns.update_zone(
        zone_id, **build_kwargs)
    return zone.to_dict()


@urls.register
class Zones(generic.View):
    """API for zones."""

    url_regex = r'dns/v2/zones/$'

    @rest_utils.ajax()
    def get(self, request):
        """List zones for current project."""
        conn = get_sdk_connection(request)
        zones = _sdk_object_to_list(conn.dns.zones())
        return {'zones': zones}

    @rest_utils.ajax(data_required=True)
    def post(self, request):
        """Create zone."""
        return create_zone(request)


@urls.register
class Zone(generic.View):
    """API for zone."""
    url_regex = r'dns/v2/zones/(?P<zone_id>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, zone_id):
        """Get zone."""
        conn = get_sdk_connection(request)
        zone = conn.dns.find_zone(zone_id)
        return zone.to_dict()

    @rest_utils.ajax(data_required=True)
    def patch(self, request, zone_id):
        """Edit zone."""
        kwargs = {'zone_id': zone_id}
        update_zone(request, **kwargs)

    @rest_utils.ajax()
    def delete(self, request, zone_id):
        """Delete zone."""
        conn = get_sdk_connection(request)
        conn.dns.delete_zone(zone_id, ignore_missing=True)


def create_recordset(request, **kwargs):
    """Create recordset."""
    data = request.DATA
    zone_id = kwargs.get('zone_id')

    conn = get_sdk_connection(request)
    build_kwargs = dict(
        name=data['name'],
        type=data['type'],
        ttl=data['ttl'],
        records=data['records'],
    )
    if data.get('description', None):
        build_kwargs['description'] = data['description']

    rs = conn.dns.create_recordset(
        zone_id, **build_kwargs)
    return rs.to_dict()


def update_recordset(request, **kwargs):
    """Update recordset."""
    data = request.DATA
    zone_id = kwargs.get('zone_id')
    rs_id = kwargs.get('rs_id')

    conn = get_sdk_connection(request)

    build_kwargs = dict()
    if data.get('description', None):
        build_kwargs['description'] = data['description']
    if data.get('ttl', None):
        build_kwargs['ttl'] = data['ttl']
    if data.get('records', None):
        build_kwargs['records'] = data['records']

    build_kwargs['zone_id'] = zone_id
    rs = conn.dns.update_recordset(
        rs_id, **build_kwargs)
    return rs.to_dict()


def _populate_zone_id(items, zone_id):
    for item in items:
        item['zone_id'] = zone_id
    return items


@urls.register
class RecordSets(generic.View):
    """API for recordsets."""
    url_regex = r'dns/v2/zones/(?P<zone_id>[^/]+)/recordsets/$'

    @rest_utils.ajax()
    def get(self, request, zone_id):
        """Get recordsets."""
        conn = get_sdk_connection(request)
        rsets = _sdk_object_to_list(conn.dns.recordsets(zone_id))
        return {'recordsets': _populate_zone_id(rsets, zone_id)}

    @rest_utils.ajax(data_required=True)
    def post(self, request, zone_id):
        """Create recordset."""
        kwargs = {'zone_id': zone_id}
        return create_recordset(request, **kwargs)


@urls.register
class RecordSet(generic.View):
    """API for recordset."""
    url_regex = r'dns/v2/zones/(?P<zone_id>[^/]+)/recordsets/(?P<rs_id>[^/]+)/$'  # noqa

    @rest_utils.ajax()
    def get(self, request, zone_id, rs_id):
        """Get recordset."""
        conn = get_sdk_connection(request)
        rs = conn.dns.get_recordset(rs_id, zone_id)
        rs_dict = rs.to_dict()
        rs_dict['zone_id'] = zone_id
        return rs_dict

    @rest_utils.ajax(data_required=True)
    def put(self, request, zone_id, rs_id):
        """Edit recordset."""
        kwargs = {'zone_id': zone_id, 'rs_id': rs_id}
        update_recordset(request, **kwargs)

    @rest_utils.ajax()
    def delete(self, request, zone_id, rs_id):
        """Delete recordset."""
        conn = get_sdk_connection(request)
        conn.dns.delete_recordset(rs_id, zone_id, ignore_missing=True)


@urls.register
class DnsFloatingIps(generic.View):
    """API for floatingips."""
    url_regex = r'dns/v2/reverse/floatingips/$'

    @rest_utils.ajax()
    def get(self, request):
        """Get floatingips."""
        conn = get_sdk_connection(request)
        fips = _sdk_object_to_list(conn.dns.floating_ips())
        return {'floatingips': fips}


def update_dns_floatingip(request, **kwargs):
    """Update recordset."""
    data = request.DATA
    fip_id = kwargs.get('fip_id')

    conn = get_sdk_connection(request)

    build_kwargs = dict(
        ptrdname=data['ptrdname'],
    )
    if data.get('description', None):
        build_kwargs['description'] = data['description']
    if data.get('ttl', None):
        build_kwargs['ttl'] = data['ttl']

    fip = conn.dns.update_floating_ip(
        fip_id, **build_kwargs)
    return fip.to_dict()


@urls.register
class DnsFloatingIp(generic.View):
    """API for dns floatingip."""
    url_regex = r'dns/v2/reverse/floatingips/(?P<fip_id>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, fip_id):
        """Get floatingip."""
        conn = get_sdk_connection(request)
        fip = conn.dns.get_floating_ip(fip_id)
        return fip.to_dict()

    @rest_utils.ajax(data_required=True)
    def patch(self, request, fip_id):
        """Edit floatingip."""
        kwargs = {'fip_id': fip_id}
        update_dns_floatingip(request, **kwargs)
