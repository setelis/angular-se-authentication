/*jshint -W072 */
angular.module("seAuthentication.service", ["restangular", "seNotifications.service",
	"seAjax.sniffer", "ui.router"]).service("SeAuthenticationService",
	function(Restangular, $q, SeNotificationsService, $rootScope, $state,
		SeAjaxRequestsSnifferService) {
/*jshint +W072 */
	"use strict";
	var TAG_LOGOUT = "notifications.SeAuthenticationService.logout";

	var service = this;

	var stateBeforeLogin = null;
	// used to populate the logged member
	var deferred = $q.defer();
	var authenticationListeners = [];

	service.currentLoggedMemberHolder = {
		member: null,
		logged: null
	};

	function notifyAuthenticationListeners(method, param1) {
		_.forEach(authenticationListeners, function(nextValue) {
			if (!nextValue[method]) {
				return;
			}
			nextValue[method](param1);
		});
	}

	function setNotLogged() {
		service.currentLoggedMemberHolder.member = null;
		service.currentLoggedMemberHolder.logged = false;
		deferred.reject(); // no member logged in
		deferred = $q.defer();

		notifyAuthenticationListeners("onNotLogged", undefined);

		// see setLogged() comment (why promise is used here)
		return $q.when(false);
	}
	function setLogged(response) {
		service.currentLoggedMemberHolder.member = response;
		service.currentLoggedMemberHolder.logged = !!response;
		deferred.resolve(response);

		notifyAuthenticationListeners("onLogged", response);

		// promise is used because additional data may be fetched from the server before "in logged" state in the future
		return $q.when(response);
	}

	function attachMethods() {
		// endpoint should be in config:
		var authenticateEndpoint = Restangular.all("authenticate");

		function initLoggedMember(response, showError) {
			if (!response) {
				if (service.currentLoggedMemberHolder.logged) {
					var showMessage = showError?SeNotificationsService.showNotificationError:SeNotificationsService.showNotificationInfo;
					showMessage(TAG_LOGOUT);
				}
				return setNotLogged();
			} else {
				SeNotificationsService.removeTag(TAG_LOGOUT);
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
			return authenticateEndpoint.remove().then(function() {
				initLoggedMember(null, false);
			});
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
		service.addAuthenticationListener = function(authenticationListener) {
			authenticationListeners.push(authenticationListener);
			return function() {
				_.pull(authenticationListeners, authenticationListener);
			};
		};
	}
	function attachListeners() {
		function onStateChange() {
			$rootScope.$on("$stateChangeStart", function(event, toState, toParams) {
				if (toState.name.indexOf(".login", toState.name.length - ".login".length) !== -1) {
					if (toParams.redirecto) {
						stateBeforeLogin = { fromUrl: toParams.redirecto };
					}
				} else {
					stateBeforeLogin = {
						fromState: toState,
						fromParams: toParams
					};
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
				notifyAuthenticationListeners("onLoginRequired", undefined);

				stateBeforeLogin = {
					fromState: $state.current,
					fromParams: angular.copy($state.params)
				};

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
