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
    .factory('designatedashboard.resources.os-designate-recordset.actions.create', action);

  action.$inject = [
    '$q',
    'designatedashboard.resources.os-designate-recordset.actions.common-forms',
    'designatedashboard.resources.os-designate-recordset.api',
    'designatedashboard.resources.os-designate-recordset.resourceType',
    'horizon.app.core.openstack-service-api.policy',
    'horizon.app.core.openstack-service-api.serviceCatalog',
    'horizon.framework.conf.resource-type-registry.service',
    'horizon.framework.widgets.form.ModalFormService',
    'horizon.framework.widgets.toast.service',
    'horizon.framework.widgets.modal-wait-spinner.service'
  ];

  /*
   * @ngDoc factory
   * @name designatedashboard.resources.os-designate-recordset.actions.create
   *
   * @Description
   * Brings up the Create Record Set modal.
   */
  function action($q,
                  forms,
                  api,
                  resourceTypeName,
                  policy,
                  serviceCatalog,
                  registry,
                  schemaFormModalService,
                  toast,
                  waitSpinner) {
    var createRecordSetPolicy, dnsServiceEnabled;
    var title = gettext("Create Record Set");
    var message = {
      success: gettext('Record Set %s was successfully created.')
    };

    var service = {
      initAction: initAction,
      allowed: allowed,
      perform: perform
    };

    return service;

    /////////////////

    function initAction() {
      createRecordSetPolicy = policy.ifAllowed({rules: [['dns', 'create_recordset']]});
      dnsServiceEnabled = serviceCatalog.ifTypeEnabled('dns');
    }

    function allowed() {
      return $q.all([
        createRecordSetPolicy,
        dnsServiceEnabled
      ]);
    }

    function perform(item) {
      var formConfig = forms.getCreateFormConfig();

      // Store the zone ID so it can be used on submit
      formConfig.model.zoneId = item.id;

      formConfig.title = title;
      return schemaFormModalService.open(formConfig).then(onSubmit, onCancel);
    }

    function onSubmit(context) {
      var model = angular.copy(context.model);
      var zoneId = model.zoneId;
      delete model.zoneId;

      // schema form doesn't appear to support populating arrays directly
      // Map the records objects to simple array of records
      var records = context.model.records.map(function (item) {
        return item.record;
      });
      model.records = records;

      waitSpinner.showModalSpinner(gettext('Creating Record Set'));
      return api.create(zoneId, model).then(onSuccess, onFailure);
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
        created: [{type: resourceTypeName, id: zone.id}],
        updated: [],
        deleted: [],
        failed: []
      };
    }

    function onFailure() {
      waitSpinner.hideModalSpinner();
    }
  }
})();
