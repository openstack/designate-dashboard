/**
 * (c) Copyright 2016 Hewlett Packard Enterprise Development LP
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function() {
  "use strict";

  angular
    .module('designatedashboard.resources.os-designate-zone')
    .controller('designatedashboard.resources.os-designate-zone.detailController', controller);

  controller.$inject = [
    'designatedashboard.resources.os-designate-zone.resourceType',
    'horizon.framework.conf.resource-type-registry.service',
    '$scope'
  ];

  function controller(
    resourceTypeCode,
    registry,
    $scope
  ) {
    var ctrl = this;

    ctrl.item = {};
    ctrl.resourceType = registry.getResourceType(resourceTypeCode);

    $scope.context.loadPromise.then(onGetResponse);

    function onGetResponse(response) {
      ctrl.item = response.data;

      var attr = '';
      var keys = Object.keys(response.data.attributes);

      for (var i = keys.length - 1; i >= 0; i--) {
        attr += keys[i] + ':' + response.data.attributes[keys[i]] + ', ';
      }

      ctrl.item.attributes = attr;
    }
  }

})();
