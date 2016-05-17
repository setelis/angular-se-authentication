angular.module("seAuthentication.service", ["restangular", "seNotifications.service",
	"seAjax.sniffer", "ui.router"]).provider("SeAuthenticationService", function SeAuthenticationServiceProvider() {
	"use strict";
	var provider = this;

	/*jshint -W072 */
	function SeAuthenticationService($q, SeNotificationsService, $rootScope, $state,
		SeAjaxRequestsSnifferService, CONFIGURED_OPTIONS) {
		/*jshint +W072 */
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
			function initLoggedMember(response, showError) {
				if (!response) {
					if (service.currentLoggedMemberHolder.logged) {
						var showMessage = showError ? SeNotificationsService.showNotificationError : SeNotificationsService.showNotificationInfo;
						showMessage(TAG_LOGOUT);
					}
					return setNotLogged();
				} else {
					SeNotificationsService.removeTag(TAG_LOGOUT);
					return setLogged(response);
				}
			}

			service.login = function(loginDTO) {
				return CONFIGURED_OPTIONS.endpoints.login(loginDTO).then(function(response) {
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
				return CONFIGURED_OPTIONS.endpoints.logout.then(function() {
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
				return CONFIGURED_OPTIONS.endpoints.reload().then(_.partialRight(initLoggedMember, showError));
			};
			service.checkMember = function() {
				if (service.currentLoggedMemberHolder.logged) {
					return CONFIGURED_OPTIONS.endpoints.check().then(function(response) {
						if (response) {
							// this is just check - if user is logged - do not change member (use it again)
							response = service.currentLoggedMemberHolder.member;
						}
						return initLoggedMember(response, false);
					});
				} else {
					return service.reloadLoggedMember(false);
				}
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
						if (toParams[CONFIGURED_OPTIONS.params.redirect]) {
							stateBeforeLogin = {fromUrl: toParams[CONFIGURED_OPTIONS.params.redirect]};
						}
					} else {
						stateBeforeLogin = {
							fromState: toState,
							fromParams: toParams
						};
					}
					service.checkMember();
				});

				if ($state.params[CONFIGURED_OPTIONS.params.redirect]) {
					stateBeforeLogin = {fromUrl: $state.params[CONFIGURED_OPTIONS.params.redirect]};
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
	}

	var DEFAULT_OPTIONS = {
		params: {
			redirect: "redirectto"
		}
	};
	var customizedOptions;

	provider.setCustomizedOptions = function(options) {
		customizedOptions = options;
	};
	provider.getDefaultOptions = function() {
		return angular.copy(DEFAULT_OPTIONS);
	};
	provider.$get = ["Restangular", "$q", "SeNotificationsService", "$rootScope", "$state", "SeAjaxRequestsSnifferService", "$injector",
		function SeSearchHelperServiceFactory(Restangular, $q, SeNotificationsService, $rootScope, $state, SeAjaxRequestsSnifferService, $injector) {
			var effectiveOptions = _.assign({}, DEFAULT_OPTIONS, customizedOptions);
			if (!effectiveOptions.endpoints) {
				// TODO use config to move this part to default options
				var defaultAuthenticateEndpoint = Restangular.all("authenticate");

				effectiveOptions.endpoints = {
					login: function(loginDto) {
						return defaultAuthenticateEndpoint.post(loginDto);
					},
					logout: function() {
						return defaultAuthenticateEndpoint.remove();
					},
					reload: function() {
						return defaultAuthenticateEndpoint.customGET();
					},
					check: function() {
						return defaultAuthenticateEndpoint.customGET();
					}
				};
			} else {
				// config is used because Restangular can't be injected in config phase
				effectiveOptions.endpoints.config($injector);
			}

			return new SeAuthenticationService($q, SeNotificationsService, $rootScope, $state, SeAjaxRequestsSnifferService, effectiveOptions);
		}
	];

});
