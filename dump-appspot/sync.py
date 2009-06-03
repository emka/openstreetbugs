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
from MySQLdb.cursors import DictCursor
import sys # for sys.stderr.write

from dump import parseBoolString, queryparseBug 
import db_config # DATABASE CONFIGURATION


def str2datetime(str):
	if str.find(".") != -1:
		## for Python 2.6+ just use
		# return datetime.strptime(str, "%Y-%m-%d %H:%M:%S.%f")

		## for Python below 2.6 use
		p1, p2 = str.split(".", 1)
		d = datetime.strptime(p1, "%Y-%m-%d %H:%M:%S")
		ms = int(p2.ljust(6,'0')[:6])
		return d.replace(microsecond=ms)
	elif str == "None": # unkown time in original database
		return datetime(2007,11,11,11,11,11,11) # at that time OSB did not exist yet
	else:
		return datetime.strptime(str, "%Y-%m-%d %H:%M:%S")


def main():
	connection = MySQLdb.connect(db_config.host, user=db_config.user, passwd=db_config.password, db=db_config.dbname,cursorclass=MySQLdb.cursors.DictCursor)
	cursor = connection.cursor()
	# get ids of open bugs and bugs which were closed less than a week ago
	cursor.execute("SELECT id, text, last_changed, nearby_place FROM bugs WHERE type = 0 OR TIMESTAMPDIFF(DAY, `last_changed`, NOW()) <= 7")
	result = cursor.fetchall()
	for row in result:
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

			lastchanged = str2datetime(data["datemodified"]).replace(microsecond=0)
			if row["last_changed"] < lastchanged:
				update["last_changed"] = datetime.isoformat(lastchanged, " ")

			data["nearbyplacename"] = data["nearbyplacename"].encode('utf-8')
			if row["nearby_place"] != data["nearbyplacename"]:
				update["nearby_place"] = data["nearbyplacename"]

			# prepare MySQL query
			if update:
				sqlstr = "UPDATE bugs SET "
				for key in update:
					sqlstr += key + "=\"" + update[key] + "\","
				sqlstr = sqlstr[:-1] # remove last comma
				sqlstr += " WHERE id = %d;" %row["id"]
				# apply query to database
				cursor.execute(sqlstr)
				connection.commit()

	# get the highest id in database
	# this assumes that the new bugs only added to this database start at 500000
	# and original bugs will never reach that value
	cursor.execute("SELECT MAX(id) FROM bugs WHERE id<500000;")
	result = cursor.fetchone()
	if result["MAX(id)"] < 160000:
		# fetch new bugs
		for i in range(result["MAX(id)"]+1,160000+1):
			data = queryparseBug(i)
			if len(data) is not 0:
				# prepare MySQL query
				sqlstr = """INSERT INTO bugs(id,lon,lat,text,type,last_changed,date_created,nearby_place) VALUES ("%(id)s","%(lon)s","%(lat)s","%(text)s","%(closed)s","%(datemodified)s","%(datecreated)s","%(nearbyplacename)s");""" % data
				# apply query to database
				cursor.execute(sqlstr)
				connection.commit()
	else:
		# need to change range
		sys.stderr.write("OSB synchronization error: bugcount in database is out of range.\nPlease update your script!\n")
	

main()
