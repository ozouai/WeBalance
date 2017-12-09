"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tls = require("tls");
var fs = require("fs");
var path = require("path");
var forge = require("node-forge");
var winston = require("winston");
var safeSave = require("./SafeSave");
var logger = winston.loggers.get("SSL");
var CertificateStorage = (function () {
    function CertificateStorage() {
        this.compiledContexts = {};
        this.contextLookup = {};
        this.certStore = {};
        //if(!fs.existsSync(path.normalize(`${process.env.CONFIG_DIR}/certs/`))) fs.mkdirSync(path.normalize(`${process.env.CONFIG_DIR}/certs/`));
        if (!fs.existsSync(path.normalize(process.env.CONFIG_DIR + "/certs.json"))) {
            logger.info("Can't find certificate json, recreating");
            var keys = forge.pki.rsa.generateKeyPair(2048);
            var cert = forge.pki.createCertificate();
            cert.publicKey = keys.publicKey;
            cert.serialNumber = '01';
            cert.validity.notBefore = new Date();
            cert.validity.notAfter = new Date();
            cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
            var attrs = [
                {
                    name: 'commonName',
                    value: 'ouiproxy'
                }, {
                    name: 'countryName',
                    value: 'US'
                }, {
                    shortName: 'ST',
                    value: 'Virginia'
                }, {
                    name: 'localityName',
                    value: 'Blacksburg'
                }, {
                    name: 'organizationName',
                    value: 'Test'
                }, {
                    shortName: 'OU',
                    value: 'Test'
                }
            ];
            cert.setSubject(attrs);
            // alternatively set subject from a csr
            //cert.setSubject(csr.subject.attributes);
            cert.setIssuer(attrs);
            cert.setExtensions([
                {
                    name: 'basicConstraints',
                    cA: true
                }, {
                    name: 'keyUsage',
                    keyCertSign: true,
                    digitalSignature: true,
                    nonRepudiation: true,
                    keyEncipherment: true,
                    dataEncipherment: true
                }, {
                    name: 'extKeyUsage',
                    serverAuth: true,
                    clientAuth: true,
                    codeSigning: true,
                    emailProtection: true,
                    timeStamping: true
                }, {
                    name: 'nsCertType',
                    client: true,
                    server: true,
                    email: true,
                    objsign: true,
                    sslCA: true,
                    emailCA: true,
                    objCA: true
                }, {
                    name: 'subjectAltName',
                    altNames: []
                }, {
                    name: 'subjectKeyIdentifier'
                }
            ]);
            cert.sign(keys.privateKey);
            this.defaultCert = forge.pki.certificateToPem(cert);
            this.defaultKey = forge.pki.privateKeyToPem(keys.privateKey);
            this.defaultContext = tls.createSecureContext({
                key: this.defaultKey,
                cert: this.defaultCert
            });
            this.compiledContexts["default"] = this.defaultContext;
            logger.info("Created Default Certificate");
            this.save();
        }
        else {
            var d = JSON.parse(fs.readFileSync(path.normalize(process.env.CONFIG_DIR + "/certs.json"), "utf-8"));
            logger.info("Loaded Certificate JSON with " + Object.keys(d.certs).length + " certificates");
            this.defaultKey = d.default.key;
            this.defaultCert = d.default.cert;
            this.certStore = d.certs;
            this.defaultContext = tls.createSecureContext({
                key: this.defaultKey,
                cert: this.defaultCert
            });
            this.compiledContexts["default"] = this.defaultContext;
            for (var _i = 0, _a = Object.keys(this.certStore); _i < _a.length; _i++) {
                var key = _a[_i];
                var context = tls.createSecureContext({
                    key: this.certStore[key].key,
                    cert: this.certStore[key].cert,
                    ca: this.certStore[key].ca
                });
                this.compiledContexts[key] = context;
            }
        }
    }
    CertificateStorage.prototype.initialize = function () {
        this.compiledContexts = {};
    };
    CertificateStorage.prototype.getCertList = function () {
        var results = [];
        for (var _i = 0, _a = Object.keys(this.certStore); _i < _a.length; _i++) {
            var key = _a[_i];
            var cert = this.certStore[key];
            var o = { key: key, name: key };
            if (cert.friendlyName)
                o.name = cert.friendlyName;
            results.push(o);
        }
        return results;
    };
    CertificateStorage.prototype.registerKey = function (name, privKey, cert, chain) {
        var context = tls.createSecureContext({
            key: privKey,
            cert: cert,
            ca: chain
        });
        this.certStore[name] = {
            key: privKey,
            cert: cert,
            ca: chain
        };
        this.compiledContexts[name] = context;
        logger.verbose("Registered new certificate named '" + name + "'");
        this.save();
    };
    CertificateStorage.prototype.hasCertForKey = function (key) {
        if (this.compiledContexts[key])
            return true;
        return false;
    };
    CertificateStorage.prototype.addCertToDomain = function (domain, cert) {
        this.contextLookup[domain] = this.compiledContexts[cert];
    };
    CertificateStorage.prototype.SNIHook = function () {
        return this._SNIHook.bind(this);
    };
    CertificateStorage.prototype.getDefaultKey = function () {
        return this.defaultKey;
    };
    CertificateStorage.prototype.getDefaultCert = function () {
        return this.defaultCert;
    };
    CertificateStorage.prototype.save = function () {
        var d = {
            default: {
                cert: this.defaultCert,
                key: this.defaultKey
            },
            certs: this.certStore
        };
        safeSave.saveSync(path.normalize(process.env.CONFIG_DIR + "/certs.json"), JSON.stringify(d));
        logger.verbose("Saved config file");
    };
    CertificateStorage.prototype._SNIHook = function (domain, cb) {
        if (this.contextLookup[domain]) {
            if (cb) {
                cb(null, this.contextLookup[domain]);
            }
            else {
                return this.contextLookup[domain];
            }
        }
        else {
            logger.error("Can't find certificate for domain '" + domain + "'");
            if (cb)
                cb(null, this.defaultContext);
            else {
                return this.defaultContext;
            }
        }
    };
    return CertificateStorage;
}());
exports.CertificateStorage = CertificateStorage;
