angular.module("seAuthentication.filter.iscurrentlylogged", ["seAuthentication.service"]).
filter("isCurrentlyLogged", function(SeAuthenticateService) {
	"use strict";
	return function() {
		return SeAuthenticateService.currentLoggedMemberHolder.logged;
	};
});
