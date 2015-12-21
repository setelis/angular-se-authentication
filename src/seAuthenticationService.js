/*jshint -W072 */
angular.module("seAuthentication.service", ["restangular", "seNotifications.service",
	"seAjax.helper", "seAjax.sniffer", "ui.router"]).service("SeAuthenticationService",
	function(Restangular, $q, SeNotificationsService, $rootScope, $state, $injector, SeAjaxHelperService,
		SeAjaxRequestsSnifferService) {
/*jshint +W072 */
	"use strict";
	var TAG_LOGOUT = "notifications.SeAuthenticationService.logout";
	var TAG_401 = "notifications.SeAuthenticationService.unauthorized";

	var service = this;
	// endpoint should be in config:
	var authenticateEndpoint = Restangular.all("authenticate");

	var stateBeforeLogin = null;
	// used to populate the logged member
	var deferred = $q.defer();

	service.currentLoggedMemberHolder = {
		member: null,
		logged: null
	};

	function setNotLogged() {
		service.currentLoggedMemberHolder.member = null;
		service.currentLoggedMemberHolder.logged = false;
		deferred.reject(); // no member logged in
		deferred = $q.defer();

		// see setLogged() comment (why promise is used here)
		return $q.when(false);
	}
	function setLogged(response) {
		service.currentLoggedMemberHolder.member = response;
		service.currentLoggedMemberHolder.logged = !!response;
		deferred.resolve(response);

		// promise is used because additional data may be fetched from the server before "in logged" state in the future
		return $q.when(response);
	}

	function attachMethods() {
		function initLoggedMember(response, showError) {
			if (!response) {
				if (service.currentLoggedMemberHolder.logged) {
					var showMessage = showError?SeNotificationsService.showNotificationError:SeNotificationsService.showNotificationInfo;
					showMessage(TAG_LOGOUT);
				}
				return setNotLogged();
			} else {
				SeNotificationsService.removeTag(TAG_LOGOUT);
				SeNotificationsService.removeTag(TAG_401);
				return setLogged(response);
			}
		}

		service.login = function(loginDTO) {
			return authenticateEndpoint.post(loginDTO).then(function(response) {
				var promise = initLoggedMember(response, false);

				var result = stateBeforeLogin;

				// reset state
				stateBeforeLogin = null;
				return promise.then(function(initResponse) {
					return {
						member: initResponse,
						stateBeforeLogin: result
					};
				});
			});
		};

		service.logout = function() {
			initLoggedMember(null, false);
			return authenticateEndpoint.remove();
		};

		service.getLoggedMember = function() {
			if (service.currentLoggedMemberHolder.logged === false) {
				return $q.reject();
			}

			return deferred.promise;
		};
		service.reloadLoggedMember = function(showError) {
			return authenticateEndpoint.customGET().then(_.partialRight(initLoggedMember, showError));
		};
	}
	function attachListeners() {
		function onStateChange() {
			$rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams) {
				if (toState.name.indexOf(".login", toState.name.length - ".login".length) !== -1) {
					if (toParams.redirecto) {
						stateBeforeLogin = { fromUrl: toParams.redirecto };
					} else {
						stateBeforeLogin = {
							fromState: fromState,
							fromParams: fromParams
						};
					}
				} else {
					stateBeforeLogin = null;
				}
				service.reloadLoggedMember(false, true);
			});

			if ($state.params.redirecto) {
				stateBeforeLogin = { fromUrl: $state.params.redirecto };
			}
		}
		function on401() {
			SeAjaxRequestsSnifferService.onRequestError($rootScope, function(errorResponse) {
				// in config:
				if ([401, 403].indexOf(errorResponse.status) === -1) {
					return;
				}
				stateBeforeLogin = {
					fromState: $state.current,
					fromParams: angular.copy($state.params)
				};

				SeNotificationsService.showNotificationError(TAG_401);
				setNotLogged();
			});
		}

		onStateChange();
		on401();
	}
	attachMethods();
	attachListeners();

	service.reloadLoggedMember(false);
});
