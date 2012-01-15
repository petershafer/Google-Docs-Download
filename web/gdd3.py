#! /usr/bin/env python

import getpass
import os
import urllib
import urllib2
from xml.dom import minidom
import string
import datetime
import sys
from optparse import OptionParser
from time import strftime
import time
import math
import ConfigParser
import pickle
import hashlib

version = 0.81

totaltime = time.time()

recordtolog = True
datetag = None
debug = False
etags = {}
filesizes = []
filetimes = []
totalupdated = 0
filesdownloaded = []
successfuldocs = {}
prev_successfuldocs = {}

script_path = ""
if sys.path[0] != "":
	script_path = sys.path[0]+"/"

formats = {'mso':("doc","xls","ppt","png"),'oo':("odt","ods","ppt","png"),'pdf':("pdf","pdf","pdf","pdf"),'txt':("txt","csv","txt","png"),'html':("zip","html","swf","png"),}
format = "mso"
docfmt = formats[format][0]
spdfmt = formats[format][1]
prsfmt = formats[format][2]
drwfmt = formats[format][3]

def showVersion(verbose):
	if verbose:
		print "Current version of gdd.py:", version
	try:
		vreq = urllib2.Request("http://www.1st-soft.net/gdd/version2.txt")
		vresponse = urllib2.urlopen(vreq).read()
		if verbose:
			print "Most recent version is " + vresponse.strip()
		if float(vresponse) > version:
			print "Your version of gdd.py is out of date!"
			print "Visit http://www.1st-soft.net/gdd for an updated version."
		else:
			if verbose:
				print "gdd.py is currently up to date."
	except urllib2.HTTPError:
		if verbose:
			print "Could not contact 1st-soft.net for most recent version."
	except urllib2.URLError:
		if verbose:
			print "Could not contact 1st-soft.net for most recent version."

###########################
# Acquire Configuration
###########################

parser = OptionParser()
parser.add_option("--feed",dest="feed",	help="Feed URL")
parser.add_option("-m","--modified-only",dest="modified_only", action="store_true",help="Only download documents that have changed since last run.")
parser.add_option("-v","--version",dest="version", action="store_true",	help="Show the version number.")
parser.add_option("--format",dest="format",help="Sets the format that documents are downloaded as.  Please see readme.txt for valid formats.")
parser.add_option("--document-format",dest="docformat",	help="Sets the format that word processor documents are downloaded as.  Please see readme.txt for valid formats.")
parser.add_option("--spreadsheet-format",dest="spdformat",help="Sets the format that spreadsheets are downloaded as.  Please see readme.txt for valid formats.")
parser.add_option("--presentation-format",dest="prsformat",help="Sets the format that presentations are downloaded as.  Please see readme.txt for valid formats.")
parser.add_option("--drawing-format",dest="drwformat",help="Sets the format that drawings are downloaded as.  Please see readme.txt for valid formats.")
parser.add_option("--email",dest="email", help="Email address used to sign into google.")
parser.add_option("--password",	dest="password", help="Password used to sign into google.")
parser.add_option("--path",dest="path", help="Path to directory to store downloaded documents.")
parser.add_option("-d","--datetag",dest="datetag", action="store_true",help="Creates a sub directory tagged with the date to store downloaded files.")
parser.add_option("--debug", dest="debug", action="store_true", help="Prints debug text while running script.")
parser.add_option("--profile",dest="profile", default="Default", help="Profile to use in config.ini.")
parser.add_option("-u","--unicode",dest="unicode", action="store_true",help="Use full unicode file names.")
parser.add_option("-o","--override",dest="override", action="store_true",help="Override the file existence check.")
(options, args) = parser.parse_args()

cfg = {'email':'','password':'','path':'','override':False,'format':'mso','feed':'https://docs.google.com/feeds/default/private/full','document_format':'','spreadsheet_format':'','presentation_format':'','drawing_format':'','use_unicode':False,'use_datetag':False,'use_folders':False,'modified_only':False,'clean_up':False,'illegal_characters':'<>:"/\|?*^'}

