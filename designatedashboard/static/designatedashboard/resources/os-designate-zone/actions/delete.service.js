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
    .module('designatedashboard.resources.os-designate-zone.actions')
    .factory('designatedashboard.resources.os-designate-zone.actions.delete', action);

  action.$inject = [
    '$q',
    'designatedashboard.resources.os-designate-zone.api',
    'designatedashboard.resources.util',
    'horizon.app.core.openstack-service-api.policy',
    'horizon.framework.util.actions.action-result.service',
    'horizon.framework.util.i18n.gettext',
    'horizon.framework.util.q.extensions',
    'horizon.framework.widgets.modal.deleteModalService',
    'horizon.framework.widgets.toast.service',
    'designatedashboard.resources.os-designate-zone.resourceType'
  ];

  /*
   * @ngdoc factory
   * @name designatedashboard.resources.os-designate-zone.actions.delete
   *
   * @Description
   * Brings up the delete zone confirmation modal dialog.

   * On submit, delete given zone.
   * On cancel, do nothing.
   */
  function action(
    $q,
    zoneApi,
    util,
    policy,
    actionResultService,
    gettext,
    $qExtensions,
    deleteModal,
    toast,
    resourceType
  ) {
    var context, deleteZonePromise;
    var notAllowedMessage = gettext("You are not allowed to delete zones: %s");

    var service = {
      initAction: initAction,
      allowed: allowed,
      perform: perform
    };

    return service;

    //////////////

    function initAction() {
        context = { };
        deleteZonePromise = policy.ifAllowed({rules: [['dns', 'delete_zone']]});
    }

    function perform(items, scope) {
      var zones = angular.isArray(items) ? items : [items];
      context.labels = labelize(zones.length);
      context.deleteEntity = deleteZone;
      return $qExtensions
        .allSettled(zones.map(checkPermission))
        .then(
            afterCheck.bind(this, scope)
        );
    }

    function allowed(zone) {
      // only row actions pass in zone
      // otherwise, assume it is a batch action
      if (zone) {
        return $q.all([
          deleteZonePromise,
          util.notDeleted(zone),
          util.notPending(zone)
        ]);
      } else {
        return policy.ifAllowed({ rules: [['dns', 'delete_zone']] });
      }
    }

    function checkPermission(zone) {
      return {promise: allowed(zone), context: zone};
    }

    function afterCheck(scope, result) {
      var outcome = $q.reject().catch(angular.noop);  // Reject the promise by default
      if (result.fail.length > 0) {
        toast.add('error', getMessage(notAllowedMessage, result.fail));
        outcome = $q.reject(result.fail).catch(angular.noop);
      }
      if (result.pass.length > 0) {
        outcome = deleteModal.open(scope, result.pass.map(getEntity), context).then(createResult);
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
          'Confirm Delete Zone',
          'Confirm Delete Zones', count),

        message: ngettext(
          'You have selected "%s". Deleted zone is not recoverable.',
          'You have selected "%s". Deleted zones are not recoverable.', count),

        submit: ngettext(
          'Delete Zone',
          'Delete Zones', count),

        success: ngettext(
          'Deleted Zone: %s.',
          'Deleted Zones: %s.', count),

        error: ngettext(
          'Unable to delete Zone: %s.',
          'Unable to delete Zones: %s.', count)
      };
    }

    function deleteZone(zone) {
      return zoneApi.deleteZone(zone, true);
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
