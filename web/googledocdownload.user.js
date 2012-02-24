// ==UserScript==
// @name           Google Docs Download
// @namespace      gdd
// @description    Create a download list of your google documents.
// @include        http://docs.google.com/*
// @include        https://docs.google.com/*
// @exclude        http://docs.google.com/Doc?docid=*
// @exclude        https://docs.google.com/Doc?docid=*
// @exclude        http://docs.google.com/Doc?id=*
// @exclude        https://docs.google.com/Doc?id=*
// @exclude        http://docs.google.com/RawDocContents?*
// @exclude        https://docs.google.com/RawDocContents?*
// @exclude        http://docs.google.com/Presentation?*
// @exclude        https://docs.google.com/Presentation?*
// @exclude        http://docs.google.com/document/edit?id=*
// @exclude        https://docs.google.com/document/edit?id=*
// @exclude        http://spreadsheets.google.com/ccc?key=*
// @exclude        https://spreadsheets.google.com/ccc?key=*
// @exclude        http://docs.google.com/document/d/*
// @exclude        https://docs.google.com/document/d/*
// @exclude        http://docs.google.com/presentation/d/*
// @exclude        https://docs.google.com/presentation/d/*
// ==/UserScript==



var SCRIPT = {
	name: "Google Docs Download",
	namespace: "http://www.1st-soft.net/",
	description: 'Create a download list of your google documents.',
	source: "http://www.1st-soft.net/gdd/googledocdownload.user.js",
	identifier: "http://www.1st-soft.net/gdd/googledocdownload.user.js",
	version: "3.3",
	date: (new Date(2012, 2, 19)).valueOf()
};


exclude = new Array('docs.google.com/Doc?docid=',
			'docs.google.com/Doc?id=',
			'docs.google.com/RawDocContents?',
			'docs.google.com/Presentation?')
var shortcircuit = false;
for(l=0;l<exclude.length;l++){
	if(document.location.href.toLowerCase().indexOf(exclude[l]) != -1){
		shortcircuit = true;
	}
}

