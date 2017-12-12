
import * as path from "path";
import {CertificateStorage} from "./CertificateStorage";


export class LetsEncryptAgent {
    private certStore: CertificateStorage;
    constructor(store: CertificateStorage) {
        this.certStore = store;
    }
    private leHttpChallenge = require("le-challenge-fs").create({
        webrootPath: path.normalize(`${process.env.CONFIG_DIR}/acme/`),
        debug: true
    });
    private  le = require("greenlock").create({
        server: require("greenlock").productionServerUrl,
        challenges: {
            "http-01": this.leHttpChallenge
        },
        challengeType: "http-01",
        agreeToTerms: leAgree,
        debug: false
    });

    public register(domain: string, email: string, cb:(err:Error, certName: string)=>void) {
        var self = this;
        this.le.register({
            domains: [domain],
            email: email,
            agreeTos: true,
            rsaKeySize: 2048,
            challengeType: "http-01"
        }).then(function(results) {
            console.log(results);
            self.certStore.registerKey("__letsEncrypt-"+domain, "Let's Encrypt - " + domain, results.privkey, results.cert, results.chain);
            cb(null, "__letsEncrypt-"+domain);
        }, function(err){
            console.log(err);
            cb(err, null);
        })
    }
}


function leAgree(opts, agreeCb) {
    // opts = { email, domains, tosUrl }
    agreeCb(null, opts.tosUrl);
}