# Config parsing
if os.path.exists(script_path+'config.ini'):
	config = ConfigParser.ConfigParser()
	config.readfp(open(script_path+'config.ini'))
	for key in cfg.keys():
		if config.has_option(options.profile, key):
			if config.get(options.profile, key) != "":
				if (key.find("use_") == 0 or key == "modified_only" or key == "clean_up" or key == "override"):
					cfg[key] = config.getboolean(options.profile, key)
				else:
					cfg[key] = config.get(options.profile, key)
	if cfg['format'].lower() not in formats:
		cfg['format'] = formats.keys()[0]
	

if cfg['document_format'] not in formats:
	cfg['document_format'] = formats[cfg['format']][0]
else:
	cfg['document_format'] = formats[cfg['document_format']][0]
		
if cfg['spreadsheet_format'] not in formats:
	cfg['spreadsheet_format'] = formats[cfg['format']][1]
else:
	cfg['spreadsheet_format'] = formats[cfg['spreadsheet_format']][1]
if cfg['presentation_format'] not in formats:
	cfg['presentation_format'] = formats[cfg['format']][2]
else:
	cfg['presentation_format'] = formats[cfg['presentation_format']][2]
if cfg['drawing_format'] in formats:
	cfg['drawing_format'] = formats[cfg['drawing_format']][3]
if cfg['drawing_format'] == "":
	cfg['drawing_format'] = formats[cfg['format']][3]	

# Set parameters
if options.feed!=None:
	cfg['feed'] = options.feed
if options.modified_only!=None:
	cfg['modified_only'] = options.modified_only
if options.version:
	showVersion(True)
	sys.exit(0)
if options.format!=None:
	format = options.format.lower()
	cfg['format'] = options.format.lower()
	if cfg['format'] in formats:
		cfg['document_format'] = formats[cfg['format']][0]
		cfg['spreadsheet_format'] = formats[cfg['format']][1]
		cfg['presentation_format'] = formats[cfg['format']][2]
		cfg['drawing_format'] = formats[cfg['format']][3]
	
if options.docformat!=None:
	val = options.docformat.lower()
	if val in formats:
		cfg['document_format'] = formats[val][0]
	else:
		cfg['document_format'] = val
if options.spdformat!=None:
	val = options.spdformat.lower()
	if val in formats:
		cfg['spreadsheet_format'] = formats[val][1]
	else:
		cfg['spreadsheet_format'] = val
if options.prsformat!=None:
	val = options.prsformat.lower()
	if val in formats:
		cfg['presentation_format'] = formats[val][2]
	else:
		cfg['presentation_format'] = val
if options.drwformat!=None:
	val = options.drwformat.lower()
	if val in formats:
		cfg['drawing_format'] = formats[val][3]
	else:
		cfg['drawing_format'] = val
if options.email!=None:
	val = options.email
	cfg['email'] = options.email
if options.password!=None:
	cfg['password'] = options.password
if options.path!=None:
	val = options.path
	if os.path.exists(val):
		cfg['path'] = val + "/"
		cfg['path'] = string.replace(cfg['path'],"//","/")
if options.datetag or cfg['use_datetag']:
	datetag = strftime("%Y-%m-%d_%Hh%Mm%Ss")
if options.debug:
	debug = True
if options.path!=None:
	print "Please set the path option in config.ini.  The path can no longer be set from the command line."
if options.unicode != None:
	cfg['use_unicode'] = options.unicode
if options.override != None:
	cfg['override'] = True

if debug:
	print "*"*64
	print "Arguments"
	print "*"*64
	for a in sys.argv:
		if a.find("--password")==0:
			a = a.split("=")
			a[1] = sensitive(a[1],"*")
			a = string.join(a,"=")
		print a,
	print ""
	print "*"*64



