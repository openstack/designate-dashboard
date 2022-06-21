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
    .module('designatedashboard.resources.os-designate-zone')
    .factory('designatedashboard.resources.os-designate-zone.api', apiService);

  apiService.$inject = [
    'designatedashboard.apiPassthroughUrl',
    'horizon.framework.util.http.service',
    'horizon.framework.widgets.toast.service'
  ];

  /**
   * @ngdoc service
   * @param {Object} httpService
   * @param {Object} toastService
   * @name apiService
   * @description Provides direct access to Designate Zone APIs.
   * @returns {Object} The service
   */
  function apiService(apiPassthroughUrl, httpService, toastService) {
    var service = {
      get: get,
      list: list,
      deleteZone: deleteZone,
      create: create,
      update: update
    };

    return service;

    ///////////////
    
    /**
     * @name list
     * @description
     * Get a list of zones.
     *
     * The listing result is an object with property "items." Each item is
     * a zone.
     *
     * @param {Object} params
     * Query parameters. Optional.
     * 
     * @returns {Object} The result of the API call
     */
    /*
    function list(params) {
      var config = params ? {'params': params} : {};
      return httpService.get('/api/designate/zones/', config)
        .catch(function () {
          toastService.add('error', gettext('Unable to retrieve the zone.'));
        });
    }*/
    function list(params) {
      var config = params ? {'params': params} : {};
      return httpService.get(apiPassthroughUrl + 'v2/zones/', config)
        .catch(function () {
          toastService.add('error', gettext('Unable to retrieve the zone.'));
        });
    }

    /**
     * @name get
     * @description
     * Get a single zone by ID.
     *
     * @param {string} id
     * Specifies the id of the zone to request.
     *
     * @returns {Object} The result of the API call
     */
    function get(id) {
      return httpService.get(apiPassthroughUrl + 'v2/zones/' + id + '/')
        .catch(function () {
          toastService.add('error', gettext('Unable to retrieve the zone.'));
        });
    }

    /**
     * @name deleteZone
     * @description
     * Delete a single zone by ID
     * @param id
     * @returns {*}
     */
    function deleteZone(id) {
      return httpService.delete(apiPassthroughUrl + 'v2/zones/' + id + '/')
        .catch(function () {
          toastService.add('error', gettext('Unable to delete the zone.'));
        });
    }

    /**
     * @name create
     * @description
     * Create a zone
     *
     * @param {Object} data
     * Specifies the zone information to create
     *
     * @returns {Object} The created zone object
     */
    function create(data) {
      return httpService.post(apiPassthroughUrl + 'v2/zones/', data)
        .catch(function() {
          toastService.add('error', gettext('Unable to create the zone.'));
        })
    }

    /**
     * @name create
     * @description
     * Update a zone
     *
     * @param {Object} id - zone id
     * @param {Object} data to pass directly to zone update API
     * Specifies the zone information to update
     *
     * @returns {Object} The updated zone object
     */
    function update(id, data) {
      // The update API will not accept extra data. Restrict the input to only the allowed
      // fields
      var apiData = {
        email: data.email,
        ttl: data.ttl,
        description: data.description
      };
      return httpService.patch(apiPassthroughUrl + 'v2/zones/' + id + '/', apiData )
        .catch(function() {
          toastService.add('error', gettext('Unable to update the zone.'));
        })
    }
  }
}());
