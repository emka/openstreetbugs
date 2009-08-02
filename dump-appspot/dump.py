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
import urllib
from xml.dom import minidom


# True = 1, False = 0
def parseBoolString(theString):
	return theString[0]=='T'

def writeBugs(filename):
	FILE = open(filename, "a")
	for i in range(1,120000+1):
		data = queryparseBug(i)
		if len(data) is not 0:
			# prepare MySQL query
			sqlstr = """INSERT INTO bugs(id,lon,lat,text,type,last_changed,date_created,nearby_place) VALUES ("%(id)s","%(lon)s","%(lat)s","%(text)s","%(closed)s","%(datemodified)s","%(datecreated)s","%(nearbyplacename)s");\n""" % data
			# write query to file
			FILE.write(sqlstr.encode('utf-8'))
		if i%1000 == 0:
			# status report every 1000 bugs
			print "----- %d ----- " % (i)
	FILE.close()


def queryparseBug(id):
	try: query_iteration # check if query_iteration is defined
	except NameError: query_iteration = 0
	query_iteration = query_iteration+1 # count number of iterations
	url = "http://openstreetbugs.appspot.com/getGPXitem?id=%d" % (id)
	try:
		f = urllib.urlopen(url)
		item = f.read()
		data = {}
		# sometimes returns empty string, check that or fail
		if item != "":
			dom = minidom.parseString(item.replace("&","&amp;"))
			# read and store values
			data["lat"] = dom.getElementsByTagName('wpt')[0].attributes["lat"].value
			data["lon"] = dom.getElementsByTagName('wpt')[0].attributes["lon"].value
			data["id"] = dom.getElementsByTagName('name')[0].firstChild.data
			data["text"] = dom.getElementsByTagName('desc')[0].firstChild.data.replace('"','\\"').replace(" | ","<hr />")
			data["closed"] = "%d" %parseBoolString(dom.getElementsByTagName('closed')[0].firstChild.data)
			data["datecreated"] = dom.getElementsByTagName('datecreated')[0].firstChild.data
			data["datemodified"] = dom.getElementsByTagName('datemodified')[0].firstChild.data
			if dom.getElementsByTagName('nearbyplacename')[0].firstChild is not None:
				data["nearbyplacename"] = dom.getElementsByTagName('nearbyplacename')[0].firstChild.data.replace('"','\\"')
			else:
				data["nearbyplacename"] = "Unknown"
		return data
	except:
		#print "error at %d" % id
		if query_iteration < 100:
			return queryparseBug(id)  # try again
		else:
			return


def main():
	today = datetime.date.today()
	filename = "OpenStreetBugsDump_%s.sql" % today
	print "starting download to %s" % filename
	writeBugs(filename)
	print "done."

if __name__ == "__main__":
	main()