###########################
# Helper Functions
###########################

# Replaces sensitive strings with selected character 
def sensitive(text,rep):
	return rep*len(text)

def debugmsg(report):
	print "*"*64
	print "Debugging info"
	print "*"*64
	for key in report:
		print key + ":"
		print "\t" + report[key]
	print "*"*64

def getname(fname,title,ext):
	fname = urllib2.unquote(fname)
	fname = string.replace(fname,"\"","")
	fname = string.replace(fname,"/","_")
	fname = string.replace(fname,"\\","_")
	for i in range(len(cfg['illegal_characters'])):
		fname = string.replace(fname,cfg['illegal_characters'][i],"_")
	# elements from the xml doc are in unicode by default
	# encode to utf-8 for compatibility
	nfname = title.encode('utf-8')
	for i in range(len(cfg['illegal_characters'])):
		nfname = string.replace(nfname,cfg['illegal_characters'][i],"_")
	nfname = string.replace(nfname,"\"","")
	nfname = string.replace(nfname,"/","_")
	nfname = string.replace(nfname,"\\","_")
	if len(nfname)+len(ext)+1 > 255:
		nfname = nfname[:255-(len(ext)+1)]
	if ext != '':
		nfname = nfname+"."+ext
	return {'normal':fname,'unicode':nfname}

def dedupe(dname,fname,dfiles):
	ofname = fname.split(".") # original file name
	if len(ofname) > 1:
		ofnameext = "."+ofname.pop()
	else:
		ofnameext = ""
	ofname = string.join(ofname,".")
	dupcount = 1
	while os.path.exists(dname+"/"+fname) and dfiles.count(fname) > 0:
		fname = ofname+"_"+str(dupcount)+ofnameext
		dupcount+=1
	return fname


# Methods to be utilized when building folder structure
def getInfo(data,keys,type):
	rdata = [] # return data
	if data[0].keys().count(type) > 0:
		for x in keys:
			for y in data:
				if x == y['id']:
					rdata.append(y[type])
		return rdata
	else:
		return []
def listDir(data,lv=0,dir=['']):
	# path/auth[0]/datetag/dir
	print string.join(getInfo(data['folders'],dir,'title'),"/")
	current = dir[-1]
	for x in data['folders']:
		if x['parent'] == current:
			print (lv*'\t') + x['title']
			temp = dir
			temp.extend([x['id']])
			listDir(data,lv+1,temp)
	for x in data['urls']:
		if x['parent'] == current:
			print (lv*'\t') + x['title']
# Back to normal methods.

# Process the reply of an error from google.
def googleerror(content):
	errors = {
			'BadAuthentication':'The username or password is not recognized. ',
			'NotVerified':'The account email address has not been verified. Please access your Google account directly to resolve the issue before logging in using a non-Google application. ',
			'TermsNotAgreed':'User has not agreed to the terms of service.  Please access your Google account directly to resolve the issue before logging in using a non-Google application. ',
			'CaptchaRequired':'A CAPTCHA is required.  Please complete the CAPTCHA and try again.\nhttps://www.google.com/accounts/DisplayUnlockCaptcha',
			'Unknown':'The request contained invalid input or was malformed.',
			'AccountDeleted':'This account has been deleted.',
			'AccountDisabled':'This account has been disabled.',
			'ServiceDisabled':'This user\'s access to the specified service has been disabled. (The user account may still be valid.) ',
			'ServiceUnavailable':'The service is not available; try again later.',
		}
	lines = content.split("\n")
	errcode = ""
	for line in lines:
		if line.find("Error=") == 0:
			errcode = line.partition("=")[2]
	if errcode != "":
		print errors[errcode]

