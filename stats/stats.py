#!/usr/bin/env python
# -*- coding: utf-8 -*-

#
# Copyright 2009 Mitja Kleider
#
# This file is part of Openstreetbugs.
#
# Openstreetbugs is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Openstreetbugs is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with Openstreetbugs.  If not, see <http://www.gnu.org/licenses/>.
#

import MySQLdb
from datetime import datetime

import db_config # DATABASE CONFIGURATION

def main():
	print "Content-type: text/html\n"
	print """<html>
<head>
	<title>Stats (OpenStreetBugs)</title>
</head>
<body>
<h1>Stats</h1>
<p><a href="recentChanges">Recent Changes</a></p>
<p>All stats are live. (As of 2009-04-28, the database is synchronized with appspot database daily.)</p>
<h2>Bugs (total)</h2>"""
		
	connection = MySQLdb.connect(db_config.host, user=db_config.user, passwd=db_config.password, db=db_config.dbname)
	cursor = connection.cursor()
	cursor.execute("SELECT type,COUNT(*) FROM bugs GROUP BY type;")
	result = cursor.fetchall()
	bugcount = {}
	bugcount["open"] = result[0][1]
	bugcount["closed"] = result[1][1]
	bugcount["total"] = bugcount["open"] + bugcount["closed"]

	print """<table border="1">
	<tr><th>open</th><th>closed</th><th>total</th></tr>
	<tr><td>%(open)s</td><td>%(closed)s</td><td>%(total)s</td></tr>
</table>""" % bugcount

	print """<h2>Monthly changes</h2>
<p>Please note that the current month's data will not be complete until next month.</p>
<table border="1">"""
	
	# TODO loop for last 12 months
	print "<tr><th>month</th><th>new</th><th>closed</th>"
	for interval in range(-1,12):
		# select bug created in the month [current month - interval months]
		cursor.execute("""SELECT DATE_SUB(CURDATE(), INTERVAL """+"%d"%(interval+1)+""" MONTH) AS month, COUNT(*) as newbugs FROM bugs WHERE date_created < DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL """+"%d"%interval+""" MONTH), "%Y-%m-01") AND date_created >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL """+"%d"%(interval+1)+""" MONTH), "%Y-%m-01");""")
		result = cursor.fetchone()
		month = datetime.strftime(result[0],"%b %Y")
		newbugs = result[1]
		cursor.execute("""SELECT COUNT(*) as closedbugs FROM bugs WHERE type <> 0 and last_changed < DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL """+"%d"%interval+""" MONTH), "%Y-%m-01") AND last_changed >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL """+"%d"%(interval+1)+""" MONTH), "%Y-%m-01");""")
		result = cursor.fetchone()
		closedbugs = result[0]
		print "<tr><td>%s</td><td>%s</td><td>%s</td></tr>" % (month, newbugs, closedbugs)

	print "</body>\n</html>"

main()
