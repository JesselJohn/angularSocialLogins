! function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {
        return;
    }
    js = d.createElement(s);
    js.id = id;
    js.async = true;
    js.src = "https://apis.google.com/js/api:client.js";
    js.onload = function() {
        var event = new Event('GOOGLE_API_LOADED');
        window.dispatchEvent(event);
    };

    window.addEventListener('load', function() {
        fjs.parentNode.insertBefore(js, fjs);
    }, false);
}(document, 'script', 'google-jssdk');

! function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {
        return;
    }
    js = d.createElement(s);
    js.id = id;
    js.async = true;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    window.addEventListener('load', function() {
        fjs.parentNode.insertBefore(js, fjs);
    }, false);
}(document, 'script', 'facebook-jssdk');

! function(window, angular, undefined) {
    var FACEBOOK = {
            MODULE: 'user.fb',
            TEMPLATE_MODULE: 'user.fbtmpl',
            FACTORY: 'AUTH.FBFACTORY',
            CONTROLLER: 'AUTH.FBCONTROLLER',
            DIRECTIVE: 'userFb',
            TEMPLATE_URL: 'template/fb.html',
            CONTROLLER_AS: 'fb',
            SETTINGS: {
                isInit: false,
                isLoggedIn: false
            }
        },
        GOOGLE = {
            MODULE: 'user.gmail',
            TEMPLATE_MODULE: 'user.gmailtmpl',
            LOAD_EVENT: 'auth2',
            FACTORY: 'AUTH.GOOGLEFACTORY',
            CONTROLLER: 'AUTH.GOOGLECONTROLLER',
            DIRECTIVE: 'userGmail',
            TEMPLATE_URL: 'template/gmail.html',
            CONTROLLER_AS: 'gmail',
            SETTINGS: {
                isInit: false,
                isLoggedIn: false
            }
        },
        POPUP = {
            MODULE: 'user.popup',
            TEMPLATE_MODULE: 'user.popuptmpl',
            CONTROLLER: 'AUTH.POPUPCONTROLLER',
            DIRECTIVE: 'userPopup',
            TEMPLATE_URL: 'template/popup.html',
            CONTROLLER_AS: 'popup',
            SETTINGS: {
                isOpen: false
            }
        },
        TEMPLATES = {
            MODULE: 'user.authtmpl',
            DEPENDENCIES: [POPUP.TEMPLATE_MODULE, FACEBOOK.TEMPLATE_MODULE, GOOGLE.TEMPLATE_MODULE]
        },
        MAIN_MODULE = {
            MODULE: 'user.auth',
            DEPENDENCIES: ['ngCookies', POPUP.MODULE, FACEBOOK.MODULE, GOOGLE.MODULE, TEMPLATES.MODULE]
        };

    angular.module(TEMPLATES.MODULE, TEMPLATES.DEPENDENCIES);
    angular.module(MAIN_MODULE.MODULE, MAIN_MODULE.DEPENDENCIES);

    angular.module(MAIN_MODULE.MODULE)
        .provider('userauth', [function() {
            var FBsettings = null,
                FBLoginRtnsettings = null,
                GoogleSettings = null,
                userauth = {
                    setFbSettings: setFbSettingsFn,
                    setFbLoginRtnSettings: setFbLoginRtnSettingsFn,
                    setGoogleSettings: setGoogleSettingsFn,
                    $get: [function() {
                        return {
                            'FBsettings': FBsettings,
                            'FBLoginRtnsettings': FBLoginRtnsettings,
                            'GoogleSettings': GoogleSettings
                        }
                    }]
                };

            function setFbSettingsFn(obj) {
                FBsettings = obj;
            }

            function setFbLoginRtnSettingsFn(obj) {
                FBLoginRtnsettings = obj;
            }

            function setGoogleSettingsFn(obj) {
                GoogleSettings = obj;
            }

            return userauth;
        }]);

    angular.module(POPUP.MODULE, [])
        .controller(POPUP.CONTROLLER, ['$scope', function($scope) {
            this.settings = $scope.settings = $scope.settings || POPUP.SETTINGS;
        }])
        .directive(POPUP.DIRECTIVE, [function() {
            var popup = {
                scope: {
                    settings: '=?'
                },
                replace: true,
                templateUrl: POPUP.TEMPLATE_URL,
                transclude: true,
                controllerAs: POPUP.CONTROLLER_AS,
                controller: POPUP.CONTROLLER
            };

            return popup;
        }]);

    angular.module(FACEBOOK.MODULE, [])
        .constant('FACEBOOK_CONSTANTS', {
            SIGN_IN_LISTENER: 'FB_SIGNED_IN',
            STATUS: {
                CONNECTED: 'connected',
                NOT_AUTHORIZED: 'not_authorized'
            }
        })
        .factory(FACEBOOK.FACTORY, ['$q', '$rootScope', 'userauth', 'FACEBOOK_CONSTANTS',
            function($q, $rootScope, userauth, FACEBOOK_CONSTANTS) {
                var FB_DEFER = $q.defer(),
                    fb = {
                        fbAsync: function(cB) {
                            FB_DEFER.promise.then(cB);
                        },
                        actOnLoginState: function(response) {
                            if (response.status == FACEBOOK_CONSTANTS.STATUS.CONNECTED) {
                                fb.fbAsync(function(FB) {
                                    FB.api('/me', function(meresponse) {
                                        $rootScope.$broadcast(FACEBOOK_CONSTANTS.SIGN_IN_LISTENER, response, meresponse);
                                    });
                                });
                            } else if (response.status == FACEBOOK_CONSTANTS.STATUS.NOT_AUTHORIZED) {
                                $rootScope.$broadcast(FACEBOOK_CONSTANTS.SIGN_IN_LISTENER, response);
                            } else {
                                $rootScope.$broadcast(FACEBOOK_CONSTANTS.SIGN_IN_LISTENER, response);
                            }
                        }
                    };

                if (userauth.FBsettings === null) {
                    throw "Please provide FB login webapp settings";
                }

                // When FB is initiated
                window.fbAsyncInit = function() {
                    FB.init(userauth.FBsettings);

                    FB.getLoginStatus(function(response) {
                        fb.actOnLoginState(response);
                    }, userauth.FBLoginRtnsettings);

                    FB_DEFER.resolve(FB);
                };

                return fb;
            }
        ])
        .controller(FACEBOOK.CONTROLLER, ['$scope', 'FACEBOOK_CONSTANTS', FACEBOOK.FACTORY, 'userauth',
            function($scope, FACEBOOK_CONSTANTS, fbfactory, userauth) {
                var that = this;

                function FBLoginFn() {
                    FB.login(function(response) {
                        fbfactory.actOnLoginState(response);
                    }, userauth.FBLoginRtnsettings);
                }

                that.settings = $scope.settings = $scope.settings || FACEBOOK.SETTINGS;

                $scope.FBLogin = FBLoginFn;
            }
        ])
        .directive(FACEBOOK.DIRECTIVE, ['FACEBOOK_CONSTANTS',
            function(FACEBOOK_CONSTANTS) {
                var fb = {
                    scope: {
                        settings: '=?'
                    },
                    replace: true,
                    templateUrl: FACEBOOK.TEMPLATE_URL,
                    transclude: true,
                    link: function($scope, $element, $attrs, popUpController) {
                        $scope.$on(FACEBOOK_CONSTANTS.SIGN_IN_LISTENER, function(event, response, meresponse) {
                            $scope.$apply(function() {
                                $scope.settings.isInit = true;
                                if (response.status == FACEBOOK_CONSTANTS.STATUS.CONNECTED) {
                                    $scope.settings.isLoggedIn = true;
                                    popUpController.settings.isOpen = false;
                                }
                            });
                        });
                    },
                    controllerAs: FACEBOOK.CONTROLLER_AS,
                    controller: FACEBOOK.CONTROLLER,
                    require: "^?" + POPUP.DIRECTIVE,
                };

                return fb;
            }
        ]);

    angular.module(GOOGLE.MODULE, [])
        .constant('GOOGLE_CONSTANTS', {
            SDK_LOADED: 'GOOGLE_API_LOADED',
            SIGN_IN_LISTENER: 'GOOGLE_SIGNED_IN'
        })
        .factory(GOOGLE.FACTORY, ['$q', '$rootScope', 'userauth', 'GOOGLE_CONSTANTS',
            function($q, $rootScope, userauth, GOOGLE_CONSTANTS) {
                var GOOGLE_DEFER = $q.defer(),
                    google = {
                        onLogin: onLoginFn,
                        googleAsync: function(cB) {
                            GOOGLE_DEFER.promise.then(cB);
                        }
                    };

                function onLoginFn(googleUser) {
                    $rootScope.$broadcast(GOOGLE_CONSTANTS.SIGN_IN_LISTENER, googleUser);
                }

                if (userauth.GoogleSettings === null) {
                    throw "Please provide Google login webapp settings";
                }

                // Execute after google SDK is loaded
                window.addEventListener(GOOGLE_CONSTANTS.SDK_LOADED, function() {
                    $rootScope.$broadcast(GOOGLE_CONSTANTS.SDK_LOADED);
                    gapi.load(GOOGLE.LOAD_EVENT, function() {
                        // Retrieve the singleton for the GoogleAuth library and set up the client.
                        var auth = gapi.auth2.init(userauth.GoogleSettings);

                        auth.currentUser.listen(onLoginFn);

                        GOOGLE_DEFER.resolve([gapi, auth]);
                    });
                }, false)

                return google;
            }
        ])
        .controller(GOOGLE.CONTROLLER, ['$scope', GOOGLE.FACTORY,
            function($scope, GOOGLE_CONSTANTS, googlefactory) {
                this.settings = $scope.settings = $scope.settings || GOOGLE.SETTINGS;
            }
        ])
        .directive(GOOGLE.DIRECTIVE, [GOOGLE.FACTORY, 'GOOGLE_CONSTANTS',
            function(googlefactory, GOOGLE_CONSTANTS) {
                var gmail = {
                    scope: {
                        settings: '=?'
                    },
                    replace: true,
                    templateUrl: GOOGLE.TEMPLATE_URL,
                    transclude: true,
                    link: function($scope, $element, $attrs, popUpController) {
                        googlefactory.googleAsync(function(obj) {
                            var gapi = obj[0],
                                auth = obj[1];
                            auth.attachClickHandler($element[0], {}, googlefactory.onLogin,
                                function(error) {
                                    alert(JSON.stringify(error, undefined, 2));
                                }
                            );
                        });

                        $scope.$on(GOOGLE_CONSTANTS.SIGN_IN_LISTENER, function(event, response) {
                            $scope.$apply(function() {
                                $scope.settings.isInit = true;
                                if (response.getBasicProfile() !== undefined) {
                                    $scope.settings.isLoggedIn = true;
                                    popUpController.settings.isOpen = false;
                                }
                            });
                        });
                    },
                    controllerAs: GOOGLE.CONTROLLER_AS,
                    controller: GOOGLE.CONTROLLER,
                    require: "^?" + POPUP.DIRECTIVE,
                };

                return gmail;
            }
        ]);

    angular.module(POPUP.TEMPLATE_MODULE, []).run(["$templateCache", function($templateCache) {
        $templateCache.put(POPUP.TEMPLATE_URL, "" +
            "<div class='user-popup' ng-show='settings.isOpen'>" +
            "   <div class='user-popup-wrapper'>" +
            "       <div class='popup-content' ng-transclude></span>" +
            "   </div>" +
            "</div>"
        );
    }]);

    angular.module(FACEBOOK.TEMPLATE_MODULE, []).run(["$templateCache", function($templateCache) {
        $templateCache.put(FACEBOOK.TEMPLATE_URL, "" +
            "<p class='user-social fb' ng-click='FBLogin()' ng-show='settings.isInit && !settings.isLoggedIn'>" +
            "   <i class='fa fa-facebook social-icon'></i>" +
            "   <span ng-transclude></span>" +
            "</p>"
        );
    }]);

    angular.module(GOOGLE.TEMPLATE_MODULE, []).run(["$templateCache", function($templateCache) {
        $templateCache.put(GOOGLE.TEMPLATE_URL, "" +
            "<p class='user-social gmail' ng-show='settings.isInit && !settings.isLoggedIn'>" +
            "   <i class='fa fa-google social-icon'></i>" +
            "   <span ng-transclude></span>" +
            "</p>"
        );
    }]);
}(window, angular);