def getETags(user,feed):
	tagdir = {}
	feedhash = hashlib.md5(user+" :: "+feed).hexdigest()
	if not os.path.exists(script_path+"data/"+feedhash+".xml"):
		return {}
	f = open(script_path+"data/"+feedhash+".xml", "r")
	content = f.read()
	f.close()
	dom = minidom.parseString(content)
	entryid = ''
	for node in dom.getElementsByTagName('entry'):
		for i in node.childNodes:
			if i.nodeName == 'id':
				entryid = i.childNodes[0].nodeValue
		if entryid != '' and 'gd:etag' in node.attributes.keys():
			tagdir[entryid] = node.attributes['gd:etag'].value
		entryid = ''
	
	return tagdir

###########################
# Primary Functions
###########################

# Checks for user/pass globals and queries the user if not present.
# Returns a tuple containing the valid email address, document api authorization token, and spreadsheet api authorization token.
def login():
	global path
	global datetag
	
	if cfg['email'] == "":
		cfg['email'] = raw_input("Email: ")
	if cfg['password'] == "":
		cfg['password'] = getpass.getpass()

	url = 'https://www.google.com/accounts/ClientLogin'
	user_agent = 'GDD Python ' + str(version)
	values = {'Email' : cfg['email'], 'Passwd' : cfg['password'], 'accountType' : 'HOSTED_OR_GOOGLE', 'service' : 'writely', 'source' : user_agent, 'GData-Version': '3.0' }
	values2 = {'Email' : cfg['email'], 'Passwd' : cfg['password'], 'accountType' : 'HOSTED_OR_GOOGLE', 'service' : 'wise', 'source' : user_agent, 'GData-Version': '3.0' }
	headers = { 'User-Agent' : user_agent }
	docauth = ""
	docautho = ""
	spreadauth = ""
	spreadautho = ""
	
	try:
		data = urllib.urlencode(values)
		data2 = urllib.urlencode(values2)
		req = urllib2.Request(url, data, headers)
		req2 = urllib2.Request(url, data2, headers)
		response = urllib2.urlopen(req)
		response2 = urllib2.urlopen(req2)
		docautho = response.read()
		docauth = docautho.splitlines()[2].split("=")[1]
		spreadautho = response2.read()
		spreadauth = spreadautho.splitlines()[2].split("=")[1]
	
		print "Success!"
	
		print "Local Time: " + strftime("%c")
		try:
			print "Server Time: " + response.info().getheader('Date')
		except:
			print ""
	
		if(os.path.exists(cfg['path']+cfg['email']) == False):
			os.mkdir(cfg['path']+cfg['email'])
	
		if debug:
			values["Passwd"] = sensitive(cfg['password'],'.')
			values2["Passwd"] = sensitive(cfg['password'],'.')
			debugmsg({'Email Address':cfg['email'],'Password':sensitive(cfg['password'],'*'),'Post Data 1':urllib.urlencode(values),'Post Data 2':urllib.urlencode(values2),'Post URL':url})
	
	
		return (cfg['email'],docauth,spreadauth)

	
	except urllib2.HTTPError, e:
		print "failed! httperror"
		try:
			print "Local Time: " + strftime("%c") 
			print "Server Time: " + e.info().getheader('Date')
		except:
			print ""
		errormsg = e.read()
		googleerror(errormsg)
		if debug:
			print e
			values["Passwd"] = sensitive(cfg['password'],'.')
			values2["Passwd"] = sensitive(cfg['password'],'.')
			print e.read()
			debugmsg({'Email Address':cfg['email'],'Password':sensitive(cfg['password'],'*'),'Post Data 1':urllib.urlencode(values),'Post Data 2':urllib.urlencode(values2),'Post URL':url})
		sys.exit(0)
	except urllib2.URLError, e:
		print "failed! urlerror"
		try:
			print "Local Time: " + strftime("%c") 
			print "Server Time: " + e.info().getheader('Date')
		except:
			print ""
		print e.reason
		if debug:
			values["Passwd"] = sensitive(cfg['password'],'.')
			values2["Passwd"] = sensitive(cfg['password'],'.')
			print e.read()
			debugmsg({'Email Address':cfg['email'],'Password':sensitive(cfg['password'],'*'),'Post Data 1':urllib.urlencode(values),'Post Data 2':urllib.urlencode(values2),'Post URL':url})
		sys.exit(0)
	except:
		print "failed! other error"
		try:
			print "Local Time: " + strftime("%c") 
			print "Server Time: " + e.info().getheader('Date')
		except:
			print ""
		if debug:
			values["Passwd"] = sensitive(cfg['password'],'.')
			values2["Passwd"] = sensitive(cfg['password'],'.')
			print e
			print e.read()
			debugmsg({'Email Address':cfg['email'],'Password':sensitive(cfg['password'],'*'),'Post Data 1':urllib.urlencode(values),'Post Data 2':urllib.urlencode(values2),'Post URL':url})
		sys.exit(0)
	

