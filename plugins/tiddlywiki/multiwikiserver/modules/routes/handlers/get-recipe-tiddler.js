/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/get-recipe-tiddler.js
type: application/javascript
module-type: mws-route

GET /recipes/:recipe_name/tiddler/:title

Parameters:

fallback=<url> // Optional redirect if the tiddler is not found

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var aclMiddleware = require("$:/plugins/tiddlywiki/multiwikiserver/modules/routes/helpers/acl-middleware.js").middleware;

exports.method = "GET";

exports.path = /^\/recipes\/([^\/]+)\/tiddlers\/(.+)$/;

exports.handler = function(request,response,state) {
	aclMiddleware(request, response, state, "recipe", "READ");
	// Get the  parameters
	var recipe_name = $tw.utils.decodeURIComponentSafe(state.params[0]),
		title = $tw.utils.decodeURIComponentSafe(state.params[1]),
		tiddlerInfo = $tw.mws.store.getRecipeTiddler(title,recipe_name);
	if(tiddlerInfo && tiddlerInfo.tiddler) {
		// If application/json is requested then this is an API request, and gets the response in JSON
		if(request.headers.accept && request.headers.accept.indexOf("application/json") !== -1) {
			state.sendResponse(200,{
				"X-Revision-Number": tiddlerInfo.tiddler_id,
				"X-Bag-Name": tiddlerInfo.bag_name,
				Etag: state.makeTiddlerEtag(tiddlerInfo),
				"Content-Type": "application/json"
			},JSON.stringify(tiddlerInfo.tiddler),"utf8");
			return;
		} else {
			// This is not a JSON API request, we should return the raw tiddler content
			var type = tiddlerInfo.tiddler.type || "text/plain";
			if(!response.headersSent) {
				response.writeHead(200, "OK",{
				Etag: state.makeTiddlerEtag(tiddlerInfo),
					"Content-Type":  type
				});
				response.write(tiddlerInfo.tiddler.text || "",($tw.config.contentTypeInfo[type] ||{encoding: "utf8"}).encoding);
				response.end();
			}
			return;
		}
	} else {
		if(!response.headersSent) {
			// Redirect to fallback URL if tiddler not found
			if(state.queryParameters.fallback) {
				response.writeHead(302, "OK",{
					"Location": state.queryParameters.fallback
				});
				response.end();
				return;
			} else {
				response.writeHead(404);
				response.end();
				return;
			}
		}
		return;
	}
};

}());