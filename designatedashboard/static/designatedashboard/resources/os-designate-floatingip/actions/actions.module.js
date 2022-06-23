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
   * @ngname designatedashboard.resources.os-designate-floatingip.actions
   *
   * @description
   * Provides all of the actions for DNS Floating IPs.
   */
  angular.module('designatedashboard.resources.os-designate-floatingip.actions', [
    'horizon.framework.conf',
    'horizon.app.core'
  ])
    .run(run);

  run.$inject = [
    'horizon.framework.conf.resource-type-registry.service',
    'designatedashboard.resources.os-designate-floatingip.resourceType',
    'designatedashboard.resources.os-designate-floatingip.actions.set',
    'designatedashboard.resources.os-designate-floatingip.actions.unset'
  ];

  function run(registry, resourceTypeString, setAction, unsetAction) {
    var resourceType = registry.getResourceType(resourceTypeString);

    resourceType
      .itemActions
      .append({
        id: 'setFloatingIp',
        service: setAction,
        template: {
          text: gettext('Set')
        }
      })
      .append({
        id: 'unsetFloatingIp',
        service: unsetAction,
        template: {
          text: gettext('Unset')
        }
      });
  }

})();
