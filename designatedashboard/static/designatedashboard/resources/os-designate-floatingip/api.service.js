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
    .module('designatedashboard.resources.os-designate-floatingip')
    .factory('designatedashboard.resources.os-designate-floatingip.api', apiService);

  apiService.$inject = [
    'designatedashboard.apiPassthroughUrl',
    'horizon.framework.util.http.service',
    'horizon.framework.widgets.toast.service'
  ];

  /*
   * @ngdoc service
   * @param {Object} httpService
   * @param {Object} toastService
   * @name apiService
   * @description Provides direct access to Designate Floating IP APIs.
   * @returns {Object} The service
   */
  function apiService(apiPassthroughUrl, httpService, toastService) {
    var service = {
      list: list,
      get: get,
      set: set,
      unset: unset
    };

    return service;

    ///////////////

    /**
     * @name list
     * @description
     * Get a list of DNS floating ips.
     *
     * The listing result is an object with property "items." Each item is
     * a floating IP PTR record.
     *
     * @param {Object} params
     * Query parameters. Optional.
     *
     * @returns {Object} The result of the API call
     */
    function list(params) {
      var config = params ? {params: params} : {};
      return httpService.get(apiPassthroughUrl + 'v2/reverse/floatingips', config)
        .catch(function () {
          toastService.add('error', gettext('Unable to retrieve the floating ip PTRs.'));
        });
    }

    function get(id, params) {
      var config = params ? {params: params} : {};
      return httpService.get(apiPassthroughUrl + 'v2/reverse/floatingips/' + id, config)
        .catch(function () {
          toastService.add('error', gettext('Unable to get the floating ip PTR ' + id));
        });
    }

    /**
     * @name set
     * @description
     * Set a floating ip PTR record
     *
     * @param {string} floatingIpID - ID of PTR record to unset
     * @param {Object} data
     * Specifies the PTR information to set
     *
     * @returns {Object} The updated DNS floating IP object
     */
    function set(floatingIpID, data) {
      // The update API will not accept extra data. Restrict the input to only the allowed
      // fields
      var apiData = {
        ptrdname: data.ptrdname,
        description: data.description,
        ttl: data.ttl
      };
      return httpService.patch(
          apiPassthroughUrl + 'v2/reverse/floatingips/' + floatingIpID, apiData)
        .catch(function () {
          toastService.add('error', gettext('Unable to set the floating IP PTR record.'));
        });
    }

    /**
     * @name unset
     * @description
     * Unset a floating ip PTR record
     *
     * @param {string} floatingIpID - ID of PTR record to unset
     *
     * @returns {Object} The updated DNS floating IP object
     */
    function unset(floatingIpID) {
      // Unset is just a special case of 'set'
      return set(floatingIpID, {
        ptrdname: null,
        description: null,
        ttl: null
      });
    }
  }
}());
