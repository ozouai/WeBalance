import * as chai from "chai";
import * as certStore from "../CertificateStorage";
import * as fs from "fs";
import * as fse from "fs-extra";
import * as rimraf from "rimraf";

describe("Certificate Storage Tests", ()=>{

    it("Creating temporary directory", ()=>{
        if(!fs.existsSync("temp/test"))
            fse.mkdirp("temp/test");
        process.env.CONFIG_DIR = "temp/test";
    });



    let store : certStore.CertificateStorage;
    it("Should be able to be created", ()=>{
       store = new certStore.CertificateStorage();
       chai.assert(store !== null, "Error Instantiating");
    }).timeout(7000);


    it("Try Register certificate, compare certificate count",()=> {
        let firstCount = store.getCertList().length;
        store.registerKey("test", "test", fs.readFileSync("tests/testCerts/cert.pem", "UTF-8"), fs.readFileSync("tests/testCerts/cert.crt", "UTF-8"), "test");
        let secondCount = store.getCertList().length;
        chai.assert.notEqual(firstCount, secondCount, "Certificate wasn't added");
    });

    it("Check to ensure test certificate was added", ()=>{
        chai.assert(store.hasCertForKey("test"), "Test cert missing");
    });

    it("Check to ensure that a random certificate doesn't exist", ()=>{
        chai.assert(!store.hasCertForKey("blahblahblah"), "Random cert exists???");
    })

    it("Default key shouldn't be null", ()=>{
        chai.assert.isNotNull(store.getDefaultKey());
        chai.assert.isNotNull(store.getDefaultCert());
    });
    let sniHook: (domain, cb?)=>void;
    let defaultHook;
    it("SNI can be hooked", ()=>{
        sniHook = store.SNIHook();
        chai.assert.isFunction(sniHook, "SNI Hook isn't callable");
    })

    it("Should have a default cert, sync", ()=>{
        chai.assert.isNotNull(sniHook("default"));
    })

    it("Should have a default cert, async", (next)=>{
        sniHook("default", (error, cert)=>{
            chai.assert.ifError(error, "There was an error");
            chai.assert.isNotNull(cert);
            defaultHook = cert;
            next();
        })
    });

    it("Default cert should be same from sync and async", (next)=>{
        let sync = sniHook("default");
        sniHook("default", (error, cert)=>{
            chai.assert.ifError(error, "There was an error");
            chai.assert.equal(sync, cert);
            next();
        })
    });

    it("Cert for default and test should be the same", ()=>{
        let def = sniHook("default");
        let test = sniHook("test");
        chai.assert.equal(def, test, "Certificates are not the same");
    })

    it("Assign test cert to 'test.local' domain", ()=>{
        store.addCertToDomain("test.local", "test");
    })

    it("Cert for default and test are not the same", ()=>{
        let def = sniHook("default");
        let test = sniHook("test.local");
        chai.assert.notEqual(def, test, "Certificates are the same");
    })


    it("Destroy", ()=>{
        store = null;
    });

    it("Should be recreated from disk", ()=>{
        store = new certStore.CertificateStorage();
        chai.assert(store !== null, "Error Instantiating");
    })

    it("Should have a single cert after recreation", ()=>{
        chai.assert.equal(store.getCertList().length, 1, "Cert wasn't reloaded");
    })

    it("Deleting temporary directory", ()=>{
        rimraf.sync("temp/test");
        chai.assert(true, "Can't Delete");
    })
});



