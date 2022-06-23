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
    .module('designatedashboard.resources.os-designate-floatingip.actions')
    .factory('designatedashboard.resources.os-designate-floatingip.actions.unset', action);

  action.$inject = [
    '$q',
    'designatedashboard.resources.os-designate-floatingip.api',
    'designatedashboard.resources.os-designate-floatingip.resourceType',
    'designatedashboard.resources.util',
    'horizon.app.core.openstack-service-api.serviceCatalog',
    'horizon.framework.util.q.extensions',
    'horizon.framework.widgets.form.ModalFormService',
    'horizon.framework.widgets.toast.service',
    'horizon.framework.widgets.modal-wait-spinner.service'
  ];

  /*
   * @ngDoc factory
   * @name designatedashboard.resources.os-designate-floatingip.actions.unset
   *
   * @Description
   * Brings up the Unset Floating IP modal.
   */
  function action($q,
                  api,
                  resourceTypeName,
                  util,
                  serviceCatalog,
                  $qExtensions,
                  schemaFormModalService,
                  toast,
                  waitSpinner) {
    var title = null; // Set on perform
    // currentFloatingIpId is used to remember the ID we are modifying since
    // it isn't returned by the unset API call
    var dnsServiceEnabled, currentFloatingIpId;

    // Unset it just a simple case of "set", but with ptrdname of 'null'
    var formConfig = {
      schema: {
        type: "object",
        properties: {
        }
      },
      form: [
      ],
      model: {
      }
    };

    var message = {
      success: gettext('Domain name PTR successfully unset.')
    };

    var service = {
      initAction: initAction,
      allowed: allowed,
      perform: perform
    };

    return service;

    /////////////////

    function initAction() {
      dnsServiceEnabled = serviceCatalog.ifTypeEnabled('dns');
    }

    function allowed(item) {
      return $q.all([
        // TODO (tyr) designate currently has no floating ip policy rules
        dnsServiceEnabled,
        domainNameSet(item),
        util.notPending(item)
      ]);
    }

    function domainNameSet(item) {
      return $qExtensions.booleanAsPromise(
        angular.isString(item.ptrdname)
      );
    }

    function perform(item) {
      title = gettext("Unset Domain Name PTR for ") + item.address;
      // Store the zone ID so it can be used on submit
      formConfig.model.floatingIpId = item.id;
      formConfig.title = title;
      return schemaFormModalService.open(formConfig).then(onSubmit, onCancel);
    }

    function onSubmit(context) {
      waitSpinner.showModalSpinner(title);
      currentFloatingIpId = context.model.floatingIpId;
      return api.unset(currentFloatingIpId).then(onSuccess, onFailure);
    }

    function onCancel() {
      waitSpinner.hideModalSpinner();
    }

    function onSuccess() {
      waitSpinner.hideModalSpinner();
      toast.add('success', message.success);

      // To make the result of this action generically useful, reformat the return
      // from the deleteModal into a standard form
      return {
        created: [],
        updated: [{type: resourceTypeName, id: currentFloatingIpId}],
        deleted: [],
        failed: []
      };
    }

    function onFailure() {
      waitSpinner.hideModalSpinner();
    }
  }
})();
