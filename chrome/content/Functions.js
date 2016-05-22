window.addEventListener("load", function(e) { frosconrtFunctions.startup(); }, false);
window.addEventListener("unload", function(e) { frosconrtFunctions.shutdown(); }, false);

const { require } = Components.utils.import("resource://gre/modules/commonjs/toolkit/require.js", {});

var frosconrtFunctions = {
	prefs: null,
	rtRealm: "",
	rtSpamQueue: "",
	rtURL: "",

	startup: function()
	{
		this.prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.frosconrt.");
		this.prefs.addObserver("", this, false);

		this.rtRealm = this.prefs.getCharPref("rt-realm");
		this.rtSpamQueue = this.prefs.getCharPref("rt-spamqueue");
		this.rtURL = this.prefs.getCharPref("rt-url");
	},

	shutdown: function()
	{
		this.prefs.removeObserver("", this);
	},

	observe: function(subject, topic, data)
	{
		if (topic == "nsPref:changed") {
			switch(data) {
			case "rt-realm": this.rtRealm = this.prefs.getCharPref("rt-realm"); break;
			case "rt-spamqueue": this.rtSpamQueue = this.prefs.getCharPref("rt-spamqueue"); break;
			case "rt-url": this.rtURL = this.prefs.getCharPref("rt-url"); break;
			}
		}
	},

	storeCredentials: function()
	{
		let username = document.getElementById("rt-username").mInputField.value;
		let password = document.getElementById("rt-password").mInputField.value;
		require("sdk/passwords").store({
			url: this.rtURL,
			username: username,
			password: password,
			realm: this.rtRealm,
			onComplete: function() {
				console.log("Stored credentials for " + username + "@" + realm);
			},
			onError: function(error) {
				alert("Failed to store credentials for " + username + "@" + realm + ": " + error);
			},
		});
	},

	iterateSelected: function(callback) {
		let msgs = gFolderDisplay.selectedMessages;
		for (m of msgs) {
			MsgHdrToMimeMessage(m, null,
				callback,
				true,
				{ partsOnDemand: true }
			);
		}
	},

	postToRT: function(realm, url, options = {}, callback)
	{
		require("sdk/passwords").search({
			onComplete: function onComplete(credentials) {
				let username = credentials[0].username;
				let password = credentials[0].password;
				let data = new FormData();
				for (var op in options) {
					data.append(op, options[op].replace("<username>", username));
				}
				let req = new XMLHttpRequest();
				req.onload = function(e) {
					if (req.status == 200) {
						if (typeof callback !== "undefined") callback();
					}
					else alert(req.responseText);
				}
				req.open("POST", url, true);
				req.setRequestHeader('Authorization', "Basic " + require("sdk/base64").encode(username + ':' + password));
				req.send(data);
			},
			onError: function onError(error) {
				alert("Failed to find credentials for " + realm + ": " + error);
			},
			realm: realm,
		});
	},

	parseTicket: function(msg)
	{
		let ticket = msg.get("X-RT-Ticket").match(/(.*)#(\d+)/);
		let realm = ticket[1].trim();
		let ticketid = ticket[2];
		return {realm: realm, id: ticketid}
	},

	Spam: function(event,todo)
	{
		let rtURL = this.rtURL;
		let rtSpamQueue = this.rtSpamQueue;
		let postToRT = this.postToRT;
		let parseTicket = this.parseTicket;
		this.iterateSelected(function (stuff, message) {
			if (message.has("X-RT-Ticket")) {
				let ticket = parseTicket(message);
				let poster = function(options, callback) {
					postToRT(
						ticket.realm,
						rtURL + "/REST/1.0/ticket/" + ticket.id,
						options, callback
					);
				}
				poster({"content": "Queue: " + rtSpamQueue},
					function(){
						poster({"content": "Status: Deleted"},
							function() {
								JunkSelectedMessages(true);
							}
						);
					}
				);
			}
		});
	},
	Take: function(event,todo)
	{
		let rtURL = this.rtURL;
		let postToRT = this.postToRT;
		let parseTicket = this.parseTicket;
		this.iterateSelected(function (stuff, message) {
			if (message.has("X-RT-Ticket")) {
				let ticket = parseTicket(message);
				let poster = function(options, callback) {
					postToRT(
						ticket.realm,
						rtURL + "/REST/1.0/ticket/" + ticket.id,
						options, callback
					);
				}
				poster({"content": "Owner: <username>"});
			}
		});
	},
}
