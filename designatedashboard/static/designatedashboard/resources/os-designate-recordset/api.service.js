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
    .module('designatedashboard.resources.os-designate-recordset')
    .factory('designatedashboard.resources.os-designate-recordset.api', apiService);

  apiService.$inject = [
    '$q',
    'designatedashboard.apiPassthroughUrl',
    'horizon.framework.util.http.service',
    'horizon.framework.widgets.toast.service'
  ];

  /*
   * @ngdoc service
   * @param {Object} httpService
   * @param {Object} toastService
   * @name apiService
   * @description Provides direct access to Designate Record Set APIs.
   * @returns {Object} The service
   */
  function apiService($q, apiPassthroughUrl, httpService, toastService) {
    var service = {
      get: get,
      list: list,
      deleteRecordSet: deleteRecordSet,
      create: create,
      update: update
    };

    return service;

    ///////////////

    /*
     * @name list
     * @description
     * Get a list of record sets.
     *
     * The listing result is an object with property "items." Each item is
     * a record set.
     *
     * @param {Object} params
     * Query parameters. Optional.
     *
     * @returns {Object} The result of the API call
     */
    function list(zoneId, params) {
      return httpService.get(apiPassthroughUrl + 'v2/zones/' + zoneId + '/recordsets/', params)
        .catch(function () {
          toastService.add('error', gettext('Unable to retrieve the record sets.'));
        });
    }

    /*
     * @name get
     * @description
     * Get a single record set by ID.
     *
     * @param {string} zoneId
     * Specifies the id of the zone containing the record set to request.
     *
     * @param {string} recordSetId
     * Specifies the id of the record set to request.
     *
     * @returns {Object} The result of the API call
     */
    function get(zoneId, recordSetId) {
      // Unfortunately routed-details-view is not happy when load fails, which is
      // common when then delete action removes a record set. Mask this failure by
      // always returning a successful promise instead of terminating the $http promise
      // in the .error handler.
      return httpService.get(
          apiPassthroughUrl + 'v2/zones/' + zoneId + '/recordsets/' + recordSetId + '/')
        .then(undefined, function onError() {
          toastService.add('error', gettext('Unable to retrieve the record set.'));
          return $q.when({});
        });
    }

    /*
     * @name delete
     * @description
     * Delete a single record set by ID
     * @param {string} zoneId
     * The id of the zone containing the recordset
     *
     * @param {string} recordSetId
     * The id of the recordset within the zone
     *
     * @returns {*}
     */
    function deleteRecordSet(zoneId, recordSetId) {
      return httpService.delete(
          apiPassthroughUrl + 'v2/zones/' + zoneId + '/recordsets/' + recordSetId + '/')
        .catch(function () {
          toastService.add('error', gettext('Unable to delete the record set.'));
        });
    }

    function create(zoneId, data) {
      return httpService.post(apiPassthroughUrl + 'v2/zones/' + zoneId + '/recordsets/', data)
        .catch(function () {
          toastService.add('error', gettext('Unable to create the record set.'));
        });
    }

    function update(zoneId, recordSetId, data) {
      // The update API will not accept extra data. Restrict the input to only the allowed
      // fields
      var apiData = {
        ttl: data.ttl,
        description: data.description,
        records: data.records
      };
      return httpService.put(
          apiPassthroughUrl + 'v2/zones/' + zoneId + '/recordsets/' + recordSetId, apiData)
        .catch(function () {
          toastService.add('error', gettext('Unable to update the record set.'));
        });
    }
  }
}());
