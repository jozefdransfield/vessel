"use strict";


var _ = require("underscore")._;

function construct(constructor, args) {
    function F() {
        return constructor.apply(this, args);
    }

    F.prototype = constructor.prototype;
    return new F();
}

function trim(str) {
    return str.replace(/^\s+/, '').replace(/\s+$/, '');
}

function parseParams(vessel, func) {
    var paramMatcher = /^.*function.*\((.*)\)/;
    var match = paramMatcher.exec(func.toString());

    var str = match[1];
    var params = _.chain(str.split(',')).
        map(function (param) {
            return trim(param);
        }).
        filter(function (param) {
            return param && param !== '';
        }).
        value();

    var args = [];
    for (var i in params) {
        var param = params[i];
        args.push(vessel.get(param));
    }
    return args;
}

function Constructor(func) {
    this.func = func;
}

module.exports.Vessel = function Vessel() {
    var instances = {};
    var map = {};
    this.constructor = function (name, constructor) {
        map[name] = new Constructor(constructor);
    };

    this.object = function (name, object) {
        instances[name] = object;
    };

    this.func = function(name, func) {
        map[name] = func;
    };

    this.get = function (name) {
        var args, instance;
        if (!instances[name] && !map[name]) {
            throw new Error(name + " does not exist in this vessel");
        } else if (instances[name]) {
            return instances[name];
        } else if (map[name] instanceof Function) {
            var func = map[name];
            args = parseParams(this, func);
            instance = func.apply(null, args);
            instances[name] = instance;
            return instance;
        } else if (map[name] instanceof Constructor) {
            var constructor = map[name];
            args = parseParams(this, constructor.func);
            instance = construct(constructor.func, args);
            instances[name] = instance;
            return instance;
        }
    };
};
