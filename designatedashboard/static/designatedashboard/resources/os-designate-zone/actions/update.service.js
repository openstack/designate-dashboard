/**
 *
 * (c) Copyright 2016 Hewlett Packard Enterprise Development Company LP
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 * not use self file except in compliance with the License. You may obtain
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

  angular
    .module('designatedashboard.resources.os-designate-zone.actions')
    .factory('designatedashboard.resources.os-designate-zone.actions.update', action);

  action.$inject = [
    '$q',
    'designatedashboard.resources.os-designate-zone.actions.common-forms',
    'designatedashboard.resources.os-designate-zone.api',
    'designatedashboard.resources.os-designate-zone.resourceType',
    'designatedashboard.resources.util',
    'horizon.app.core.openstack-service-api.policy',
    'horizon.app.core.openstack-service-api.serviceCatalog',
    'horizon.framework.widgets.form.ModalFormService',
    'horizon.framework.widgets.toast.service',
    'horizon.framework.widgets.modal-wait-spinner.service'
  ];

  /*
   * @ngDoc factory
   * @name designatedashboard.resources.os-designate-zone.actions.update
   *
   * @Description
   * Brings up the Update Zone modal.
   */
  function action($q,
                  forms,
                  api,
                  resourceTypeName,
                  util,
                  policy,
                  serviceCatalog,
                  schemaFormModalService,
                  toast,
                  waitSpinner) {
    var updateZonePolicy;
    var title = gettext("Update Zone");
    var message = {
      success: gettext('Zone %s was successfully updated.')
    };

    var service = {
      initAction: initAction,
      allowed: allowed,
      perform: perform
    };

    return service;

    /////////////////

    function initAction() {
      updateZonePolicy = policy.ifAllowed({rules: [['dns', 'update_zone']]});
    }

    function allowed(zone) {
      // only supports row action (exactly 1 zone)
      if (zone) {
        return $q.all([
          updateZonePolicy,
          util.notDeleted(zone),
          util.notPending(zone)
        ]);
      } else {
        return false;
      }
    }

    function perform(item) {
      var formConfig = forms.getUpdateFormConfig();
      formConfig.title = title;
      formConfig.model = util.getModel(formConfig.form, item);

      // Append the id so it can be used on submit
      formConfig.model.id = item.id;

      // schema form doesn't appear to support populating the masters array directly
      // Map the masters objects to address objects
      if (item.hasOwnProperty("masters")) {
        var masters = item.masters.map(function (item) {
          return { address: item };
        });
        formConfig.masters = masters;
      }
      return schemaFormModalService.open(formConfig).then(onSubmit, onCancel);
    }

    function onSubmit(context) {
      var zoneModel = angular.copy(context.model);
      // schema form doesn't appear to support populating the masters array directly
      // Map the masters objects to simple array of addresses
      if (context.model.hasOwnProperty("masters")) {
        var masters = context.model.masters.map(function (item) {
          return item.address;
        });
        zoneModel.masters = masters;
      }

      waitSpinner.showModalSpinner(gettext('Updating Zone'));

      return api.update(zoneModel.id, zoneModel).then(onSuccess, onFailure);
    }

    function onCancel() {
      waitSpinner.hideModalSpinner();
    }

    function onSuccess(response) {
      waitSpinner.hideModalSpinner();
      var zone = response.data;
      toast.add('success', interpolate(message.success, [zone.name]));

      // To make the result of this action generically useful, reformat the return
      // from the deleteModal into a standard form
      return {
        created: [],
        updated: [{type: resourceTypeName, id: zone.id}],
        deleted: [],
        failed: []
      };
    }

    function onFailure() {
      waitSpinner.hideModalSpinner();
    }
  }
})();
