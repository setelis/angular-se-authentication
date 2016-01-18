angular.module("seAuthentication.popup", ["seNotifications.service", "ui.router"]).
directive("seAuthenticationPopup", function (SeAuthenticationService) {
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
			var unregister = SeAuthenticationService.addAuthenticationListener({
				onLoginRequired: function() {
					openDropdown(element);
				}
			});
			scope.$on("$destroy", unregister);
		}
	};
});
