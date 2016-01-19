angular.module("seAuthentication.filter.iscurrentlylogged", ["seAuthentication.service"]).
filter("isCurrentlyLogged", function(SeAuthenticationService) {
	"use strict";
	var result = function isCurrentlyLoggedFilter() {
		return SeAuthenticationService.currentLoggedMemberHolder.logged;
	};
	result.$stateful = true;
	return result;
});
