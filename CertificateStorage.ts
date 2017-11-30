import * as tls from "tls";
import * as fs from "fs";
import * as path from "path";
import * as forge from "node-forge";
export class CertificateStorage {
    private compiledContexts : {
        [key: string]: tls.SecureContext
    } = {};
    private certStore: {
        [key: string]: {
            key: string,
            cert: string,
            ca: string
        }
    } = {};
    private initialize() {
        this.compiledContexts = {};
    }
    private defaultKey: string;
    private defaultCert: string;
    private defaultContext: tls.SecureContext;
    constructor() {
        //if(!fs.existsSync(path.normalize(`${process.env.CONFIG_DIR}/certs/`))) fs.mkdirSync(path.normalize(`${process.env.CONFIG_DIR}/certs/`));
        if(!fs.existsSync(path.normalize(`${process.env.CONFIG_DIR}/certs.json`))) {
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
            this.save();
        } else {
            var d = JSON.parse(fs.readFileSync(path.normalize(`${process.env.CONFIG_DIR}/certs.json`), "utf-8"));
            this.defaultKey = d.default.key;
            this.defaultCert = d.default.cert;
            this.certStore = d.certs;
            this.defaultContext = tls.createSecureContext({
                key: this.defaultKey,
                cert: this.defaultCert
            });
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

    public registerKey(domain: string, privKey: string, cert: string, chain: string) {
        let context = tls.createSecureContext({
            key: privKey,
            cert: cert,
            ca: chain
        });
        this.certStore[domain] = {
            key: privKey,
            cert: cert,
            ca: chain
        };
        this.compiledContexts[domain] = context;
        this.save();
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
        fs.writeFileSync(path.normalize(`${process.env.CONFIG_DIR}/certs.json`), JSON.stringify(d));
    }

    private _SNIHook(domain, cb) {
        if(this.compiledContexts[domain]) {
            if(cb) {
                cb(null, this.compiledContexts[domain]);
            } else{
                return this.compiledContexts[domain];
            }
        } else {
            console.log("None Exist");
            if(cb) cb(null, this.defaultContext);
            else {
                return this.defaultContext;
            }
        }
    }



}
