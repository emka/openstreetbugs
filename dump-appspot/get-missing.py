#!/usr/bin/env python
# -*- coding: utf-8 -*-

#
# Copyright 2009 Mitja Kleider
#
# This file is part of osb-relocation, a tool for Openstreetbugs.
#
# osb-relocation is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# osb-relocation is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with osb-relocation. If not, see <http://www.gnu.org/licenses/>.
#


from datetime import datetime
import urllib
from xml.dom import minidom
import MySQLdb

from dump import parseBoolString, queryparseBug 
import db_config # DATABASE CONFIGURATION

min_id = 1
max_id = 160000 # this may change in future


# some bugs are still missing in the dump, dump again and get those missing
def main():
	connection = MySQLdb.connect(db_config.host, user=db_config.user, passwd=db_config.password, db=db_config.dbname)
	cursor = connection.cursor()
	cursor.execute("SELECT id FROM bugs WHERE id <= %d" % max_id)
	result = cursor.fetchall()
	for id in range(min_id,max_id+1):
		if (id,) not in result:
			# fetch bug from openstreetbugs.appspot.com
			data = queryparseBug(id)
			if len(data) is not 0:
				print "fetched bug %d" %id
				sqlstr = """INSERT INTO bugs(id,lon,lat,text,type,last_changed,date_created,nearby_place) VALUES ("%(id)s","%(lon)s","%(lat)s","%(text)s","%(closed)s","%(datemodified)s","%(datecreated)s","%(nearbyplacename)s");\n""" % data
				cursor.execute(sqlstr)
				connection.commit()

main()
