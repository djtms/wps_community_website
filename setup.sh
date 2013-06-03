#!/bin/bash

if [ "x$USER" != "xroot" ]; then
	sudo ./$0 "$@"
	exit 0
fi

set -e

function die()
{
	echo "Error: $@" > /dev/stderr
	exit 1
}

# check root directory
[ "x$(pwd)" == "x/var/www" ] || die "website must be installed to /var/www"

# check lighttpd
which lighttpd || die "can not found lighttpd"

# stop system's lighttpd serve
/etc/init.d/lighttpd stop
update-rc.d lighttpd disable

# create own serve
update-rc.d -f lighttpd-wps-community remove 
cp "$(pwd)/setup/lighttpd.init" "/etc/init.d/lighttpd-wps-community"
[ -d "log" ] || mkdir log
update-rc.d lighttpd-wps-community start 09 2 3 4 5 . stop 09 0 1 6 .
update-rc.d lighttpd-wps-community enable
/etc/init.d/lighttpd restart

# change own of /var/www
chown -R www-data:www-data /var/www

