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
   * @ngname designatedashboard.resources.os-designate-recordset
   *
   * @description
   * Provides all of the services and widgets required
   * to support and display DNS (designate) record set related content.
   */
  angular
    .module('designatedashboard.resources.os-designate-recordset', [
      'ngRoute',
      'designatedashboard.resources.os-designate-recordset.actions',
      'designatedashboard.resources.os-designate-recordset.details'
    ])
    .constant(
      'designatedashboard.resources.os-designate-recordset.resourceType',
      'OS::Designate::RecordSet')
    .constant(
      'designatedashboard.resources.os-designate-recordset.typeMap',
    {
      A: gettext('A - Address record'),
      AAAA: gettext('AAAA - IPv6 address record'),
      CNAME: gettext('CNAME - Canonical name record'),
      MX: gettext('MX - Mail exchange record'),
      PTR: gettext('PTR - Pointer record'),
      SPF: gettext('SPF - Sender Policy Framework'),
      SRV: gettext('SRV - Service locator'),
      SSHFP: gettext('SSHFP - SSH Public Key Fingerprint'),
      TXT: gettext('TXT - Text record'),
      SOA: gettext('SOA - Start of authority record'),
      NS: gettext('NS - Name server'),
      CAA: gettext('CAA - Certificate Authority Authorization record')
    })
    .constant(
      'designatedashboard.resources.os-designate-recordset.editableTypes',
    [
      "A",
      "AAAA",
      "CNAME",
      "MX",
      "NS",
      "PTR",
      "SPF",
      "SRV",
      "SSHFP",
      "TXT",
      "CAA"
    ])
    .config(config)
    .run(run);

  config.$inject = ['$provide', '$windowProvider'];

  function config($provide, $windowProvider) {
    var path = $windowProvider.$get().STATIC_URL +
               'designatedashboard/resources/os-designate-recordset/';
    $provide.constant('designatedashboard.resources.os-designate-recordset.basePath', path);
  }

  run.$inject = [
    'horizon.app.core.detailRoute',
    'horizon.framework.conf.resource-type-registry.service',
    'designatedashboard.resources.os-designate-recordset.api',
    'designatedashboard.resources.os-designate-recordset.resourceType',
    'designatedashboard.resources.os-designate-recordset.typeMap',
    'designatedashboard.resources.util'
  ];

  function run(detailRoute,
               registry,
               recordSetApi,
               resourceTypeString,
               typeMap,
               util) {
    var resourceType = registry.getResourceType(resourceTypeString);
    resourceType
      .setNames(gettext('DNS Record Set'), gettext('DNS Record Sets'))
      .setDefaultIndexUrl('/project/dnszones/')
      .setListFunction(list)
      .setProperty('id', {
        label: gettext('ID')
      })
      .setProperty('zone_id', {
        label: gettext('Zone ID'),
        filters: ['noValue']
      })
      .setProperty('zone_name', {
        label: gettext('Zone Name'),
        filters: ['noName']
      })
      .setProperty('project_id', {
        label: gettext('Project ID'),
        filters: ['noValue']
      })
      .setProperty('name', {
        label: gettext('Name'),
        filters: ['noName']
      })
      .setProperty('description', {
        label: gettext('Description'),
        filters: ['noName']
      })
      .setProperty('type', {
        label: gettext('Type'),
        filters: ['uppercase'],
        values: typeMap
      })
      .setProperty('ttl', {
        label: gettext('Time To Live'),
        filters: ['noValue']
      })
      .setProperty('records', {
        label: gettext('Records'),
        filters: ['noValue']
      })
      .setProperty('notes', {
        label: gettext('Notes'),
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
      })
      .setProperty('version', {
        label: gettext('Version'),
        filters: ['noValue']
      })
      .setProperty('created_at', {
        label: gettext('Created At'),
        filters: ['noValue']
      })
      .setProperty('updated_at', {
        label: gettext('Updated At'),
        filters: ['noValue']
      });

    resourceType
      .tableColumns
      .append({
        id: 'name',
        priority: 1,
        sortDefault: true,
        filters: ['noName'],
        // For link format, see pathGenerator in details.module.js
        template: '<a ng-href="{$ \'' + detailRoute +
                  'OS::Designate::RecordSet/\' + item.zone_id + \'/\' +' +
                  'item.id $}">{$ item.name $}</a>'
      })
      .append({
        id: 'type',
        priority: 2,
        filters: ['uppercase'],
        values: typeMap
      })
      .append({
        id: 'records',
        priority: 2,
        filters: ['noValue']
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
        label: gettext('Type'),
        name: 'type',
        isServer: false,
        singleton: true,
        persistent: false,
        options: Object.keys(typeMap).map(function toOptionLabel(key) {
          return {
            label: typeMap[key],
            key: key
          };
        })
      })
      .append({
        label: gettext('Name'),
        name: 'name',
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

    /*
     * list all recordsets within a zone. Requires "zoneId" in the params. All other
     * params will be passed unmodified as URL params to the API.
     *
     *  @param params
     * zoneId (required) list recordsets within the zone
     *
     * @returns {*|Object}
     */
    function list(params) {
      return recordSetApi.list(params.zoneId, params).then(function onList(response) {
        // listFunctions are expected to return data in "items"
        response.data.items = response.data.recordsets;

        util.addTimestampIds(response.data.items);

        return response;
      });
    }
  }

})();
