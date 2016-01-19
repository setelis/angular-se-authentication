angular.module("seAuthentication.filter.isadministrator", ["seAuthentication.service"]).
filter("isAdministrator", function(SeAuthenticationService) {
	"use strict";
	var result = function isAdministratorFilter() {
		return SeAuthenticationService.currentLoggedMemberHolder.member &&
			SeAuthenticationService.currentLoggedMemberHolder.member.role === "ADMINISTRATOR";
	};
	result.$stateful = true;
	return result;
});
