/**
 * (c) Copyright 2016 Hewlett Packard Enterprise Development LP
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function () {
  'use strict';

  angular
    .module('designatedashboard.resources')
    .factory('designatedashboard.resources.util', utilService);

  utilService.$inject = [
    'horizon.framework.util.q.extensions'
  ];

  function utilService($qExtensions) {
    var service = {
      notDeleted: notDeleted,
      notPending: notPending,
      getModel: getModel,
      actionMap: actionMap,
      statusMap: statusMap,
      addTimestampIds: addTimestampIds
    };

    return service;

    ///////////////

    function notDeleted(resource) {
      return $qExtensions.booleanAsPromise(resource.status !== 'DELETED');
    }

    function notPending(resource) {
      return $qExtensions.booleanAsPromise(resource.status !== 'PENDING');
    }

    /*
     * Build a model object based on the given item, using only the fields
     * present in the form config 'key's. Only 'truthy' values are copied.
     *
     * @param form - an array of objects describing the form. Must have a 'key' attribute.
     * @param item - the data to copy into the model
     */
    function getModel(form, item) {
      var result = {};
      var value;
      form.forEach(function iterateForm(formItem) {
        value = item[formItem.key];
        if (value) {
          result[formItem.key] = item[formItem.key];
        }
      });
      return result;
    }

    function actionMap() {
      return {
        none: gettext('None'),
        create: gettext('Create')
      };
    }

    function statusMap() {
      return {
        active: gettext('Active'),
        pending: gettext('Pending')
      };
    }

    /*
     * hz-resource-table tracks by 'id' which doesn't change when an individual item is updated.
     * Create a synthetic '_timestampId' using the item id plus the specified timestamp field.
     * When this field is used as a track-by in hz-resource-table, items in the table to update
     * after row actions.
     *
     * If a timestamp field is not specified, the current time is used.
     *
     * @param items {object} - The items to add a _timestampId.
     * @param idField {string} - (Optional) A field on the item to use as the id. Defaults to 'id'
     * @param timestampField {string} - (Optional) A field on item to use as a timestamp. Defaults
     * to current time.
     */
    function addTimestampIds(items, idField, timestampField) {
      var _idField = idField || 'id';
      var timestamp = Date.now();
      items.map(function annotateFloatingIp(item) {
        if (angular.isDefined(timestampField)) {
          timestamp = item[timestampField];
        }
        item._timestampId = item[_idField] + timestamp;
      });
    }
  }
}());
