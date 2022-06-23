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
    .factory('designatedashboard.resources.os-designate-floatingip.actions.set', action);

  action.$inject = [
    '$q',
    'designatedashboard.resources.os-designate-floatingip.api',
    'designatedashboard.resources.os-designate-floatingip.resourceType',
    'designatedashboard.resources.util',
    'horizon.app.core.openstack-service-api.serviceCatalog',
    'horizon.framework.widgets.form.ModalFormService',
    'horizon.framework.widgets.toast.service',
    'horizon.framework.widgets.modal-wait-spinner.service'
  ];

  /*
   * @ngDoc factory
   * @name designatedashboard.resources.os-designate-floatingip.actions.set
   *
   * @Description
   * Brings up the Set Floating IP modal.
   */
  function action($q,
                  api,
                  resourceTypeName,
                  util,
                  serviceCatalog,
                  schemaFormModalService,
                  toast,
                  waitSpinner) {
    var dnsServiceEnabled;
    var title = null; // Set once perform is called
    var formConfig = {
      schema: {
        type: "object",
        properties: {
          ptrdname: {
            type: "string",
            pattern: /^.+\.$/
          },
          description: {
            type: "string"
          },
          ttl: {
            type: "integer",
            minimum: 0,
            maximum: 2147483647
          }
        }
      },
      form: [
        {
          key: "ptrdname",
          title: gettext("Domain Name"),
          description: gettext("Domain name ending in '.'"),
          validationMessage: gettext("Domain must end with '.'"),
          placeholder: "smtp.example.com.",
          type: "text",
          required: true
        },
        {
          key: "description",
          type: "textarea",
          title: gettext("Description"),
          description: gettext("Details about the PTR record.")
        },
        {
          key: "ttl",
          title: gettext("TTL"),
          description: gettext("Time To Live in seconds."),
          type: "number"
        }
      ]
    };

    var message = {
      success: gettext('Domain name PTR %s was successfully set.')
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
        // TODO (tyr) designate currently has no floating ips policy rules
        dnsServiceEnabled,
        util.notPending(item)
      ]);
    }

    function perform(item) {
      // Initialize the per-item title for use now and during submit
      title = gettext("Set Domain Name PTR for ") + item.address;
      formConfig.title = title;

      // Get a form model based on the current item
      formConfig.model = util.getModel(formConfig.form, item);

      // Initialize default data
      formConfig.model.ttl = formConfig.model.ttl || 3600;

      // Remember the ID for use during submit
      formConfig.model.floatingIpId = item.id;

      return schemaFormModalService.open(formConfig).then(onSubmit, onCancel);
    }

    function onSubmit(context) {
      var model = angular.copy(context.model);
      var floatingIpId = formConfig.model.floatingIpId;

      waitSpinner.showModalSpinner(title);
      return api.set(floatingIpId, model).then(onSuccess, onFailure);
    }

    function onCancel() {
      waitSpinner.hideModalSpinner();
    }

    function onSuccess(response) {
      waitSpinner.hideModalSpinner();
      var floatingIp = response.data;
      toast.add('success', interpolate(message.success, [floatingIp.ptrdname]));

      // To make the result of this action generically useful, reformat the return
      // from the deleteModal into a standard form
      return {
        created: [],
        updated: [{type: resourceTypeName, id: floatingIp.id}],
        deleted: [],
        failed: []
      };
    }

    function onFailure() {
      waitSpinner.hideModalSpinner();
    }
  }
})();
