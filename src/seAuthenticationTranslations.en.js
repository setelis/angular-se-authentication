angular.module("seAuthentication.translations.en", ["pascalprecht.translate"]).config(function($translateProvider) {
	"use strict";
	$translateProvider.translations("en", {
		"notifications.SeAuthenticationService.logout": "Logged out"
	});
});