# Retrieves a document feed from google.
# Requires the authorization tuple acquired through login(), a feed url, and the last date documents were downloaded (none if you wish to download all.)
# Returns a dictionary including whether the attempt was successful, the xml document retrieved, and the total number of documents in the feed.
def getFeed(auth,feed,tries=0):
	user_agent = 'GDD Python '+str(version)
	allurl = feed
	feedxml = ""
	totaldocs = -1
	try:
		url = feed
		req = urllib2.Request(url)
		req.add_header('Authorization','GoogleLogin auth='+auth[1])
		req.add_header('GData-Version','3.0')
		response = urllib2.urlopen(req)
		# feeds from google are always utf-8
		feedxml = response.read()
		if debug:
			debugmsg({'Feed URL':url,'Authorization':'GoogleLogin auth='+sensitive(auth[1],'*'),'Modified Only':str(cfg['modified_only'])})
	except:
		if tries < 3:
			print "Feed request failed.  Retrying..."
			if debug:
				debugmsg({'Feed URL':url,'Authorization':'GoogleLogin auth='+sensitive(auth[1],'*'),'Modified Only':str(cfg['modified_only'])})
			return getFeed(auth,feed,tries+1)
		else:
			print "Feed request failed.  Giving up for now."
			sys.exit(0)
	return {'success':True,'feedxml':feedxml,}

def getWorksheets(auth,id,tries=0):
	user_agent = 'GDD Python '+str(version)
	feedxml = ""
	total = 0
	sheets = []
	try:
		url = "https://spreadsheets.google.com/feeds/worksheets/"+id+"/private/full"
		req = urllib2.Request(url)
		req.add_header('Authorization','GoogleLogin auth='+auth[2])
		req.add_header('GData-Version','3.0')
		response = urllib2.urlopen(req)
		# feeds from google are always utf-8
		feedxml = response.read()
		dom = minidom.parseString(feedxml)
		i = 0
		for node in dom.getElementsByTagName('entry'):
			title = "Worksheet " + str(i+1)
			for j in node.childNodes:
				if j.nodeName == 'title':
					title = j.childNodes[0].nodeValue
			sheets.append(title)
			i += 1
		return sheets
	except:
		if tries < 3:
			return getWorksheets(auth,id,tries+1)
		else:
			return []

