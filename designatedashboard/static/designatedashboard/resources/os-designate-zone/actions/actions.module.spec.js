/**
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

  describe('zone actions module', function() {
    var registry;
    beforeEach(module('designatedashboard'));

    beforeEach(inject(function($injector) {
      registry = $injector.get('horizon.framework.conf.resource-type-registry.service');
    }));

    it('registers Create Zone as a global action', function() {
      var actions = registry.getResourceType('OS::Designate::Zone').globalActions;
      expect(actionHasId(actions, 'create')).toBe(true);
    });

    it('registers Update Zone as a item action', function() {
      var actions = registry.getResourceType('OS::Designate::Zone').itemActions;
      expect(actionHasId(actions, 'update')).toBe(true);
    });

    function actionHasId(list, value) {
      return list.filter(matchesId).length === 1;

      function matchesId(action) {
        if (action.id === value) {
          return true;
        }
      }
    }

  });

})();
