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
    .module('designatedashboard.resources.os-designate-recordset.actions')
    .factory('designatedashboard.resources.os-designate-recordset.actions.update', action);

  action.$inject = [
    '$q',
    'designatedashboard.resources.util',
    'designatedashboard.resources.os-designate-recordset.actions.common-forms',
    'designatedashboard.resources.os-designate-recordset.api',
    'designatedashboard.resources.os-designate-recordset.editableTypes',
    'designatedashboard.resources.os-designate-recordset.resourceType',
    'horizon.app.core.openstack-service-api.policy',
    'horizon.app.core.openstack-service-api.serviceCatalog',
    'horizon.framework.util.q.extensions',
    'horizon.framework.widgets.form.ModalFormService',
    'horizon.framework.widgets.toast.service',
    'horizon.framework.widgets.modal-wait-spinner.service'
  ];

  /*
   * @ngDoc factory
   * @name designatedashboard.resources.os-designate-recordset.actions.update
   *
   * @Description
   * Brings up the Update modal.
   */
  function action($q,
                  util,
                  forms,
                  api,
                  editableTypes,
                  resourceTypeName,
                  policy,
                  serviceCatalog,
                  $qExtensions,
                  schemaFormModalService,
                  toast,
                  waitSpinner) {
    var updateRecordSetPolicy;
    var title = gettext("Update Record Set");
    var message = {
      success: gettext('Record Set %s was successfully updated.')
    };

    var service = {
      initAction: initAction,
      allowed: allowed,
      perform: perform
    };

    return service;

    /////////////////

    function initAction() {
      updateRecordSetPolicy = policy.ifAllowed({rules: [['dns', 'update_recordset']]});
    }

    function allowed(recordset) {
      // only supports row action (exactly 1 recordset)
      if (recordset) {
        return $q.all([
          updateRecordSetPolicy,
          util.notDeleted(recordset),
          util.notPending(recordset),
          editableRecordType(recordset)
        ]);
      } else {
        return false;
      }
    }

    function editableRecordType(recordset) {
      return $qExtensions.booleanAsPromise(
        !(recordset.type === 'NS' && recordset.name === recordset.zone_name) && // not apex NS
        editableTypes.indexOf(recordset.type) > -1
      );
    }

    function perform(item) {
      var formConfig = forms.getUpdateFormConfig();
      formConfig.title = title;
      formConfig.model = util.getModel(formConfig.form, item);

      // Append the id and zoneId so it can be used on submit
      formConfig.model.id = item.id;
      formConfig.model.zoneId = item.zone_id;

      // schema form doesn't appear to support populating the records array directly
      // Map the records objects to record objects
      if (item.hasOwnProperty("records")) {
        var records = item.records.map(function (item) {
          return {record: item};
        });
        formConfig.model.records = records;
      }
      return schemaFormModalService.open(formConfig).then(onSubmit, onCancel);
    }

    function onSubmit(context) {
      var model = angular.copy(context.model);
      // schema form doesn't appear to support populating the records array directly
      // Map the records objects to simple array of records
      if (context.model.hasOwnProperty("records")) {
        var records = context.model.records.map(function (item) {
          return item.record;
        });
        model.records = records;
      }

      waitSpinner.showModalSpinner(gettext('Updating Record Set'));

      return api.update(model.zoneId, model.id, model).then(onSuccess, onFailure);
    }

    function onCancel() {
      waitSpinner.hideModalSpinner();
    }

    function onSuccess(response) {
      waitSpinner.hideModalSpinner();
      var recordset = response.data;
      toast.add('success', interpolate(message.success, [recordset.name]));

      // To make the result of this action generically useful, reformat the return
      // from the deleteModal into a standard form
      return {
        created: [],
        updated: [{type: resourceTypeName, id: recordset.id}],
        deleted: [],
        failed: []
      };
    }

    function onFailure() {
      waitSpinner.hideModalSpinner();
    }
  }
})();