def parseFeed(xml,auth=('','','')):
	# xml is raw file from google in utf-8 encoding
	# minidom always assumes input is utf-8
	dom = minidom.parseString(xml)
	totaldocs = len(dom.getElementsByTagName('entry'))
	# all output from the minidom operations is unicode
	docs = []
	urls = []
	folders = []
	for node in dom.getElementsByTagName('entry'):
		updated = ''
		parent = ''
		title = ''
		doc = ''
		id = ''
		src = ''
		if 'gd:etag' in node.attributes.keys():
			etag = node.attributes['gd:etag'].value
		else:
			etag = ''
		for i in node.childNodes:
			if i.nodeName == 'gd:resourceId':
				doc = i.childNodes[0].nodeValue
			if i.nodeName == 'updated':
				updated = i.childNodes[0].nodeValue
			if i.nodeName == 'title':
				title = i.childNodes[0].nodeValue
			if i.nodeName == 'id':
				id = i.childNodes[0].nodeValue
			if i.nodeName == 'content' and i.attributes.has_key('src'):
				src = i.attributes['src'].value
			if i.nodeName == 'link' and i.attributes.keys().count('rel') > 0:
				if i.attributes['rel'].value.find("#parent") != -1 and i.attributes.keys().count('href') > 0:
					parent = i.attributes['href'].value
		if doc.find("spreadsheet") != -1 and cfg['spreadsheet_format'] in ['csv','tsv','html']:
			sheets = []
			if doc.find(":") != -1:
				ssid = doc.partition(":")[2]
				sheets = getWorksheets(auth,ssid)
			else:
				sheets = []
			if sheets == []:
				docs.append({'doc':doc,'title':title,'parent':parent,'id':id,'src':src,'etag':etag})
			else:
				j = 0
				for k in sheets:
					docs.append({'doc':doc,'title':title + " (" + k + ")",'parent':parent,'id':id,'src':src+"&gid="+str(j),'etag':etag})
					j += 1
		else:
			if src != '':
				docs.append({'doc':doc,'title':title,'parent':parent,'id':id,'src':src,'etag':etag})
			else:
				print "NOTICE: " + title + " looks like a table. GDD can't download tables at this time."
	for x in docs:
		z = string.split(x['doc'],":")
		type = z[0]
		id = z[1]
		title = x['title']
		if type == "document":
			urls.append({'parent':x['parent'],'id':x['id'],'type':type,'title':title,'etag':x['etag'],'url':x['src']+"&exportFormat="+cfg['document_format']})
		elif type == "spreadsheet":
			urls.append({'parent':x['parent'],'id':x['id'],'type':type,'title':title,'etag':x['etag'],'url':x['src']+"&exportFormat="+cfg['spreadsheet_format']})
		elif type == "pdf":
			urls.append({'parent':x['parent'],'id':x['id'],'type':type,'title':title,'etag':x['etag'],'url':x['src']})
		elif type == "presentation":
			urls.append({'parent':x['parent'],'id':x['id'],'type':type,'title':title,'etag':x['etag'],'url':x['src']+"&exportFormat="+cfg['presentation_format']})
		elif type == "drawing":
			urls.append({'parent':x['parent'],'id':x['id'],'type':type,'title':title,'etag':x['etag'],'url':x['src']+"&exportFormat="+cfg['drawing_format']})
		elif type == "folder":
			folders.append({'parent':x['parent'],'id':x['id'],'title':title,'children':[]})
		else:
			urls.append({'parent':x['parent'],'id':x['id'],'type':type,'title':title,'etag':x['etag'],'url':x['src']})
	return {'urls':urls,'folders':folders,'totaldocs':totaldocs}

