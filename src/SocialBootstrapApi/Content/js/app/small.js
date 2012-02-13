;(function (root)
{  
    $.ss.validation.overrideMessages = true;

	var app = root.App = root.App || {};
    var emptyFn = function() {};
    
	_.mixin({
		formData: function (form)
		{
			var ret = {};
			$(form).find("INPUT,TEXTAREA").each(function() {
				if (this.type == "button" || this.type == "submit") return;
				ret[this.name] = $(this).val();
			});
			return ret;
		},
		xhrMessage: function (xhr)
		{
			try
			{
				var respObj = JSON.parse(xhr.responseText);
				if (!respObj.responseStatus) return null;
				return respObj.responseStatus.message;
			}
			catch (e)
			{
				return null;
			}
		},
        get: function (url, data, success, error) {
            if (_.isFunction(data)) {
                success = data;
                error = success;
                data = undefined;
            }
            return _.ajax({
                type: 'GET',
                url: url,
                data: data,
                success: success,
                error: error
            });
        },
		post: function (opt) {
		    return _.ajax(opt);
		},
        ajax: function (opt)
		{
            if (root.BASE_URL && opt.url.indexOf("://") === -1 && opt.url.charAt(0) !== "/")
                opt.url = root.BASE_URL + opt.url;
                
            var o = _.defaults(opt, {
               type: 'POST',
               loading: function() {
                   $(document.body).add(opt.form).addClass("loading");
               },
               finishedLoading: function() {
                   $(document.body).add(opt.form).removeClass("loading");
               },
               dataType: "json"
            });
			o.loading();
			$.ajax({
				type: o.type,
				url: o.url,
				data: o.data,
				success: function()
				{
					//console.log(arguments);
					o.finishedLoading();
				    $(o.form).clearErrors();
					if (o.success) o.success.apply(null, arguments);
				},
				error: function(xhr,err,status)
				{
					//console.log(arguments);
					o.finishedLoading();
				    try {
				        if (o.form) {
				            var r = JSON.parse(xhr.responseText);
				            $(o.form).applyErrors(r && r.responseStatus);
				        }
				    } catch(e){}
					(o.error || (app.error || emptyFn)).apply(null, arguments);
				},
				dataType: o.dataType || "json"
			});
		}
	});

	app.BaseModel = Backbone.Model.extend({
		parse: function (resp, xhr)
		{
			if (!resp) return resp;
			return resp.result || resp.results || resp;
		},
		_super: function (funcName)
		{
			return this.constructor.__super__[funcName].apply(this, _.rest(arguments));
		}
	});

	app.BaseView = Backbone.View.extend({		
		loading: function ()
		{
			$(this.el).css({ opacity: 0.5 });
		},
		finishedLoading: function ()
		{
			$(this.el).css({ opacity: 1 });
		}
	});

})(window);

;(function() {
  var KoffeeKlazz, KoffeeKlazz111, coffeeTest, coffeeTest2;

  coffeeTest = function(x) {
    return x * x * x;
  };

  coffeeTest2 = function(x) {
    return x * x * x;
  };

  KoffeeKlazz = (function() {

    function KoffeeKlazz(name) {
      this.name = name;
    }

    KoffeeKlazz.prototype.move = function(meters) {
      return alert(this.name + (" moved " + meters + "m."));
    };

    return KoffeeKlazz;

  })();

  KoffeeKlazz111 = (function() {

    function KoffeeKlazz111(name) {
      this.name = name;
    }

    KoffeeKlazz111.prototype.move = function(meters) {
      return alert(this.name + (" moved " + meters + "m."));
    };

    return KoffeeKlazz111;

  })();

}).call(this);

;/// <reference path="base.js" />
/// <reference path="login.js" />
/// <reference path="register.js" /> 
/// <reference path="userprofile.js" />
/// <reference path="twitter.js" />
(function (root) 
{
	var app = root.App;

	_.extend(app, {
	    baseUrl: window.BASE_URL,
		UnAuthorized: 401,
		initialize: function ()
		{
			this.handleClicks();
		},
		handleClicks: function ()
		{
			$(document.body).click(function (e)
			{
				var dataCmd = $(e.srcElement).data('cmd');
				if (!dataCmd) return;

				var cmd = dataCmd.split(':'),
					evt = cmd[0],
					args = cmd.length > 1 ? cmd[1].split(',') : [];

				app.sendCmd(evt, args);
			});
		},
		navigate: function(path) {
		    this.routes.navigate(path);
		},
		route: function (evt) {
		    var args = _.rest(arguments);
		    console.log("route: " + evt, args);
		    this.sendCmd(evt, args);
		},
		sendCmd: function (evt, args)
		{
		    if (_.isFunction(this.routes[evt])) 
		        this.routes[evt].apply(this.routes, args);
		    
			_.each(this.models, function (el) {
				if (_.isFunction(el[evt])) el[evt].apply(el, args);
			});
			_.each(this.views, function (el) {
				if (_.isFunction(el[evt])) el[evt].apply(el, args);
			});
		},
		error: function (xhr, err, statusText)
		{
			console.log("App Error: ", arguments);
			this.trigger("error", arguments);
			if (xhr.status == this.UnAuthorized)
			{
				//verify user is no longer authenticated
				$.getJSON("api/userinfo", function (r) { }, function (xhr) {
					if (xhr.status == this.UnAuthorized)
						location.href = location.href;
				});
			}
		}
	});
	_.extend(app, Backbone.Events);
	_.bindAll(app, "error", "trigger", "navigate", "sendCmd");  
    
	var login = new app.Login();
	var userProfile = new app.UserProfile({ login: login });
    var twitter = new app.Twitter({ profile: userProfile });
    
    app.Routes = Backbone.Router.extend({
        routes: {
            "tweets": "tweets",
            "friends": "friends",
            "followers": "followers",
            "userTweets": ":user/tweets",
            "userFriends": ":user/friends",
            "userFollowers": ":user/followers"
        },
        initialize: function (opt) {
            this.app = opt.app;
        },
        tweets: function () {
            this.app.route("twitterProfileChange", login.get('screenName'), "tweets");
        },
        friends: function () {
            this.app.route("twitterProfileChange", login.get('screenName'), "friends");
        },
        followers: function () {
            this.app.route("twitterProfileChange", login.get('screenName'), "followers");
        },
        userTweets: function (user) {
            this.app.route("twitterProfileChange", user, "tweets");
        },
        userFriends: function (user) {
            this.app.route("twitterProfileChange", user, "friends");
        },
        userFollowers: function (user) {
            this.app.route("twitterProfileChange", user, "followers");
        }
    });
    app.routes = new app.Routes({app:app});

    console.log(login.attributes, userProfile.attributes, twitter.attributes);

	app.models = {
		login: login,
		userProfile: userProfile,
		twitter: twitter
	};
    _.each(app.models, function(model) {
        model.sendCmd = app.sendCmd;
        model.navigate = app.navigate;
    })

	app.views = {
		login: new app.LoginView({
			el: "#login",
			model: login
		}),
		register: new app.RegisterView({
			el: "#register",
			model: login
		}),
		userProfile: new app.UserProfileView({
			el: "#user-profile",
			model: userProfile
		}),
        twitter: new app.TwitterView({
            el: "#twitter",
            model: twitter
		})
	};

	app.initialize();
    $(".tabs").tabs();


    Backbone.history.start({ pushState: true }); //{ pushState: true }
    $(function () {
    });

})(window);
