/**
 * (c) Copyright 2016 Hewlett Packard Enterprise Development LP
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

(function() {
  'use strict';

  angular
    .module('designatedashboard.resources.os-designate-recordset.actions')
    .factory('designatedashboard.resources.os-designate-recordset.actions.delete', action);

  action.$inject = [
    '$q',
    'designatedashboard.resources.os-designate-recordset.api',
    'designatedashboard.resources.os-designate-recordset.editableTypes',
    'designatedashboard.resources.os-designate-recordset.resourceType',
    'horizon.app.core.openstack-service-api.policy',
    'horizon.framework.util.actions.action-result.service',
    'horizon.framework.util.i18n.gettext',
    'horizon.framework.util.q.extensions',
    'horizon.framework.widgets.modal.deleteModalService',
    'horizon.framework.widgets.toast.service'
  ];

  /*
   * @ngdoc factory
   * @name designatedashboard.resources.os-designate-recordset.actions.delete
   *
   * @Description
   * Brings up the delete recordset confirmation modal dialog.

   * On submit, delete given recordset.
   * On cancel, do nothing.
   */
  function action(
    $q,
    recordsetApi,
    editableTypes,
    resourceType,
    policy,
    actionResultService,
    gettext,
    $qExtensions,
    deleteModal,
    toast
  ) {
    var context, deletePromise;
    var notAllowedMessage = gettext("You are not allowed to delete record sets: %s");
    var allowedRecordsets = [];

    var service = {
      initAction: initAction,
      allowed: allowed,
      perform: perform
    };

    return service;

    //////////////

    function initAction() {
      context = { };
      deletePromise = policy.ifAllowed({rules: [['dns', 'delete_recordset']]});
    }

    function perform(items, scope) {
      var recordsets = angular.isArray(items) ? items : [items];
      context.labels = labelize(recordsets.length);
      context.deleteEntity = deleteRecordSet;
      return $qExtensions
        .allSettled(recordsets.map(checkPermission))
        .then(afterCheck.bind(this, scope));
    }

    function allowed(recordset) {
      // only row actions pass in recordset
      // otherwise, assume it is a batch action
      if (recordset) {
        return $q.all([
          deletePromise,
          editableRecordType(recordset)
        ]);
      } else {
        return policy.ifAllowed({ rules: [['dns', 'delete_recordset']] });
      }
    }

    function checkPermission(recordset) {
      return {promise: allowed(recordset), context: recordset};
    }

    function afterCheck(scope, result) {
      var outcome = $q.reject().catch(angular.noop);  // Reject the promise by default
      if (result.fail.length > 0) {
        toast.add('error', getMessage(notAllowedMessage, result.fail));
        outcome = $q.reject(result.fail).catch(angular.noop);
      }
      if (result.pass.length > 0) {
        // Remember the record sets we are allowed to delete so that on delete modal submit
        // we can map the recordset ID back to the full recordset. Then we can fetch the
        // corresponding zone ID
        allowedRecordsets = result.pass.map(getEntity)
        outcome = deleteModal.open(scope, allowedRecordsets, context).then(createResult);
      }
      return outcome;
    }

    function createResult(deleteModalResult) {
      // To make the result of this action generically useful, reformat the return
      // from the deleteModal into a standard form
      var actionResult = actionResultService.getActionResult();
      deleteModalResult.pass.forEach(function markDeleted(item) {
        actionResult.deleted(resourceType, getEntity(item).id);
      });
      deleteModalResult.fail.forEach(function markFailed(item) {
        actionResult.failed(resourceType, getEntity(item).id);
      });
      return actionResult.result;
    }

    function labelize(count) {
      return {

        title: ngettext(
          'Confirm Delete Record Set',
          'Confirm Delete Record Sets', count),

        message: ngettext(
          'You have selected "%s". Deleted record set is not recoverable.',
          'You have selected "%s". Deleted record sets are not recoverable.', count),

        submit: ngettext(
          'Delete Record Set',
          'Delete Record Sets', count),

        success: ngettext(
          'Deleted Record Set: %s.',
          'Deleted Record Sets: %s.', count),

        error: ngettext(
          'Unable to delete Record Set: %s.',
          'Unable to delete Record Sets: %s.', count)
      };
    }

    function editableRecordType(recordset) {
      return $qExtensions.booleanAsPromise(
        !(recordset.type == 'NS' && recordset.name == recordset.zone_name) && // not apex NS
        editableTypes.indexOf(recordset.type) > -1
      );
    }

    function deleteRecordSet(recordSetId) {
      var recordSet = allowedRecordsets.find(function(element) {
        return element.id === recordSetId;
      })
      return recordsetApi.deleteRecordSet(recordSet.zone_id, recordSet.id);
    }

    function getMessage(message, entities) {
      return interpolate(message, [entities.map(getName).join(", ")]);
    }

    function getName(result) {
      return getEntity(result).name;
    }

    function getEntity(result) {
      return result.context;
    }
  }
})();
