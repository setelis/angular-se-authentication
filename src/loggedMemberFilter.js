angular.module("seAuthentication.filter.loggedmember", ["seAuthentication.service"]).
filter("loggedMember", function(SeAuthenticationService) {
	"use strict";
	var result = function loggedMemberFilter() {
		return SeAuthenticationService.currentLoggedMemberHolder.member;
	};
	result.$stateful = true;
	return result;
});