def getFile(doc,headers,dname,tries=0):
	global options
	global filesdownloaded
	global etags
	global totalupdated
	starttime = 0
	endtime = 0
	if dname != "" and dname[-1] != "/":
		dname = dname+"/"
	

	if doc['type'] != "file":
		if cfg.has_key(doc['type']+'_format'):
			docfmt = cfg[doc['type']+'_format']
		else:
			if doc['type'] == "pdf":
				docfmt = "pdf"
			elif doc['type'] == "drawing":
				docfmt = "png"
			else:
				docfmt = ''
	else:
		docfmt = ''

	names = getname('',doc['title'],docfmt)
	if doc['id'] in prev_successfuldocs:
		names['normal'] = prev_successfuldocs[doc['id']]
	
	if cfg['use_unicode'] or names['normal'] == "":
		fname = names['unicode']
	else:
		fname = names['normal']
	fname = dedupe(dname,fname,filesdownloaded)
	
	does_file_exist = False
	if os.path.exists(dname+fname) or cfg['override']:
		does_file_exist = True
	if cfg['modified_only'] and doc['id'] in etags and doc['etag'] == etags[doc['id']] and doc['id'] in prev_successfuldocs.keys() and does_file_exist:
		print fname + " is already up to date."
		filesdownloaded.append(fname)
		successfuldocs[doc['id']] = fname
		return {'success':True,'file':fname}
	
	req = urllib2.Request(doc['url'])
	
	
	
	
	for k, v in headers.iteritems():
		req.add_header(k, v)
	
	try:
		try:
			starttime = time.time()
		except:
			print ""
		cderror = False
		fname = "Document"
		totalupdated += 1
		try:
			print "Downloading",
		except:
			print "Downloading document ..."
		sys.stdout.flush()
	
	
		f = urllib2.urlopen(req)
		
		
		if(f.info().getheader('Content-Disposition') != None and f.info().getheader('Content-Disposition') != "" and not cfg['use_unicode']):
			suggestedname = f.info().getheader('Content-Disposition').partition("=")[2]
			names = getname(suggestedname,doc['title'],docfmt)
		if cfg['use_unicode'] or names['normal'] == "":
			fname = names['unicode']
		else:
			fname = names['normal']
		fname = dedupe(dname,fname,filesdownloaded)
		# Throws unicode decode errors in certain situations
		# Previously fname was a unicode string if the unicode flag is used.
		# Now it should always be utf-8 or the default encoding
		print fname + "...",
		sys.stdout.flush()
		local = open(dname+fname, "wb")
		
		chunkSize = 10240
		while 1:
			dbuffer = f.read(chunkSize)
			if dbuffer:
				local.write(dbuffer)
			else:
				break
		local.close()
		filesdownloaded.append(fname)
		successfuldocs[doc['id']] = fname
		try:
			endtime = time.time()
		except:
			print ""
		
		filesizes.append(os.path.getsize(dname+fname))
		filetimes.append(endtime-starttime)
		
		print "done"
		return {'success':True,'file':fname}
	except urllib2.HTTPError, e:
		if tries < 3:
			print "\nThere was an error downloading this document.  Retrying..."
			return getFile(doc,headers,dname,tries+1)
		else:
			print "\nThere was an error downloading " + doc['url'] + ". Giving up for now."
			return {'success':False,'file':''}
	except urllib2.URLError, e:
		if tries < 3:
			print "\nThere was an error downloading this document.  Retrying..."
			return getFile(doc,headers,dname,tries+1)
		else:
			print "\nThere was an error downloading " + doc['url'] + ". Giving up for now."
			print e.reason
			return {'success':False,'file':''}
	except:
		if tries < 3:
			print "\nThere was an error downloading this document.  Retrying..."
			return getFile(doc,headers,dname,tries+1)
		else:
			print "\nThere was an error downloading " + doc['url'] + ". Giving up for now."
			return {'success':False,'file':''}
	


def download(auth,urls):
	docs = urls
	global datetag
	global path
	noerror = True
	files = []
	if datetag != None:
		dtpath = "/"+datetag
	else:
		dtpath = ""
	for i in docs:
		if i['type'] != "spreadsheet":
			result = getFile(i,{'Authorization':'GoogleLogin auth=' + auth[1], 'GData-Version': '3.0'}, cfg['path']+auth[0]+dtpath)
			noerror = result['success'] and noerror
			files.append(result['file'])
		else:
			result = getFile(i,{'Authorization':'GoogleLogin auth=' + auth[2], 'GData-Version': '3.0'}, cfg['path']+auth[0]+dtpath)
			noerror = result['success'] and noerror
			files.append(result['file'])
	return {'success':noerror,'files':files}


###########################
# Main Routine
###########################

