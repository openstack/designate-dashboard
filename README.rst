===============================
designatedashboard
===============================

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

2. Modify horizon's settings file to enabled designatedashboard, note the two lines to add below::

    import designatedashboard.enabled    # ADD THIS LINE

    ...

    INSTALLED_APPS = list(INSTALLED_APPS)  # Make sure it's mutable
    settings.update_dashboards([
       openstack_dashboard.enabled,
       openstack_dashboard.local.enabled,
       designatedashboard.enabled,      # ADD THIS LINE TOO
    ], HORIZON_CONFIG, INSTALLED_APPS)

3. (Optional) Copy the designate policy file into horizon's policy files folder, and add this config::

    'dns': 'designate_policy.json',

4. (Optional) Within your horizon settings file(s) (either the local settings or the other settings.py), add
   the line below.  This will make it so the record create/update screen uses a drop down of your floating ip
   addresses instead of a free form text field::

    DESIGNATE = { 'records_use_fips': True }
