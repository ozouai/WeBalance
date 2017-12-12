"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var LetsEncryptAgent = (function () {
    function LetsEncryptAgent(store) {
        this.leHttpChallenge = require("le-challenge-fs").create({
            webrootPath: path.normalize(process.env.CONFIG_DIR + "/acme/"),
            debug: true
        });
        this.le = require("greenlock").create({
            server: require("greenlock").productionServerUrl,
            challenges: {
                "http-01": this.leHttpChallenge
            },
            challengeType: "http-01",
            agreeToTerms: leAgree,
            debug: false
        });
        this.certStore = store;
    }
    LetsEncryptAgent.prototype.register = function (domain, email, cb) {
        var self = this;
        this.le.register({
            domains: [domain],
            email: email,
            agreeTos: true,
            rsaKeySize: 2048,
            challengeType: "http-01"
        }).then(function (results) {
            console.log(results);
            self.certStore.registerKey("__letsEncrypt-" + domain, "Let's Encrypt - " + domain, results.privkey, results.cert, results.chain);
            cb(null, "__letsEncrypt-" + domain);
        }, function (err) {
            console.log(err);
            cb(err, null);
        });
    };
    return LetsEncryptAgent;
}());
exports.LetsEncryptAgent = LetsEncryptAgent;
function leAgree(opts, agreeCb) {
    // opts = { email, domains, tosUrl }
    agreeCb(null, opts.tosUrl);
}
