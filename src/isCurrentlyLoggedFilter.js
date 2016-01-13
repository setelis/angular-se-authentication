angular.module("seAuthentication.filter.iscurrentlylogged", ["seAuthentication.service"]).
filter("isCurrentlyLogged", function(SeAuthenticationService) {
	"use strict";
	return function() {
		return SeAuthenticationService.currentLoggedMemberHolder.logged;
	};
});
