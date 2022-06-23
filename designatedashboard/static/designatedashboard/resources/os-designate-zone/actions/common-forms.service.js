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
    .factory('designatedashboard.resources.os-designate-zone.actions.common-forms', service);

  service.$inject = [
  ];

  /**
   * Service to return a schema form config for action forms. Especially useful for forms
   * like create and update that differ only in the readonly state of certain form fields.
   *
   * @returns {object} A schema form config
   */
  function service() {
    var service = {
      getCreateFormConfig: getCreateFormConfig,
      getUpdateFormConfig: getUpdateFormConfig
    };

    return service;

    /////////////////

    /*
     * Returns the create zone form config
     * @returns {{schema, form, model}|*}
     */
    function getCreateFormConfig() {
      return getCreateUpdateFormConfig(false);
    }

    /*
     * Return the update zone form config
     * @returns {{schema, form, model}|*}
     */
    function getUpdateFormConfig() {
      return getCreateUpdateFormConfig(true);
    }

    /*
     * Return the create/update zone form.  The two forms are identical except for
     * during update, some fields are read-only.
     *
     * @param readonly - sets readonly value on form fields that change between update and create
     * @returns {object} a schema form config, including default model
     */
    function getCreateUpdateFormConfig(readonly) {
      return {
        schema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              pattern: /^.+\.$/
            },
            description: {
              type: "string"
            },
            email: {
              type: "string",
              format: "email",
              pattern: /^[^@]+@[^@]+$/
            },
            type: {
              type: "string",
              enum: [
                "PRIMARY",
                "SECONDARY"
              ]
            },
            ttl: {
              type: "integer",
              minimum: 1,
              maximum: 2147483647
            },
            masters: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  address: {
                    type: "string"
                  }
                }
              },
              minItems: 1,
              uniqueItems: true
            }
          }
        },
        form: [
          {
            key: "name",
            readonly: readonly,
            title: gettext("Name"),
            description: gettext("Zone name ending in '.'"),
            validationMessage: gettext("Zone must end with '.'"),
            placeholder: "example.com.",
            type: "text",
            required: true
          },
          {
            key: "description",
            type: "textarea",
            title: gettext("Description"),
            description: gettext("Details about the zone.")
          },
          {
            key: "email",
            title: gettext("Email Address"),
            description: gettext("Email address to contact the zone owner."),
            validationMessage: gettext("Email address must contain a single '@' character"),
            type: "text",
            condition: "model.type == 'PRIMARY'",
            required: true
          },
          {
            key: "ttl",
            title: gettext("TTL"),
            description: gettext("Time To Live in seconds."),
            type: "number",
            condition: "model.type == 'PRIMARY'",
            required: true
          },
          {
            key: "type",
            readonly: readonly,
            title: gettext("Type"),
            description: gettext("Select the type of zone"),
            type: "select",
            titleMap: [
              {
                value: "PRIMARY",
                name: gettext("Primary")
              },
              {
                value: "SECONDARY",
                name: gettext("Secondary")
              }
            ]
          },
          {
            key: "masters",
            readonly: readonly,
            title: gettext("Masters"),
            type: "array",
            description: gettext("DNS master(s) for the Secondary zone."),
            condition: "model.type == 'SECONDARY'",
            add: gettext("Add Master"),
            items: [
              {
                key: "masters[].address",
                title: gettext("IP Address")
              }
            ]
          }
        ],
        model: {
          type: "PRIMARY",
          ttl: 3600
        }
      };
    }
  }
})();