if cfg['path'] != "" and cfg['path'][-1] != "/":
	cfg['path'] = cfg['path']+"/"

if(os.path.exists(script_path+"data") == False):
	os.mkdir(script_path+"data")

print "Welcome to Google Docs: Download for Python".center(64,"=")
print "Authenticating..."

auth = login()
etags = getETags(auth[0],cfg['feed'])

feedhash = hashlib.md5(auth[0]+" :: "+cfg['feed']).hexdigest()

try:
	if os.path.exists(script_path+"data/"+feedhash+".log"):
		f = open(script_path+"data/"+feedhash+".log", "r")
		prev_successfuldocs = pickle.load(f)
		f.close()
except:
	if debug:
		print "Unable to open log file."

print "Retrieving list of documents...",
feedxml = ""
if auth[0] != "" and auth[1] != "":
	feeddata = getFeed(auth,cfg['feed'])
	feedxml = feeddata['feedxml']
if feeddata['success']:
	print "done."
	docfeed = parseFeed(feedxml,auth)

	urls = docfeed['urls']
	print "Checking your documents".center(64,"=")
	if datetag != None and os.path.exists(cfg['path']+auth[0]+"/"+datetag) == False:
		os.mkdir(cfg['path']+auth[0]+"/"+datetag)

	result = download(auth,urls)
	recordtolog = result['success'] and recordtolog
	if len(result['files']) == 0:
		if not cfg['modified_only']:
			print "No documents to download.".center(64,"=")
		else:
			print "Your documents are already up to date.  There are no modified documents to download.".center(64,"=")
	else:
		print "Finished downloading".center(64,"=")
	
	
	if datetag != None:
		localpath = cfg['path']+auth[0]+"/"+datetag+"/"
	else:
		localpath = cfg['path']+auth[0]+"/"
		
		
	
	deleteddocs = -1
	if cfg['clean_up']:
		print "Cleaning up old documents".center(64,"=")
		for i in os.walk(localpath).next()[2]:
			if i not in successfuldocs.values():
				os.remove(localpath+i)
				print "Removed " + i
				deleteddocs += 1
		if deleteddocs == -1:
			print "There are no extra documents."
		print "Finished cleaning up.".center(64,"=")
	
	
	if docfeed['totaldocs'] > -1:
		print "Updated " + str(totalupdated) + " of " + str(len(filesdownloaded)) + " documents in this feed."
	
	print "There are now " + str(len(os.walk(localpath).next()[2])) + " files available locally for this account."
	if deleteddocs > -1:
		print str(deleteddocs) + " documents were deleted while cleaning up."
	
if auth[0] != "" and auth[1] != "":
	
	f = open(script_path+"data/"+feedhash+".xml", "w")
	f.write(feedxml)
	f.close()
	
	f = open(script_path+"data/"+feedhash+".log", "w")
	pickle.dump(successfuldocs, f)
	f.close()
	
	
	if not recordtolog:
		print "There were some errors while downloading your files.  Run again to retry."

	totaltime = time.time() - totaltime
	totalminutes = math.floor(totaltime/60)
	remainingseconds = round(totaltime%60,2)
	if totalminutes > 0:
		timereport = "Script execution time: " + str(totalminutes) + " minutes and " + str(remainingseconds) + " seconds"
	else:
		timereport = "Script execution time: " + str(remainingseconds) + " seconds"
	print timereport
	
	if len(filetimes) > 0:
		print "Download speed average: " + str(round(((sum(filesizes)*8)/1024)/sum(filetimes),2)) + " kbps"
	
	print "All done!".center(64,"=")
	showVersion(False)

# This software is licensed under the CC-GNU GPL.
# http://creativecommons.org/licenses/GPL/2.0/
# Google Docs: Download for Python was written by Peter Shafer, in June 2009.
# Special thanks to Francis, Raffi, and everyone else who has taken the time to test the script or send me feedback.
