angular.module("seAuthentication.filter.loggedmember", ["seAuthentication.service"]).
filter("loggedMember", function(SeAuthenticationService) {
	"use strict";
	return function() {
		return SeAuthenticationService.currentLoggedMemberHolder.member;
	};
});
