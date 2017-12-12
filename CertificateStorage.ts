import * as tls from "tls";
import * as fs from "fs";
import * as path from "path";
import * as forge from "node-forge";
import * as winston from "winston";
import * as safeSave from "./SafeSave";
const logger = winston.loggers.get("SSL");
export class CertificateStorage {
    private compiledContexts : {
        [key: string]: tls.SecureContext
    } = {};
    private contextLookup : {
        [key: string]: tls.SecureContext
    } = {};
    private certStore: {
        [key: string]: {
            friendlyName: string,
            key: string,
            cert: string,
            ca: string,
        }
    } = {};
    private initialize() {
        this.compiledContexts = {};
    }
    private defaultKey: string;
    private defaultCert: string;
    private defaultContext: tls.SecureContext;
    public getCertList(): Array<{key: string, name: string}> {
        let results = [];
        for(let key of Object.keys(this.certStore)) {
            let cert = this.certStore[key];
            let o = {key: key, name: key};
            if(cert.friendlyName) o.name = cert.friendlyName;
            results.push(o);
        }
        return results;
    }
    constructor() {
        //if(!fs.existsSync(path.normalize(`${process.env.CONFIG_DIR}/certs/`))) fs.mkdirSync(path.normalize(`${process.env.CONFIG_DIR}/certs/`));
        if(!fs.existsSync(path.normalize(`${process.env.CONFIG_DIR}/certs.json`))) {
            logger.info("Can't find certificate json, recreating");
            var keys = forge.pki.rsa.generateKeyPair(2048);
           var cert = (forge.pki as any).createCertificate();
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
            }];
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
            }]);
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
        } else {
            var d = JSON.parse(fs.readFileSync(path.normalize(`${process.env.CONFIG_DIR}/certs.json`), "utf-8"));
            logger.info("Loaded Certificate JSON with "+Object.keys(d.certs).length+" certificates");
            this.defaultKey = d.default.key;
            this.defaultCert = d.default.cert;
            this.certStore = d.certs;
            this.defaultContext = tls.createSecureContext({
                key: this.defaultKey,
                cert: this.defaultCert
            });
            this.compiledContexts["default"] = this.defaultContext;
            for(var key of Object.keys(this.certStore)) {
                let context = tls.createSecureContext({
                    key: this.certStore[key].key,
                    cert: this.certStore[key].cert,
                    ca: this.certStore[key].ca
                });
                this.compiledContexts[key] = context;
            }
        }
    }

    public registerKey(name: string, friendlyName: string, privKey: string, cert: string, chain: string) {
        let context = tls.createSecureContext({
            key: privKey,
            cert: cert,
            ca: chain
        });
        this.certStore[name] = {
            friendlyName: friendlyName,
            key: privKey,
            cert: cert,
            ca: chain
        };
        this.compiledContexts[name] = context;
        logger.verbose("Registered new certificate named '"+name+"'");
        this.save();
    }

    public hasCertForKey(key: string) : boolean {
        if(this.compiledContexts[key]) return true;
        return false;
    }

    public addCertToDomain(domain: string, cert: string) {
        this.contextLookup[domain] = this.compiledContexts[cert];
    }

    public SNIHook(): (domain, cb) =>void {
        return this._SNIHook.bind(this);
    }

    public getDefaultKey() {
        return this.defaultKey;
    }
    public getDefaultCert() {
        return this.defaultCert;
    }

    private save() {
        var d = {
            default: {
                cert: this.defaultCert,
                key: this.defaultKey
            },
            certs: this.certStore
        };
        safeSave.saveSync(path.normalize(`${process.env.CONFIG_DIR}/certs.json`), JSON.stringify(d))
        logger.verbose("Saved config file");
    }

    private _SNIHook(domain, cb) {
        if(this.contextLookup[domain]) {
            if(cb) {
                cb(null, this.contextLookup[domain]);
            } else{
                return this.contextLookup[domain];
            }
        } else {
            logger.error("Can't find certificate for domain '"+domain+"'");
            if(cb) cb(null, this.defaultContext);
            else {
                return this.defaultContext;
            }
        }
    }



}
