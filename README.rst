========================
Team and repository tags
========================

.. image:: https://governance.openstack.org/tc/badges/designate-dashboard.svg
    :target: https://governance.openstack.org/tc/reference/tags/index.html

.. Change things from this point on

===================
designate dashboard
===================

Designate Horizon UI bits

* Free software: Apache license

Features
--------

* TODO


Howto
-----

1. Package the designatedashboard by running::

    python setup.py sdist

   This will create a python egg in the dist folder, which can be used to install
   on the horizon machine or within horizon's  python virtual environment.

   -- or --

   Install directly from source by running "python setup.py --install"

   Note:  On some systems python may throw an error like

      'Exception: Versioning for this project requires either an sdist tarball, or access 
       to an upstream git repository'

   this seems to be a result of mismatched pbr versioning.  A hacking workaround for development
   purposes is replacing the pbr call with a hard-coded version (e.g. '1.0.1') in
   designatedashboard/__init__.py.

2. Copy panel plugin files into your Horizon config.  These files can be found in designatedashboard/enabled
   and should be copied to /usr/share/openstack-dashboard/openstack_dashboard/local/enabled or the
   equivalent directory for your openstack-dashboard install.

3. Copy default config file into your Horizon config. The file can be found in designatedashboard/local_settings.d
   and should be copied to /etc/openstack-dashboard/local_settings.d or the equivalent directory
   for your openstack-dashboard install.

3. Make sure your keystone catalog contains endpoints for service type 'dns'.  If no such endpoints are
   found, the designatedashboard panels will not render.

4. (Optional) Copy the designate policy file into horizon's policy files folder.


Test
----

* How to run JS tests:

    * Install npm and nodejs=4.8.4

    $ ``sudo apt-get install npm``
    $ ``curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -``
    $ ``sudo apt-get install nodejs``

  1. ``npm install`` (to create virtual environment and install all dependencies in package.json)
  2. ``npm run lint`` for eslint
  3. ``npm run test`` for JS unit tests

