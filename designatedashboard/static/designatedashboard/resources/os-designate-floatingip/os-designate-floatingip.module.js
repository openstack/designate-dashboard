/**
 * (c) Copyright 2016 Hewlett Packard Enterprise Development LP
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may obtain
 * a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */

(function() {
  'use strict';

  /**
   * @ngdoc overview
   * @ngname designatedashboard.resources.os-designate-floatingip
   *
   * @description
   * Provides all of the services and widgets required
   * to support and display DNS (designate) floating ip related content.
   */
  angular
    .module('designatedashboard.resources.os-designate-floatingip', [
      'ngRoute',
      'designatedashboard.resources.os-designate-floatingip.actions',
      'designatedashboard.resources.os-designate-floatingip.details'
    ])
    .constant(
      'designatedashboard.resources.os-designate-floatingip.resourceType',
      'OS::Designate::FloatingIp')
    .config(config)
    .run(run);

  config.$inject = [ '$provide', '$windowProvider' ];

  function config($provide, $windowProvider) {
    var path = $windowProvider.$get().STATIC_URL + 'designatedashboard/resources/os-designate-floatingip/';
    $provide.constant('designatedashboard.resources.os-designate-floatingip.basePath', path);
  }

  run.$inject = [
    'horizon.app.core.detailRoute',
    'horizon.framework.conf.resource-type-registry.service',
    'designatedashboard.resources.os-designate-floatingip.api',
    'designatedashboard.resources.os-designate-floatingip.resourceType',
    'designatedashboard.resources.util'
  ];

  function run(
    detailRoute,
    registry,
    api,
    resourceTypeString,
    util)
  {
    var resourceType = registry.getResourceType(resourceTypeString);
    resourceType
      .setNames(gettext('Floating IP'), gettext('Floating IPs'))
      .setDefaultIndexUrl('/project/reverse_dns/')
      .setListFunction(listFloatingIps)
      .setProperty('id', {
        label: gettext('ID')
      })
      .setProperty('ptrdname', {
        label: gettext('PTR Domain Name'),
        filters: ['noName']
      })
      .setProperty('description', {
        label: gettext('Description'),
        filters: ['noName']
      })
      .setProperty('ttl', {
        label: gettext('Time To Live'),
        filters: ['noValue']
      })
      .setProperty('address', {
        label: gettext('Address'),
        filters: ['noName']
      })
      .setProperty('status', {
        label: gettext('Status'),
        filters: ['lowercase', 'noName'],
        values: util.statusMap()
      })
      .setProperty('action', {
        label: gettext('Action'),
        filters: ['lowercase', 'noName'],
        values: util.actionMap()
      });

    resourceType
      .tableColumns
      .append({
        id: 'address',
        priority: 1,
        sortDefault: true,
        template: '<a ng-href="{$ \'' + detailRoute + 'OS::Designate::FloatingIp/\' + item.id $}">{$ item.address $}</a>'
      })
      .append({
        id: 'ptrdname',
        filters: ['noValue'],
        priority: 1,
      })
      .append({
        id: 'status',
        filters: ['lowercase'],
        values: util.statusMap(),
        priority: 2
      });

    resourceType
      .filterFacets
      .append({
        label: gettext('Address'),
        name: 'address',
        isServer: false,
        singleton: true,
        persistent: false
      })
      .append({
        label: gettext('PTR Domain Name'),
        name: 'ptrdname',
        isServer: false,
        singleton: true,
        persistent: false
      })
      .append({
        label: gettext('Status'),
        name: 'status',
        isServer: false,
        singleton: true,
        persistent: false,
        options: [
          {label: gettext('Active'), key: 'active'},
          {label: gettext('Pending'), key: 'pending'}
        ]
      });

    function listFloatingIps() {
      return api.list().then(function onList(response) {
        // listFunctions are expected to return data in "items"
        response.data.items = response.data.floatingips;

        util.addTimestampIds(response.data.items);

        return response;
      });
    }
  }

})();