if(shortcircuit == false){


function safe_GM_getValue(key){
	try{
		return GM_getValue(key);
	}catch(e){
		return false;
	}
}

function safe_GM_setValue(key,val){
	try{
		return GM_setValue(key,val);
	}catch(e){
		return false;
	}
}

function safe_GM_registerMenuCommand(a,b){
	try{
		return GM_registerMenuCommand(a,b);
	}catch(e){
		return false;
	}
}

function safe_GM_xmlhttpRequest(req){
	try{
		return GM_xmlhttpRequest(req);
	}catch(e){
		return false;
	}
}

/* These are items that can be accessed from the greasemonkey menu. */
function ActivateNotices(){
	var disableNotices = safe_GM_getValue("disableNotices");
	if(disableNotices == 1){
		safe_GM_setValue("disableNotices",0);
		ShowMessage("Notices have been enabled.",5000);
	}else{
		forcing = true;
		ShowMessage("Notices are now disabled.",5000);
		forcing = false;
		safe_GM_setValue("disableNotices",1);	
	}
}
safe_GM_registerMenuCommand("Disable/Enable Notices",ActivateNotices);
function ForceGetVersion(){
	GetVersion(1);
}
safe_GM_registerMenuCommand("Check for updates",ForceGetVersion);
function ClearValues(){
	safe_GM_setValue("lastCheck","0");
	safe_GM_setValue("remoteVersion","0.0");
}
safe_GM_registerMenuCommand("Debug: Clear GDD GM Values",ClearValues);

/* Floating notice script */

var msgTimeout, colorA, colorB, dismiss, floatietitle, floatiediv, docbody, floatie;

function InitiateNotices(){
	msgTimeout;
	colorA = '#67a7e3';
	colorB = 'white';
	dismiss = " <span onMouseOut=\"this.style.backgroundColor='"+colorA+"';this.style.color='"+colorB+"'\" onMouseOver=\"this.style.backgroundColor='"+colorB+"';this.style.color='"+colorA+"'\" onClick=\"document.getElementById('GDDError').style.display='none';\" style=\"cursor:pointer;color:"+colorB+";float:right;font-family:tahoma;font-weight:bold;margin:3px;padding:3px;\">&nbsp;X&nbsp;</span> "
	floatietitle = "<u>Google Docs Download</u>";
	floatiediv = document.createElement("div");
	floatiediv.setAttribute("id","GDDError");
	floatiediv.setAttribute("style","z-index:10000;font-family:verdana;font-size:12px;width:200px;position:fixed;right:0px;bottom:0px;background-color:"+colorA+";color:"+colorB+";padding:7px;display:none;opacity:0.0;");
	docbody = document.getElementsByTagName("body")[0];
	docbody.appendChild(floatiediv);
	floatie = document.getElementById("GDDError");
}

function UpdateBox(){
	if(parseFloat(floatie.style.opacity) < 1.0 && floatie.style.display != "none"){
		floatie.style.opacity = parseFloat(floatie.style.opacity) + 0.05;
		if(parseFloat(floatie.style.opacity) < 1.0){
			setTimeout(UpdateBox,50);
		}
	}
}

function UpdateBoxR(){
	if(parseFloat(floatie.style.opacity) > 0.0 && floatie.style.display == "block"){
		floatie.style.opacity = parseFloat(floatie.style.opacity) - 0.05;
		if(parseFloat(floatie.style.opacity) > 0.0){
			setTimeout(UpdateBoxR,50);
		}else{
			floatie.style.display = 'none';
		}
	}
}


function ShowMessage(message,time){
	if(safe_GM_getValue("disableNotices") != 1){
		if(floatie.style.display == "none"){
			floatie.style.opacity = 0.0;
			floatie.style.display = 'block';
		}
		try{
			clearTimeout(msgTimeout);
			if(time > 0){
				msgTimeout = setTimeout(UpdateBoxR,time);
			}
		}catch(e){
			
		}
		var disableThis;
		if(forcing == false){
			disableThis = "<br/><br style=\"font-size:8px;\" /><a href=\"javascript:void(0);\" id=\"GDD_Disable\" style=\"color:white;\">Disable Notices</a>";
		}else{
			disableThis = "";
		}
		floatie.innerHTML = dismiss + "<p style=\"margin:0px;\">" + floatietitle + "<br/><br style=\"font-size:8px;\" />" + message + "" + disableThis + "</p>";
		UpdateBox();	
	}
}

var forcing = false;
function ForceMessage(message,time){
	var origValue = safe_GM_getValue("disableNotices");
	if(origValue == 1){
		safe_GM_setValue("disableNotices",0);
		forcing = true;
	}
	ShowMessage(message,time);
	if(origValue == 1){
		safe_GM_setValue("disableNotices",1);
		forcing = false;
	}
}

/* Version Checker */

function myParseFloat(value){
	value = parseFloat(value);
	if(isNaN(value)){
		return 0.0;
	}else{
		return value;
	}
}

function myParseInt(value){
	value = parseInt(value);
	if(isNaN(value)){
		return 0;
	}else{
		return value;
	}
}


function GetVersion(force){
	safe_GM_xmlhttpRequest({
		method: 'GET',
		url: 'http://www.1st-soft.net/gdd/version.txt',
		headers: {
			'User-agent': 'Mozilla/4.0 (compatible) Greasemonkey',
			'Accept': 'application/atom+xml,application/xml,text/xml',
		},
		onload: function(responseDetails) {
			var remoteVersion = myParseFloat(responseDetails.responseText);
			safe_GM_setValue("remoteVersion",String(remoteVersion));
			CheckVersion(force);
		}
	});
}

function CheckVersion(force){
	var remoteVersion = myParseFloat(safe_GM_getValue("remoteVersion"));
	var localVersion = myParseFloat(SCRIPT["version"]);
	var updatemsg = "A new version of GDD is available.<br/><br style=\"font-size:3px;\" /><a href=\"http://www.1st-soft.net/gdd/\" style=\"color:white;\">Visit Homepage</a><br/><br style=\"font-size:3px;\" />";
	if(remoteVersion > localVersion){
		if(force == 0){
			ShowMessage(updatemsg,0);
		}else{
			ForceMessage(updatemsg,0);
		}
	}else{
		var uptodate = "GDD is currently up to date.";
		if(force == 1){
			ForceMessage(uptodate,0);
		}
	}
}


/* Primary GDD Functions */

function HandleError(e,note){
	if(note == ""){
		ForceMessage("Sorry, there has been an error.<br/><br/>" + e,0);
	}else{
		ForceMessage("Sorry, there has been an error.<br/><br/>" + note + "<br/>" + e,0);
	}
}

function xpath_query(query){
	var set;
	try{
		var result = document.evaluate(query, document,null,XPathResult.ANY_TYPE,null);
		var item;
		set = new Array();
		while(item = result.iterateNext()){
			set[set.length] = item;
		}
		return set;
	}catch(e){
		HandleError(e,"XPath Query Failed");
	}
}

function htmlEntities(str){
	//str = str.replace(/\"/g, "&quot;");
	str = str.replace(/\'/g, "&apos;");
	//str = str.replace(/&/g, "&amp;");
	str = str.replace(/</g, "&lt;");
	str = str.replace(/>/g, "&gt;");
	return str;
}

function findFormat(label){
	for(var i = 0; i < formats.length; i++){
		if(formats[i][0] == label){
			return formats[i];
		}
	}
	return false;
}

function ExecuteSearch(event){
	if(event.target.id == "GDD_Disable" || event.target.id == "GDD_Enable"){
		document.getElementById("gddList").style.display="none";
		ActivateNotices();
		return "";
	}
	if(event.target.id == "GDD_Update"){
		document.getElementById("gddList").style.display="none";
		GetVersion(1);
		return "";
	}
	if(event.target.id == "GDD_Mobile"){
		window.location.href="https://docs.google.com/"+appPath+"m";
		return "";
	}
	if(event.target.id == "GDD_AboutFormat"){
		document.getElementById("gddList").style.display="none";
		var formatsmessage = "File formats by category ordered by document, spreadsheet, presentation. Note: PDFs are always downloaded as PDFs.<br/><br/>";
		formatsmessage += "Microsoft Office<br/>";
		formatsmessage += "&nbsp;&nbsp;&nbsp; .doc, .xls, .ppt<br/>";
		formatsmessage += "Open Office<br/>";
		formatsmessage += "&nbsp;&nbsp;&nbsp; .odt, .ods, .ppt<br/>";
		formatsmessage += "Portable Document Format<br/>";
		formatsmessage += "&nbsp;&nbsp;&nbsp; .pdf, .pdf, .pdf<br/>";
		formatsmessage += "Rich Text<br/>";
		formatsmessage += "&nbsp;&nbsp;&nbsp; .rtf, .txt, .txt<br/>";
		formatsmessage += "CSV or Plain Text<br/>";
		formatsmessage += "&nbsp;&nbsp;&nbsp; .txt, .txt, .txt<br/>";
		
		ShowMessage(formatsmessage,0);
		return "";
	}
	
	if(event.target.id == "GDD_SELECT_SCOPE" || event.target.id == "GDD_SELECT_SCOPE_0" || event.target.id == "GDD_SELECT_SCOPE_1" || event.target.id == "GDD_SELECT_SCOPE_1_LABEL" || event.target.id == "GDD_SELECT_SCOPE_0_LABEL"){
		return "";
	}
	if(!event.target.id){
		document.getElementById("gddList").style.display="none";
		return "";
	}
	try{
		
		if(event.target.id == "openGDDMenu" || event.target.id == "openGDDMenuArrow"){
			if(document.getElementById("gddList").style.display!="block"){
				document.getElementById("gddList").style.display="block";
			}else{
				document.getElementById("gddList").style.display="none";
			}
			event.stopPropagation();
			event.preventDefault();
		}else if(event.target.id.substr(0,3) == "GDD"){
			document.getElementById("gddList").style.display="none";
			var format = event.target.id.substr(4,3);
			if(format == "HLP"){
				var message = "How to use the download menu.<br/><br/>";
				message += "Step #1: \nSelect the documents you wish to download by clicking their checkbox.";
				message += "<br/><br/>"+"Step #2: \nClick the drop down menu you used to open this help dialog and (a) select whether you wish to download all documents in your account or only the selected documents. (b) Select a format to download your files in.";
				message += "<br/><br/>"+"Step #3: \nA new window will open with a list of your selected documents and download links. ";
				message += "You can use a download manager such as DownThemAll (DownThemAll.net) to download them all at once.";
				message += "<br/><br/>"+"The <a href=\"http://www.1st-soft.net/gdd/\" style=\"color:white;\" target=\"_blank\">Google Docs Download script</a> was written by Peter Shafer in July of 2007.";
				message += "<br/>"+"<a href=\"http://www.1st-soft.net/gdd/\" style=\"color:white;\" target=\"_blank\">http://www.1st-soft.net/gdd/</a>";
				ShowMessage(message,0);
				return "";
			}
			
			// Selection occurs like this
			//	Find the active doclist view
			//	Narrow results to selected rows found inside the view
			//	Narrow the content for every item to only the name section
			//	Narrow the content for every item to the link in the name section
			
			var query = "//div[contains(@class,'doclistview') " + 
							"and not(contains(@class,'doclistview-inner')) " +
							"and not(contains(@class,'doclistview-list')) " +
							"and not(contains(@style,'display: none'))]" +
							"/descendant::tr[contains(@class,'doclist-tr-selected')]" +
							"/td[contains(@class,'doclist-td-name')]" +
							"/descendant::a[not(contains(@id,'folder'))]";
			var items = xpath_query(query);
			var any = false;
			var files = new Array();
			var isFolder, k, title, thisformat, key, url, doctype;
			for(var i = 0; i < items.length; i++){
				k = items[i];
				title = "Unknown";
				url = "";
				doctype = "";
				isFolder = false;
				// Find the title of the document
				for(var j = 0; j < k.childNodes.length; j++){
					if(k.childNodes[j].className.indexOf("doclist-name")!=-1){
						title = htmlEntities(k.childNodes[j].title);
					}
					if(k.childNodes[j].className.indexOf("folder") != -1 || k.childNodes[j].title.indexOf("Collection") != -1){
						isFolder = true;
					}
				}
				if(isFolder){
					continue;
				}
				if(k.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.style.display == "none"){
					continue;
				}
				if(k.href.indexOf("docs.google.com/"+appPath+"Doc?docid=") != -1){
					thisformat = findFormat(format)[1];
					key = k.href.split("Doc?docid=")[1].split("&")[0];
					url = "https://docs.google.com/"+appPath+"MiscCommands?command=saveasdoc&exportformat="+thisformat+"&docID="+key;
					doctype = "doc";
				}else if(k.href.indexOf("docs.google.com/"+appPath+"document/d/") != -1){
					thisformat = findFormat(format)[1];
					key = k.href.split("docs.google.com/"+appPath+"document/d/")[1].split("/")[0];
					url = "https://docs.google.com/"+appPath+"document/d/"+key+"/export?format="+thisformat+"&hl=en";
					doctype = "doc";
				}else if(k.href.indexOf("docs.google.com/"+appPath+"Doc?id=") != -1){
					thisformat = findFormat(format)[1];
					key = k.href.split("Doc?id=")[1].split("&")[0];
					url = "https://docs.google.com/"+appPath+"MiscCommands?command=saveasdoc&exportformat="+thisformat+"&docID="+key;
					doctype = "doc";
				}else if(k.href.indexOf("spreadsheets.google.com/"+appPath+"ccc?key=") != -1){
					key = k.href.split("ccc?key=")[1].split("&")[0];
					thisformat = findFormat(format)[2];
					url = "https://spreadsheets.google.com/"+appPath+"fm?fmcmd="+thisformat+"&key="+key;
					doctype = "spread";
				}else if(k.href.indexOf("docs.google.com/spreadsheet/"+appPath+"ccc?key=") != -1){
					key = k.href.split("ccc?key=")[1].split("&")[0];
					thisformat = findFormat(format)[2];
					url = "https://spreadsheets.google.com/"+appPath+"fm?fmcmd="+thisformat+"&key="+key;
					doctype = "spread";
				}else if(k.href.indexOf("docs.google.com/"+appPath+"spreadsheet/ccc?key=") != -1){
					key = k.href.split("ccc?key=")[1].split("&")[0];
					thisformat = findFormat(format)[2];
					url = "https://spreadsheets.google.com/"+appPath+"fm?fmcmd="+thisformat+"&key="+key;
					doctype = "spread";
				}else if(k.href.indexOf("docs.google.com/"+appPath+"fileview?id=") != -1){
					key = k.href.split("fileview?id=")[1].split("&")[0];
					url = "https://docs.google.com/"+appPath+"uc?export=download&id="+key;
					doctype = "DoclistBlob";
				}else if(k.href.indexOf("docs.google.com/"+appPath+"leaf?id=") != -1){
					key = k.href.split("leaf?id=")[1].split("&")[0];
					url = "https://docs.google.com/"+appPath+"uc?export=download&id="+key;
					doctype = "DoclistBlob";
				}else if(k.href.indexOf("docs.google.com/"+appPath+"viewer?") != -1){
					key = k.href.split("srcid=")[1].split("&")[0];
					url = "https://docs.google.com/"+appPath+"uc?export=download&id="+key;
					doctype = "DoclistBlob";
				}else if(k.href.indexOf("docs.google.com/"+appPath+"present/edit?docid=") != -1){
					thisformat = findFormat(format)[3];
					key = k.href.split("edit?docid=")[1].split("&")[0];
					url = "https://docs.google.com/"+appPath+"MiscCommands?command=saveasdoc&exportFormat="+thisformat+"&docID="+key;
					doctype = "pres";
				}else if(k.href.indexOf("docs.google.com/present/"+appPath+"edit?docid=") != -1){
					thisformat = findFormat(format)[3];
					key = k.href.split("edit?docid=")[1].split("&")[0];
					url = "https://docs.google.com/"+appPath+"MiscCommands?command=saveasdoc&exportFormat="+thisformat+"&docID="+key;
					doctype = "pres";
				}else if(k.href.indexOf("docs.google.com/"+appPath+"present/edit?id=") != -1){
					thisformat = findFormat(format)[3];
					key = k.href.split("present/edit?id=")[1].split("&")[0];
					url = "https://docs.google.com/"+appPath+"MiscCommands?command=saveasdoc&exportFormat="+thisformat+"&docID="+key;
					doctype = "pres";
				}else if(k.href.indexOf("docs.google.com/"+appPath+"presentation/d/") != -1){
					thisformat = findFormat(format)[3];
					key = k.href.split("/presentation/d/")[1].split("/")[0];
					url = "https://docs.google.com/"+appPath+"presentation/d/"+key+"/export/"+thisformat+"?hl=en";
					doctype = "pres";
				}else if(k.href.indexOf("docs.google.com/"+appPath+"document/edit?id=") != -1){
					thisformat = findFormat(format)[1];
					key = k.href.split("document/edit?id=")[1].split("&")[0];
					url = "https://docs.google.com/"+appPath+"document/export?format="+thisformat+"&id="+key;
					doctype = "doc";
				}else if(k.href.indexOf("docs.google.com/"+appPath+"document/edit?docID=") != -1){
					thisformat = findFormat(format)[1];
					key = k.href.split("document/edit?id=")[1].split("&")[0];
					url = "https://docs.google.com/"+appPath+"document/export?format="+thisformat+"&id="+key;
					doctype = "doc";
				}else if(k.href.indexOf("docs.google.com/"+appPath+"drawings/edit?id=") != -1){
					thisformat = findFormat(format)[4];
					key = k.href.split("drawings/edit?id=")[1].split("&")[0];
					url = "https://docs.google.com/"+appPath+"drawings/export/"+thisformat+"?id="+key
					doctype = "draw";
				}else if(k.href.indexOf("docs.google.com/"+appPath+"drawings/d/") != -1){
					thisformat = findFormat(format)[4];
					key = k.href.split("drawings/d/")[1].split("/")[0];
					url = "https://docs.google.com/"+appPath+"drawings/export/"+thisformat+"?id="+key
					doctype = "draw";
				}
				files[files.length] = new Array(title,url,doctype);
				any = true;
			}
			if(!any){
				ShowMessage("Please select one or more documents first.",5000);
			}else{
				makepage(files);
			}
			event.stopPropagation();
			event.preventDefault();
		}
	}catch(e){
		HandleError(e,"An error occurred during execution.");
	}
}

function InitiateGDD(){
	document.addEventListener('click', function(event) {
		try{
			ExecuteSearch(event);
		}catch(e){
			
		}
	}, true);
}

function makepage(files){
	var mywin = window.open('about:blank','_blank','',false);
	var linklist;
	try{
		linklist = mywin.document.open();
	}catch(e){
		linklist = document;
	}
	linklist.write('<html><head><title>Your Downloads</title></head><body>');
	linklist.write("<h2 style=\"margin-top:5px; text-align:center;\">Google Docs & Spreadsheets Downloads</h2><p style=\"text-align:center; margin-left: auto; margin-right: auto; width: 480px;\">Tip: Have a lot of documents?  Use <a href=\"javascript: void(window.open('http://www.downthemall.net/'));\">DownThemAll</a> to download them quickly and easily.</p>");


	linklist.write('<p style=\"margin-left:auto;margin-right:auto;width:480px;\"><select style=\"width:100%;\" onChange=\"if(this.value!=\'\'){for(var i = 0; i < document.links.length; i++){var x=document.links[i]; x.href=x.href.replace(/drawings\\/export\\/png\\?id\\=/ig,\'drawings/export/\'+this.value+\'\\?id\\=\');x.href=x.href.replace(/drawings\\/export\\/jpeg\\?id\\=/ig,\'drawings/export/\'+this.value+\'\\?id\\=\');x.href=x.href.replace(/drawings\\/export\\/svg\\?id\\=/ig,\'drawings/export/\'+this.value+\'\\?id\\=\');x.href=x.href.replace(/drawings\\/export\\/pdf\\?id\\=/ig,\'drawings/export/\'+this.value+\'\\?id\\=\');}}\"><option value=\'\'>Change Drawing Format</option><option value=\"svg\">Scalable Vector Graphics Format</option><option value=\"png\">Portable Network Graphic Format</option><option value=\"jpeg\">JPEG Format</option><option value=\"pdf\">PDF Document</option></select></p>');

	linklist.write('<p style=\"margin-left:auto;margin-right:auto;width:480px;\"><select style=\"width:100%;\" onChange=\"if(this.value!=\'\'){for(var i = 0; i < document.links.length; i++){var x=document.links[i]; x.href=x.href.replace(/\\?format\\=doc/ig,\'?format\\=\'+this.value);x.href=x.href.replace(/\\?format\\=odt/ig,\'?format\\=\'+this.value);x.href=x.href.replace(/\\?format\\=txt/ig,\'?format\\=\'+this.value);x.href=x.href.replace(/\\?format\\=rtf/ig,\'?format\\=\'+this.value);x.href=x.href.replace(/\\?format\\=pdf/ig,\'?format\\=\'+this.value);}}\"><option value=\'\'>Change Document Format</option><option value=\"doc\">Microsoft Word Document</option><option value=\"odt\">Open Office Document</option><option value=\"txt\">Text Document</option><option value=\"rtf\">Rich Text Document</option><option value=\"pdf\">PDF Document</option></select></p>');

	linklist.write('<p style=\"margin-left:auto;margin-right:auto;width:480px;\"><select style=\"width:100%;\" onChange=\"if(this.value!=\'\'){for(var i = 0; i < document.links.length; i++){var x=document.links[i];x.href=x.href.replace(/fmcmd\\=4/ig,\'fmcmd=\'+this.value);x.href=x.href.replace(/fmcmd\\=5\\&gid\\=0/ig,\'fmcmd=\'+this.value);x.href=x.href.replace(/fmcmd\\=13/ig,\'fmcmd=\'+this.value);x.href=x.href.replace(/fmcmd\\=12/ig,\'fmcmd=\'+this.value);x.href=x.href.replace(/fmcmd\\=23\\&gid\\=0/ig,\'fmcmd=\'+this.value);}}\"><option value=\'\'>Change Spreadsheet Format</option><option value=\'4\'>Microsoft Excel Document</option><option value=\'5&gid=0\'>CSV Document</option><option value=\'13\'>Open Office Spreadsheet</option><option value=\'12\'>PDF Document</option></select></p>');

	linklist.write('<p style=\"margin-left:auto;margin-right:auto;width:480px;\"><select style=\"width:100%;\" onChange=\"if(this.value!=\'\'){for(var i = 0; i < document.links.length; i++){var x=document.links[i];x.href=x.href.replace(/exportFormat\\=ppt/ig,\'exportFormat=\'+this.value);x.href=x.href.replace(/exportFormat\\=txt/ig,\'exportFormat=\'+this.value);x.href=x.href.replace(/exportFormat\\=pdf/ig,\'exportFormat=\'+this.value);x.href=x.href.replace(/export\\/ppt/ig,\'export\/\'+this.value);x.href=x.href.replace(/export\\/txt/ig,\'export\/\'+this.value);x.href=x.href.replace(/export\\/pdf/ig,\'export\/\'+this.value);}}\"><option value=\'\'>Change Presentation Format</option><option value=\"ppt\">Microsoft Powerpoint Document</option><option value=\"txt\">Text Document</option><option value=\"pdf\">PDF Document</option></select></p>');

	linklist.write("<ul style=\"list-style-position:inside; padding-left:0px; margin-left: auto; margin-right: auto; width: 480px; padding-top:5px;\">");
	
	for(var i = 0; i < files.length; i++){
		var color;
		if(i%2 == 0){
			color = "#E0EDFE";
		}else{
			color = "#ffffff";
		}
		var icon = "";
		if(files[i][2] == "spread" || files[i][2] == "spreadsheet"){
			icon = "<img src=\"/images/doclist/icon_6_spread.gif\" style=\"vertical-align:top;\" />";
		}else if(files[i][2] == "doc" || files[i][2] == "document"){
			icon = "<img src=\"/images/doclist/icon_6_doc.gif\" style=\"vertical-align:top;\" />";
		}else if(files[i][2] == "pres" || files[i][2] == "presentation"){
			icon = "<img src=\"/images/doclist/icon_6_pres.gif\" style=\"vertical-align:top;\" />";
		}
		else if(files[i][2] == "DoclistBlob"){
			icon = "<img src=\"/images/doclist/icon_6_generic.png\" style=\"vertical-align:top;\" />";
		}else if(files[i][2] == "draw"  || files[i][2] == "drawing"){
			icon = "<img src=\"/images/doclist/icon_6_drawing.png\" style=\"vertical-align:top;\" />"
		}
		linklist.write("<li style=\"overflow:hidden; background-color:"+color+"; list-style-type: none; padding:3px; font-size:14px;\"><nobr>"+icon+" <a href=\""+files[i][1]+"\" style=\"font-weight:bold;\" onClick=\"this.style.fontWeight='normal';\">"+files[i][0]+"</a></nobr></li>");
	}
	
	linklist.write('</ul>');
	linklist.write("<p style=\"text-align:center; margin-left: auto; margin-right: auto; width: 480px;\">Script written by Peter Shafer July '07.  Let me know if you find any bugs (gdd at 1st-soft.net) and check for updates at <a href=\"javascript: void(window.open('http://www.1st-soft.net/gdd/'));\">http://www.1st-soft.net/gdd/</a>.</p>");
	linklist.write('</body></html>');
	linklist.close();
}

function create_item(label,id){
	var item = document.createElement("p");
	item.appendChild(document.createTextNode(label));
	item.setAttribute("onMouseOver","this.style.backgroundColor='#E0EDFE';");
	item.setAttribute("onMouseOut","this.style.backgroundColor='#FFFFFF'");
	item.setAttribute("style","margin:0px;padding:5px;cursor:pointer;text-align:left;");
	item.setAttribute("id",id);
	return item;
}

function create_html(seg){
	var item = document.createElement("p");
	item.innerHTML = seg;
	item.setAttribute("style","margin:0px;padding:5px;cursor:default;text-align:left;background-color:#E1E7F2;");
	item.setAttribute("id","GDD_SELECT_SCOPE");
	return item;
}

function InsertGDDMenu(){
	var checkPage = xpath_query("//div[@id='doclist']");
	if(checkPage.length > 0){
		
		
		var result = document.getElementsByTagName("body")[0];
		
		var arrow = document.createElement("img");
		arrow.setAttribute("style","vertical-align: middle; cursor: pointer;");
		arrow.setAttribute("src","/images/doclist/icon_5_doc.gif");
		arrow.setAttribute("id","openGDDMenuArrow");
		
		var button1 = document.createElement("div");
		var message1 = document.createElement("span");
		
		message1.appendChild(arrow);
		button1.appendChild(arrow);
		button1.appendChild(document.createTextNode(" "));
		
		message1.appendChild(document.createTextNode("Download Your Documents"));
		message1.setAttribute("style","margin:0px;cursor:pointer;color:blue;text-decoration:underline;");
		message1.setAttribute("id","openGDDMenu");
		button1.appendChild(message1);
		button1.setAttribute("id","GDD_DL_BUTTON");
		result.appendChild(button1);	
		button1.setAttribute("style","font-size:13px; padding-right:10px; color:white; width:200px; position:absolute; bottom:25px; left:10px; z-index:10000; text-align:left;");
		
		var button2 = document.createElement("div");
		button2.setAttribute("id","gddList");

		button2.setAttribute("style","font-size:12px; border-style: solid; border-width: 1px; border-color: #CCCCCC #999999 #999999 #CCCCCC; background-color:white; color:#0000CC; display:none; position:absolute; bottom:45px; left:30px; z-index:10000; text-align:right;");
		
		var item1 = create_item("as Microsoft Office files","GDD_MSO");
		button2.appendChild(item1);
		var item2 = create_item("as Open Office files","GDD_OOF");
		button2.appendChild(item2);
		var item3 = create_item("as PDF files","GDD_PDF");
		button2.appendChild(item3);
		var item4 = create_item("as Rich text files","GDD_TXT");
		button2.appendChild(item4);
		var item5 = create_item("as CSV or Plain text files","GDD_CSV");
		button2.appendChild(item5);
		var item7 = create_item("Enable / Disable Notices","GDD_Enable");
		button2.appendChild(item7);
		var item10 = create_item("About File Formats","GDD_AboutFormat");
		button2.appendChild(item10);
		var item8 = create_item("Check for updates","GDD_Update");
		button2.appendChild(item8);
		var item6 = create_item("Help / About","GDD_HLP");
		button2.appendChild(item6);


		result.appendChild(button2);

	}
}

/* Code to run GDD */

// A list of download format labels and their document/spreadsheet identifier.
var formats = new Array();
formats[formats.length] = new Array("MSO","doc","4","ppt","svg");
formats[formats.length] = new Array("CSV","txt","5&gid=0","txt","svg");
formats[formats.length] = new Array("OOF","oo","13","ppt","svg");
formats[formats.length] = new Array("PDF","pdf","12","pdf","pdf");
formats[formats.length] = new Array("TXT","rtf","23&gid=0","txt","svg");



// Find out if user is using google apps
var appPath = "";
if(document.location.href.indexOf("/a/") != -1){
	var urlPieces = document.location.href.split("/");
	appPath = "a/"+urlPieces[4]+"/";
}






var checkPage;
try{
	checkPage = xpath_query("//div[@id='doclist']");
}catch(e){
	//HandleError(e,"XPath query failed.");
	checkPage = new Array();
}

try{
	if(checkPage.length > 0){
		InitiateNotices();
	}
}catch(e){
	
}

if(checkPage.length > 0){

	try{
		InitiateGDD();
	}catch(e){
		HandleError(e,"GDD failed to initialize.");
	}

	try{
		InsertGDDMenu();
	}catch(e){
		HandleError(e,"GDD failed to create interface.");
	}

}



/* Google Docs Mobile Version */

function GDD_Mobile(){
	var queryformat = formats[0][0];
	if(document.location.search.indexOf("format=") != -1){
		queryformat = document.location.search.split("format=")[1];
		queryformat = queryformat.split("&")[0];
	}

	function findFormat(label){
		for(var i = 0; i < formats.length; i++){
			if(formats[i][0] == label){
				return formats[i];
			}
		}
		return false;
	}
	var format;
	if(queryformat != ""){
		format = findFormat(queryformat);
	}else{
		format = formats[0];
	}

	var formaturl = document.location.href;
	if(formaturl.indexOf("format=") == -1 && formaturl.indexOf("?") == -1){
		formaturl += "?format="+queryformat;
	}else if(formaturl.indexOf("format=") == -1 && formaturl.indexOf("?") != -1){
		formaturl += "&format="+queryformat;	
	}


	var formatlinks = "Format: ";
	formatlinks += " <a href=\""+formaturl.replace(format[0],"MSO")+"\" alt=\"Microsoft Office\">MS</a> ";
	formatlinks += " <a href=\""+formaturl.replace(format[0],"OOF")+"\" alt=\"Open Office\">OO</a> ";
	formatlinks += " <a href=\""+formaturl.replace(format[0],"CSV")+"\" alt=\"Text/CSV\">TXT</a> ";
	formatlinks += " <a href=\""+formaturl.replace(format[0],"PDF")+"\" alt=\"Portable Document Format\">PDF</a> ";
	formatlinks += " <a href=\""+formaturl.replace(format[0],"TXT")+"\" alt=\"Rich Text\">RTF</a> ";


	var totals = document.getElementsByTagName("h6")[0];
	var total = totals.innerHTML.split(" ");
	total = total[total.length-1];
	var alllink = "<a href=\"?startingIndex=0&numResults="+total+"&sort=3&format="+queryformat+"\">Show All</a><br/>"+formatlinks;
	totals.innerHTML += " " + alllink;

	var doclinks = document.links;
	var page;

	for(var i = 0; i < doclinks.length; i++){
		page = doclinks[i].href.split("?")[0];
		id = doclinks[i].href.split("=")[1];
		switch(page){
			case"http://spreadsheets.google.com/m":
			case"https://spreadsheets.google.com/m":
				document.links[i].href = "https://spreadsheets.google.com/fm?key="+id+"&fmcmd="+format[2];
				break;
			case"http://docs.google.com/fileview":
			case"https://docs.google.com/fileview":
				document.links[i].href = "https://docs.google.com/gb?export=download&id="+id;
				break;
			case"http://docs.google.com/View":
			case"https://docs.google.com/View":
				document.links[i].href = "https://docs.google.com/MiscCommands?command=saveasdoc&exportformat="+format[1]+"&docID="+id;
				break;
		}
	}
}


if(document.getElementsByTagName("body")[0].innerHTML.indexOf("logo_mobile.gif") != -1){
		try{
			GDD_Mobile();
		}catch(e){
			HandleError(e,"GDD encountered an error.");
		}
}



/* Check for updates */



var lastCheck = myParseInt(safe_GM_getValue("lastCheck"));

if(Date.now() - lastCheck >= 86400000){
	safe_GM_setValue("lastCheck",String(Date.now()));
	GetVersion(0);
}else{
	CheckVersion(0);
}


}

// This software is licensed under the CC-GNU GPL.
// http://creativecommons.org/licenses/GPL/2.0/
// Google Doc Download was written by Peter Shafer, student developer, in June 2007.
