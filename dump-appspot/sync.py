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

import time
import datetime
from datetime import datetime
import urllib
from xml.dom import minidom
import MySQLdb
from MySQLdb.cursors import DictCursor

from dump import parseBoolString, queryparseBug 
import db_config # DATABASE CONFIGURATION


def main():
	connection = MySQLdb.connect(db_config.host, user=db_config.user, passwd=db_config.password, db=db_config.dbname,cursorclass=MySQLdb.cursors.DictCursor)
	cursor = connection.cursor()
	# get ids of open bugs and bugs which were closed less than a week ago
	cursor.execute("SELECT id, text, last_changed, nearby_place FROM bugs WHERE type = 0 OR TIMESTAMPDIFF(DAY, `last_changed`, NOW()) <= 7")
	for row in cursor:
		# fetch bug from openstreetbugs.appspot.com
		data = queryparseBug(row["id"])
		if data: # dict is not empty
			# compare data
			update = {} # store values which need to be updated here
			if data["closed"] == "1":
				update["type"] = data["closed"]

			# compare texts and add missing lines
			text1 = row["text"].split("<hr />")
			text2 = data["text"].encode('utf-8').split("<hr />")
			dict1 = dict(zip(text1,text1))
			missing = [x for x in text2 if x not in dict1]
			if missing: # list is not empty
				text1.extend(missing)
				update["text"] = "<hr />".join(text1)

			data["nearbyplacename"] = data["nearbyplacename"].encode('utf-8')
			if row["nearby_place"] != data["nearbyplacename"]:
				update["nearby_place"] = data["nearbyplacename"]

			# prepare MySQL query
			if update:
				sqlstr = "UPDATE bugs SET "
				for key in update:
					sqlstr += key + "=\"" + update[key] + "\","
				#sqlstr = sqlstr[:-1] # remove last comma
				sqlstr += "last_changed = NOW() WHERE id = %d;\n" %row["id"]
				print sqlstr
			# apply query to database
	# fetch new bugs


main()
