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
   * @ngname designatedashboard.resources.os-designate-recordset.details
   *
   * @description
   * Provides details features for record sets.
   */
  angular.module('designatedashboard.resources.os-designate-recordset.details',
    ['horizon.framework.conf', 'horizon.app.core'])
    .run(run);

  run.$inject = [
    'designatedashboard.resources.os-designate-recordset.resourceType',
    'designatedashboard.resources.os-designate-recordset.api',
    'designatedashboard.resources.os-designate-recordset.basePath',
    'horizon.framework.conf.resource-type-registry.service'
  ];

  function run(
    recordSetResourceType,
    recordSetApi,
    basePath,
    registry
  ) {
    var resourceType = registry.getResourceType(recordSetResourceType);
    resourceType
      .setLoadFunction(loadFunction)
      .setPathGenerator(pathGenerator)
      .setPathParser(pathParser)
      .setSummaryTemplateUrl(basePath + 'details/drawer.html');

    /*
     *
     * @param identifier
     * The object returned by the pathParser containing the zone ID and record set ID to load
     */
    function loadFunction(identifier) {
      return recordSetApi.get(identifier.zoneId, identifier.recordSetId);
    }

    /*
     * Because a record set is contained by a zone, we implement a custom
     * pathGenerator to encode the zone ID and record set ID for the generic
     * details panel.
     *
     * @param item
     * A record set
     *
     * @returns {string} In format "<zone_id>/<recordset_id>"
     */
    function pathGenerator(item) {
      return item.zone_id + '/' + item.id;
    }

    /*
     * Given a path, extract the zone and record set ids
     *
     * @param path
     * created by pathGenerator
     *
     * @returns {{zoneId: *, recordSetId: *}}
     * The identifier to pass to the load function needed to uniquely identify
     * a record set.
     */
    function pathParser(path) {
      var split = path.split('/');
      return {
        zoneId: split[0],
        recordSetId: split[1]
      };
    }

    resourceType.detailsViews
      .prepend({
        id: 'recordsetDetailsOverview',
        name: gettext('Overview'),
        template: basePath + 'details/overview.html'
      }, 0);

    // Append a record set view to the zones resource view
    var zoneResourceType = registry.getResourceType("OS::Designate::Zone");
    zoneResourceType.detailsViews
      .append({
        id: 'zoneRecordSets',
        name: gettext('Record Sets'),
        template: basePath + 'details/zone-recordsets.html'
      });
  }

})();
