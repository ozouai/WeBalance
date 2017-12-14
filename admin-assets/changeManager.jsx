"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var _ArrayKey = (function () {
    function _ArrayKey() {
    }
    return _ArrayKey;
}());
var _NullKey = (function () {
    function _NullKey() {
    }
    return _NullKey;
}());
var ArrayKey = new _ArrayKey();
var NullKey = new _NullKey();
var ChangeManager = (function () {
    function ChangeManager() {
        this.certLookup = {};
        this.calculators = {};
        for (var _i = 0, _a = ChangeManager.Calculators; _i < _a.length; _i++) {
            var c = _a[_i];
            var i = new c(this);
            this.calculators[i.key] = i;
        }
    }
    ChangeManager.prototype.setTree = function (host, tree) {
        this.host = host;
        this.originalTree = JSON.parse(JSON.stringify((tree)));
        this.tree = JSON.parse(JSON.stringify((tree)));
    };
    ChangeManager.prototype.recalculate = function () {
        window.setHeaderState({
            changes: this.calculateHumanChanges()
        });
        window.setEndpointState({
            data: this.tree
        });
    };
    ChangeManager.prototype.calculateHumanChanges = function () {
        var results = [];
        var keys = Object.keys(this.originalTree);
        for (var _i = 0, _a = Object.keys(this.tree); _i < _a.length; _i++) {
            var key = _a[_i];
            if (keys.indexOf(key) === -1)
                keys.push(key);
        }
        for (var _b = 0, keys_1 = keys; _b < keys_1.length; _b++) {
            var key = keys_1[_b];
            if (this.calculators[key]) {
                results = results.concat(this.calculators[key].calculateHumanChange(this.originalTree[key], this.tree[key]));
            }
        }
        return results;
    };
    ChangeManager.prototype.applyChanges = function (cb) {
        var results = [];
        var keys = Object.keys(this.originalTree);
        for (var _i = 0, _a = Object.keys(this.tree); _i < _a.length; _i++) {
            var key = _a[_i];
            if (keys.indexOf(key) === -1)
                keys.push(key);
        }
        for (var _b = 0, keys_2 = keys; _b < keys_2.length; _b++) {
            var key = keys_2[_b];
            if (this.calculators[key]) {
                results = results.concat(this.calculators[key].calculateComputerChange(this.originalTree[key], this.tree[key]));
            }
        }
        var requests = {};
        for (var _c = 0, results_1 = results; _c < results_1.length; _c++) {
            var r = results_1[_c];
            if (!requests[r.endpoint])
                requests[r.endpoint] = {};
            if (r.key instanceof _ArrayKey) {
                if (!requests[r.endpoint][r.type])
                    requests[r.endpoint][r.type] = [];
                requests[r.endpoint][r.type].push(r.value);
            }
            else if (typeof r.key == "string") {
                if (!requests[r.endpoint][r.type])
                    requests[r.endpoint][r.type] = {};
                requests[r.endpoint][r.type][r.key] = r.value;
            }
            else if (r.key instanceof _NullKey) {
                if (!requests[r.endpoint][r.type])
                    requests[r.endpoint][r.type] = {};
            }
        }
        for (var _d = 0, _e = Object.keys(requests); _d < _e.length; _d++) {
            var key = _e[_d];
            var endpoint = "/api/endpoint/" + this.host;
            if (key != "default")
                endpoint += "/" + key;
            for (var _f = 0, _g = Object.keys(requests[key]); _f < _g.length; _f++) {
                var method = _g[_f];
                switch (method) {
                    case "PATCH":
                        axios_1.default.patch(endpoint, requests[key][method]).then(function (res) {
                            if (!res.data.success)
                                return cb(null);
                            else
                                return cb(res.data.errors);
                        });
                        break;
                    case "DELETE":
                        axios_1.default.delete(endpoint, requests[key][method]).then(function (res) {
                            if (!res.data.success)
                                return cb(null);
                            else
                                return cb(res.data.errors);
                        });
                        break;
                    case "PUT":
                        axios_1.default.put(endpoint, requests[key][method]).then(function (res) {
                            if (!res.data.success)
                                return cb(null);
                            else
                                return cb(res.data.errors);
                        });
                        break;
                    case "POST":
                        axios_1.default.post(endpoint, requests[key][method]).then(function (res) {
                            if (!res.data.success)
                                return cb(null);
                            else
                                return cb(res.data.errors);
                        });
                        break;
                }
            }
        }
        console.log(requests);
    };
    ChangeManager.Calculators = [];
    return ChangeManager;
}());
exports.ChangeManager = ChangeManager;
var ChangeCalculator = (function () {
    function ChangeCalculator(changeManager) {
        this.changeManager = changeManager;
    }
    return ChangeCalculator;
}());
var BooleanChangeCalculator = (function (_super) {
    __extends(BooleanChangeCalculator, _super);
    function BooleanChangeCalculator() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.text_enabled = _this.key + " Enabled";
        _this.text_disabled = _this.key + " Disabled";
        return _this;
    }
    BooleanChangeCalculator.prototype.calculateHumanChange = function (original, modified) {
        var _this = this;
        if (original != modified) {
            if (modified)
                return [{ text: this.text_enabled, undo: function () { _this.changeManager.tree[_this.key] = original; _this.changeManager.recalculate(); } }];
            if (!modified)
                return [{ text: this.text_disabled, undo: function () { _this.changeManager.tree[_this.key] = original; _this.changeManager.recalculate(); } }];
        }
        return [];
    };
    BooleanChangeCalculator.prototype.calculateComputerChange = function (original, modified) {
        if (original != modified) {
            return [{ key: this.key, value: modified, type: "PATCH", endpoint: "default" }];
        }
        return [];
    };
    return BooleanChangeCalculator;
}(ChangeCalculator));
var TargetChangeCalculator = (function (_super) {
    __extends(TargetChangeCalculator, _super);
    function TargetChangeCalculator() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.key = "targets";
        return _this;
    }
    TargetChangeCalculator.prototype.calculateHumanChange = function (original, modified) {
        var _this = this;
        var results = [];
        var _loop_1 = function (m_target) {
            if (original.indexOf(m_target) == -1) {
                results.push({
                    text: "Add Target '" + m_target + "'",
                    undo: function () {
                        _this.changeManager.tree["targets"].splice(_this.changeManager.tree["targets"].indexOf(m_target), 1);
                        _this.changeManager.recalculate();
                    }
                });
            }
        };
        for (var _i = 0, modified_1 = modified; _i < modified_1.length; _i++) {
            var m_target = modified_1[_i];
            _loop_1(m_target);
        }
        var _loop_2 = function (o_target) {
            if (modified.indexOf(o_target) == -1) {
                results.push({
                    text: "Remove Target '" + o_target + "'",
                    undo: function () {
                        _this.changeManager.tree["targets"].push(o_target);
                        _this.changeManager.recalculate();
                    }
                });
            }
        };
        for (var _a = 0, original_1 = original; _a < original_1.length; _a++) {
            var o_target = original_1[_a];
            _loop_2(o_target);
        }
        return results;
    };
    TargetChangeCalculator.prototype.calculateComputerChange = function (original, modified) {
        var results = [];
        for (var _i = 0, modified_2 = modified; _i < modified_2.length; _i++) {
            var m_target = modified_2[_i];
            if (original.indexOf(m_target) == -1) {
                results.push({ key: ArrayKey, value: m_target, type: "PATCH", endpoint: "targets" });
            }
        }
        for (var _a = 0, original_2 = original; _a < original_2.length; _a++) {
            var o_target = original_2[_a];
            if (modified.indexOf(o_target) == -1) {
                results.push({ key: ArrayKey, value: o_target, type: "POST", endpoint: "targets/delete" });
            }
        }
        return results;
    };
    return TargetChangeCalculator;
}(ChangeCalculator));
var HTTPChangeCalculator = (function (_super) {
    __extends(HTTPChangeCalculator, _super);
    function HTTPChangeCalculator() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.key = "http";
        _this.text_enabled = "HTTP Endpoint Enabled";
        _this.text_disabled = "HTTP Endpoint Disabled";
        return _this;
    }
    return HTTPChangeCalculator;
}(BooleanChangeCalculator));
var HTTPSChangeCalculator = (function (_super) {
    __extends(HTTPSChangeCalculator, _super);
    function HTTPSChangeCalculator() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.key = "https";
        _this.text_enabled = "HTTPS Endpoint Enabled";
        _this.text_disabled = "HTTPS Endpoint Disabled";
        return _this;
    }
    return HTTPSChangeCalculator;
}(BooleanChangeCalculator));
var SelfSignedChangeCalculator = (function (_super) {
    __extends(SelfSignedChangeCalculator, _super);
    function SelfSignedChangeCalculator() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.key = "allowSelfSigned";
        _this.text_enabled = "Self Signed Certificates Enabled";
        _this.text_disabled = "Self Signed Certificated Disabled";
        return _this;
    }
    return SelfSignedChangeCalculator;
}(BooleanChangeCalculator));
var SSLChangeCalculator = (function (_super) {
    __extends(SSLChangeCalculator, _super);
    function SSLChangeCalculator() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.key = "sslCert";
        return _this;
    }
    SSLChangeCalculator.prototype.calculateHumanChange = function (original, modified) {
        var _this = this;
        if (modified == original)
            return [];
        if (modified == "letsEncrypt")
            return [{ text: "Request Let's Encrypt Certificate", undo: function () { _this.changeManager.tree[_this.key] = original; _this.changeManager.recalculate(); } }];
        else if (modified == "default")
            return [{ text: "Use Self-Signed Certificate", undo: function () { _this.changeManager.tree[_this.key] = original; _this.changeManager.recalculate(); } }];
        else
            return [{ text: "Use Certificate '" + this.changeManager.certLookup[modified] + "'", undo: function () { _this.changeManager.tree[_this.key] = original; _this.changeManager.recalculate(); } }];
    };
    SSLChangeCalculator.prototype.calculateComputerChange = function (original, modified) {
        if (modified == original)
            return [];
        return [{ key: "sslCert", value: modified, type: "PATCH", endpoint: "default" }];
    };
    return SSLChangeCalculator;
}(ChangeCalculator));
var FriendlyNameChangeCalculator = (function (_super) {
    __extends(FriendlyNameChangeCalculator, _super);
    function FriendlyNameChangeCalculator() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.key = "friendlyName";
        return _this;
    }
    FriendlyNameChangeCalculator.prototype.calculateHumanChange = function (original, modified) {
        var _this = this;
        if (modified == original)
            return [];
        return [{ text: "Set Friendly Name to '" + modified + "'", undo: function () { _this.changeManager.tree[_this.key] = original; _this.changeManager.recalculate(); } }];
    };
    FriendlyNameChangeCalculator.prototype.calculateComputerChange = function (original, modified) {
        if (modified == original)
            return [];
        return [{ key: "friendlyName", value: modified, type: "PATCH", endpoint: "default" }];
    };
    return FriendlyNameChangeCalculator;
}(ChangeCalculator));
ChangeManager.Calculators.push(TargetChangeCalculator);
ChangeManager.Calculators.push(HTTPChangeCalculator);
ChangeManager.Calculators.push(HTTPSChangeCalculator);
ChangeManager.Calculators.push(SelfSignedChangeCalculator);
ChangeManager.Calculators.push(SSLChangeCalculator);
ChangeManager.Calculators.push(FriendlyNameChangeCalculator);
var Token = (function () {
    function Token(name) {
        this.tokenName = name;
        this.token = localStorage.getItem("token_" + this.tokenName);
    }
    Token.prototype.toString = function () {
        return this.token;
    };
    Token.prototype.setToken = function (token) {
        this.token = token;
        localStorage.setItem("token_" + this.tokenName, this.token);
    };
    Token.prototype.hasToken = function () {
        if (!this.token)
            return false;
        return this.token.length > 0;
    };
    return Token;
}());
window.token = new Token("main");
window.Token = Token;
window["ChangeManager"] = ChangeManager;
window["changeManager"] = new ChangeManager();
