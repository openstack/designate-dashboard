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
    .factory('designatedashboard.resources.os-designate-recordset.actions.common-forms', service);

  service.$inject = [
    'designatedashboard.resources.os-designate-recordset.editableTypes',
    'designatedashboard.resources.os-designate-recordset.typeMap'
  ];

  /*
   * Service to return a schema form config for action forms. Especially useful for forms
   * like create and update that differ only in the readonly state of certain form fields.
   *
   * @returns {object} A schema form config
   */
  function service(editableTypes, typeMap) {
    var service = {
      getCreateFormConfig: getCreateFormConfig,
      getUpdateFormConfig: getUpdateFormConfig
    };

    return service;

    /////////////////

    /*
     * Returns the create form config
     * @returns {{schema, form, model}|*}
     */
    function getCreateFormConfig() {
      return getCreateUpdateFormConfig(false);
    }

    /*
     * Return the update form config
     * @returns {{schema, form, model}|*}
     */
    function getUpdateFormConfig() {
      return getCreateUpdateFormConfig(true);
    }

    /*
     * Return the create/update form.  The two forms are identical except for
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
            type: {
              type: "string",
              enum: editableTypes
            },
            ttl: {
              type: "integer",
              minimum: 1,
              maximum: 2147483647
            },
            records: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  record: {
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
            key: "type",
            readonly: readonly,
            title: gettext("Type"),
            description: gettext("Select the type of record set"),
            type: "select",
            titleMap: editableTypes.map(function toTitleMap(type) {
              return {
                value: type,
                name: typeMap[type]
              };
            }),
            required: true
          },
          {
            key: "name",
            readonly: readonly,
            type: "text",
            title: gettext("Name"),
            description: gettext("DNS name for the record set, ending in '.'"),
            validationMessage: gettext("DNS name must end with '.'"),
            placeholder: "www.example.com.",
            required: true
          },
          {
            key: "description",
            type: "textarea",
            title: gettext("Description"),
            description: gettext("Details about the zone.")
          },
          {
            key: "ttl",
            title: gettext("TTL"),
            description: gettext("Time To Live in seconds."),
            type: "number",
            required: true
          },
          {
            key: "records",
            title: gettext("Records"),
            type: "array",
            description: gettext("Records for the record set."),
            add: gettext("Add Record"),
            items: [
              {
                key: "records[].record",
                title: gettext("Record")
              }
            ],
            required: true
          }
        ],
        model: {
          type: "A",
          ttl: 3600
        }
      };
    }
  }
})();
