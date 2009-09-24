#!/usr/bin/python

# this script extracts all translatable strings from the Javascript source
import re

# load source files
data=open("translation.js").read()
data+=open("openstreetbugs.js").read()

result=re.compile("_\('(.*?)'\)",re.M|re.DOTALL).findall(data) # find all strings inside _('example')
result = list(set(result)) # remove duplicates

for item in result:
	print "'" + item + "' : '',"
