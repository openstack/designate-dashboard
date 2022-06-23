/**
 * (c) Copyright 2015 Hewlett-Packard Development Company, L.P.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may obtain
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

  /**
   * @ngdoc overview
   * @ngname designatedashboard
   *
   * @description
   * Provides the services and widgets required
   * to support and display the project search panel.
   */
  angular
    .module('designatedashboard', [
      'ngRoute',
      'designatedashboard.resources'
    ])
    .constant(
      'designatedashboard.apiPassthroughUrl', '/api/dns/')
    .config(config)
    .run(run);

  config.$inject = [
    '$provide',
    '$routeProvider',
    '$windowProvider'
  ];

  /**
   * @name designatedashboard.basePath
   * @description Base path for the project dashboard
   *
   * @param {function} $provide ng provide service
   *
   * @param {function} $routeProvider ng route service
   *
   * @param {function} $windowProvider NG window provider
   *
   * @returns {undefined}
   */
  function config($provide, $routeProvider, $windowProvider) {
    var path = $windowProvider.$get().STATIC_URL + 'designatedashboard/';
    $provide.constant('designatedashboard.basePath', path);

    $routeProvider
      .when('/project/dnszones/', {
        templateUrl: path + 'zones.html'
      })
      .when('/project/reverse_dns/', {
        templateUrl: path + 'reverse_dns.html'
      });
  }

  run.$inject = [
    'horizon.framework.conf.resource-type-registry.service',
    'designatedashboard.basePath'
  ];

  function run() {
//  function run(registry, basePath) {
    //registry.setDefaultSummaryTemplateUrl(basePath + 'table/default-drawer.html');
  }

})();
