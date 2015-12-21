angular.module("seAuthentication.popup", ["seNotifications.service", "ui.router"]).
directive("seAuthenticationPopup", function (SeNotificationsService) {
	"use strict";
	function closeDropdown(element) {
		if (element.parent().is(".open")) {
			// close
			element.dropdown("toggle");
		}
	}
	function openDropdown(element) {
		if (!element.parent().is(".open")) {
			// open
			element.dropdown("toggle");
		}
	}

	return {
		restrict: "A",
		link: function(scope, element) {
			scope.$on("$stateChangeStart", function() {
				closeDropdown(element);
			});
			// this should be done using SeAuthenticationService:
			scope.$watchCollection(function() {
				return SeNotificationsService.notifications;
			}, function(newValue) {
				if (_.some(newValue, {tag: "notifications.SeAuthenticateService.unauthorized", severity: "ERROR"})) {
					openDropdown(element);
				}
			});

		}
	};
});
