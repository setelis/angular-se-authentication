angular.module("seAuthentication.filter.loggedmember", ["seAuthentication.service"]).
filter("loggedMember", function(SeAuthenticateService) {
	"use strict";
	return function() {
		return SeAuthenticateService.currentLoggedMemberHolder.member;
	};
});
