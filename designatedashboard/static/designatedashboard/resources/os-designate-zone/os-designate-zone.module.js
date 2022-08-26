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

(function () {
  'use strict';

  /**
   * @ngdoc overview
   * @ngname designatedashboard.resources.os-designate-zone
   *
   * @description
   * Provides all of the services and widgets required
   * to support and display DNS (designate) zone related content.
   */
  angular
    .module('designatedashboard.resources.os-designate-zone', [
      'ngRoute',
      'designatedashboard.resources.os-designate-zone.actions',
      'designatedashboard.resources.os-designate-zone.details'
    ])
    .constant(
      'designatedashboard.resources.os-designate-zone.resourceType',
      'OS::Designate::Zone')
    .config(config)
    .run(run);

  config.$inject = ['$provide', '$windowProvider'];

  function config($provide, $windowProvider) {
    var path = $windowProvider.$get().STATIC_URL + 'designatedashboard/resources/os-designate-zone/';
    $provide.constant('designatedashboard.resources.os-designate-zone.basePath', path);
  }

  run.$inject = [
    'horizon.app.core.detailRoute',
    'horizon.framework.conf.resource-type-registry.service',
    'designatedashboard.resources.os-designate-zone.api',
    'designatedashboard.resources.os-designate-zone.resourceType',
    'designatedashboard.resources.util'
  ];

  function run(detailRoute,
               registry,
               zoneApi,
               resourceTypeString,
               util) {
    var resourceType = registry.getResourceType(resourceTypeString);
    resourceType
      .setNames(gettext('DNS Zone'), gettext('DNS Zones'))
      .setDefaultIndexUrl('/project/dnszones/')
      .setListFunction(listZones)
      .setProperty('action', {
        label: gettext('Action'),
        filters: ['lowercase', 'noName'],
        values: util.actionMap()
      })
      .setProperty('attributes', {
        label: gettext('Attributes')
      })
      .setProperty('created_at', {
        label: gettext('Created At'),
        filters: ['noValue']
      })
      .setProperty('description', {
        label: gettext('Description'),
        filters: ['noName']
      })
      .setProperty('email', {
        label: gettext('Email'),
        filters: ['noName']
      })
      .setProperty('id', {
        label: gettext('ID')
      })
      .setProperty('masters', {
        label: gettext('Masters'),
        filters: ['noValue']
      })
      .setProperty('name', {
        label: gettext('Name'),
        filters: ['noName']
      })
      .setProperty('pool_id', {
        label: gettext('Pool ID')
      })
      .setProperty('project_id', {
        label: gettext('Project ID')
      })
      .setProperty('serial', {
        label: gettext('Serial'),
        filters: ['noValue']
      })
      .setProperty('status', {
        label: gettext('Status'),
        filters: ['lowercase', 'noName'],
        values: util.statusMap()
      })
      .setProperty('transferred_at', {
        label: gettext('Transferred At'),
        filters: ['noValue']
      })
      .setProperty('ttl', {
        label: gettext('Time To Live'),
        filters: ['noValue']
      })
      .setProperty('type', {
        label: gettext('Type'),
        filters: ['lowercase', 'noName'],
        values: typeMap()
      })
      .setProperty('updated_at', {
        label: gettext('Updated At'),
        filters: ['noValue']
      })
      .setProperty('version', {
        label: gettext('Version'),
        filters: ['noValue']
      });

    resourceType
      .tableColumns
      .append({
        id: 'name',
        priority: 1,
        sortDefault: true,
        template: '<a ng-href="{$ \'' + detailRoute + 'OS::Designate::Zone/\' + item.id $}">{$ item.name $}</a>'
      })
      .append({
        id: 'type',
        filters: ['lowercase'],
        values: typeMap(),
        priority: 2
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
        label: gettext('Name'),
        name: 'name',
        isServer: false,
        singleton: true,
        persistent: false
      })
      .append({
        label: gettext('Type'),
        name: 'type',
        isServer: false,
        singleton: true,
        persistent: false,
        options: [
          {label: gettext('Primary'), key: 'primary'},
          {label: gettext('Secondary'), key: 'secondary'}
        ]
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

    function typeMap() {
      return {
        'primary': gettext('Primary'),
        'secondary': gettext('Secondary')
      }
    }

    function listZones() {
      return zoneApi.list().then(function onList(response) {
        // listFunctions are expected to return data in "items"
        response.data.items = response.data.zones;

        util.addTimestampIds(response.data.items, 'id', 'updated_at');

        return response;
      });
    }
  }

})();
