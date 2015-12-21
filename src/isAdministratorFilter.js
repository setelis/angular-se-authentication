angular.module("seAuthentication.filter.isadministrator", ["seAuthentication.service"]).
filter("isAdministrator", function(SeAuthenticationService) {
	"use strict";
	return function() {
		return SeAuthenticationService.currentLoggedMemberHolder.member &&
			SeAuthenticationService.currentLoggedMemberHolder.member.role === "ADMINISTRATOR";
	};
});
