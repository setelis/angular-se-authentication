describe("SeAuthenticationService", function () {
	"use strict";
	var SeAuthenticationService;
	var $httpBackend, $rootScope;
	var SeAjaxRequestsSnifferService;

	beforeEach(module("seAuthentication.service", function($provide) {
		SeAjaxRequestsSnifferService = jasmine.createSpyObj("SeAjaxRequestsSnifferService",
			["onRequestError", "$$requestStarted", "$$requestSuccess"]);

		$provide.value("SeAjaxRequestsSnifferService", SeAjaxRequestsSnifferService);
	}));
	beforeEach(inject(function (_SeAuthenticationService_, _$httpBackend_, _$rootScope_) {
		SeAuthenticationService = _SeAuthenticationService_;
		$httpBackend = _$httpBackend_;
		$rootScope = _$rootScope_;
	}));
	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	describe("AuthenticationListeners", function() {
		var listener;
		var unregister;
		function resetCalls() {
			expect(listener.onLoginRequired.calls.reset());
			expect(listener.onNotLogged.calls.reset());
			expect(listener.onLogged.calls.reset());
		}
		function expectNoCalls() {
			expect(listener.onLoginRequired.calls.count()).toBe(0);
			expect(listener.onNotLogged.calls.count()).toBe(0);
			expect(listener.onLogged.calls.count()).toBe(0);
		}
		function expectCallOnNotLogged() {
			expect(listener.onLoginRequired.calls.count()).toBe(0);
			expect(listener.onNotLogged.calls.count()).toBe(1);
			expect(listener.onLogged.calls.count()).toBe(0);
			expect(listener.onNotLogged.calls.first().args.length).toBe(1);
			expect(listener.onNotLogged.calls.first().args[0]).toBeUndefined();
		}
		function expectCallOnLogged(arg) {
			expect(listener.onLoginRequired.calls.count()).toBe(0);
			expect(listener.onNotLogged.calls.count()).toBe(0);
			expect(listener.onLogged.calls.count()).toBe(1);
			expect(listener.onLogged.calls.first().args.length).toBe(1);
			expect(listener.onLogged.calls.first().args[0].plain()).toEqual(arg);
		}
		function login() {
			$httpBackend.expectGET("/authenticate").respond(200, "hello");
			$httpBackend.flush();
			$rootScope.$digest();
			resetCalls();
		}

		function expectCallOnLoginRequired() {
			expect(listener.onLoginRequired.calls.count()).toBe(1);
			expect(listener.onNotLogged.calls.count()).toBe(1);
			expect(listener.onLogged.calls.count()).toBe(0);
			expect(listener.onLoginRequired.calls.first().args.length).toBe(1);
			expect(listener.onLoginRequired.calls.first().args[0]).toBeUndefined();
			expect(listener.onNotLogged.calls.first().args.length).toBe(1);
			expect(listener.onNotLogged.calls.first().args[0]).toBeUndefined();
		}
		beforeEach(function() {
			listener = jasmine.createSpyObj("listener", ["onLoginRequired", "onNotLogged", "onLogged"]);
			unregister = SeAuthenticationService.addAuthenticationListener(listener);
		});

		it("should call onNotLogged when running service", function() {
			$httpBackend.expectGET("/authenticate").respond(200, "");
			expectNoCalls();
			$httpBackend.verifyNoOutstandingRequest();
			$httpBackend.flush();
			$rootScope.$digest();
			expectCallOnNotLogged();
		});
		it("should call onLoginRequired and onNotLogged when request returns 401", function() {
			login();
			expect(SeAjaxRequestsSnifferService.onRequestError.calls.count()).toBe(1);
			$httpBackend.expectPOST("/logs", function(data) {
				return data.indexOf("\\\"template\\\":\\\"notifications.SeAuthenticationService.unauthorized\\\"") !== -1;
			}).respond(200, "");

			SeAjaxRequestsSnifferService.onRequestError.calls.first().args[1]({status: 401});
			$httpBackend.flush();

			expectCallOnLoginRequired();
		});
		it("should call onLoginRequired and onNotLogged when request returns 403", function() {
			login();
			expect(SeAjaxRequestsSnifferService.onRequestError.calls.count()).toBe(1);
			$httpBackend.expectPOST("/logs", function(data) {
				return data.indexOf("\\\"template\\\":\\\"notifications.SeAuthenticationService.unauthorized\\\"") !== -1;
			}).respond(200, "");

			SeAjaxRequestsSnifferService.onRequestError.calls.first().args[1]({status: 403});
			$httpBackend.flush();

			expectCallOnLoginRequired();
		});
		it("should call onLogged when running service", function() {
			var member = {
				hello: "world"
			};
			$httpBackend.expectGET("/authenticate").respond(200, member);
			expectNoCalls();
			$httpBackend.verifyNoOutstandingRequest();
			$httpBackend.flush();
			$rootScope.$digest();
			expectCallOnLogged(member);
		});
		it("should unregister listener", function() {
			login();
			expect(SeAjaxRequestsSnifferService.onRequestError.calls.count()).toBe(1);
			$httpBackend.expectPOST("/logs", function(data) {
				return data.indexOf("\\\"template\\\":\\\"notifications.SeAuthenticationService.unauthorized\\\"") !== -1;
			}).respond(200, "");
			unregister();
			SeAjaxRequestsSnifferService.onRequestError.calls.first().args[1]({status: 403});
			$httpBackend.flush();

			expectNoCalls();
		});
	});
});
