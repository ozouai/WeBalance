"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai = require("chai");
var certStore = require("../CertificateStorage");
var fs = require("fs");
var fse = require("fs-extra");
var rimraf = require("rimraf");
describe("Certificate Storage Tests", function () {
    it("Creating temporary directory", function () {
        if (!fs.existsSync("temp/test"))
            fse.mkdirp("temp/test");
        process.env.CONFIG_DIR = "temp/test";
    });
    var store;
    it("Should be able to be created", function () {
        store = new certStore.CertificateStorage();
        chai.assert(store !== null, "Error Instantiating");
    }).timeout(7000);
    it("Try Register certificate, compare certificate count", function () {
        var firstCount = store.getCertList().length;
        store.registerKey("test", "test", fs.readFileSync("tests/testCerts/cert.pem", "UTF-8"), fs.readFileSync("tests/testCerts/cert.crt", "UTF-8"), "test");
        var secondCount = store.getCertList().length;
        chai.assert.notEqual(firstCount, secondCount, "Certificate wasn't added");
    });
    it("Check to ensure test certificate was added", function () {
        chai.assert(store.hasCertForKey("test"), "Test cert missing");
    });
    it("Check to ensure that a random certificate doesn't exist", function () {
        chai.assert(!store.hasCertForKey("blahblahblah"), "Random cert exists???");
    });
    it("Default key shouldn't be null", function () {
        chai.assert.isNotNull(store.getDefaultKey());
        chai.assert.isNotNull(store.getDefaultCert());
    });
    var sniHook;
    var defaultHook;
    it("SNI can be hooked", function () {
        sniHook = store.SNIHook();
        chai.assert.isFunction(sniHook, "SNI Hook isn't callable");
    });
    it("Should have a default cert, sync", function () {
        chai.assert.isNotNull(sniHook("default"));
    });
    it("Should have a default cert, async", function (next) {
        sniHook("default", function (error, cert) {
            chai.assert.ifError(error, "There was an error");
            chai.assert.isNotNull(cert);
            defaultHook = cert;
            next();
        });
    });
    it("Default cert should be same from sync and async", function (next) {
        var sync = sniHook("default");
        sniHook("default", function (error, cert) {
            chai.assert.ifError(error, "There was an error");
            chai.assert.equal(sync, cert);
            next();
        });
    });
    it("Cert for default and test should be the same", function () {
        var def = sniHook("default");
        var test = sniHook("test");
        chai.assert.equal(def, test, "Certificates are not the same");
    });
    it("Assign test cert to 'test.local' domain", function () {
        store.addCertToDomain("test.local", "test");
    });
    it("Cert for default and test are not the same", function () {
        var def = sniHook("default");
        var test = sniHook("test.local");
        chai.assert.notEqual(def, test, "Certificates are the same");
    });
    it("Destroy", function () {
        store = null;
    });
    it("Should be recreated from disk", function () {
        store = new certStore.CertificateStorage();
        chai.assert(store !== null, "Error Instantiating");
    });
    it("Should have a single cert after recreation", function () {
        chai.assert.equal(store.getCertList().length, 1, "Cert wasn't reloaded");
    });
    it("Deleting temporary directory", function () {
        rimraf.sync("temp/test");
        chai.assert(true, "Can't Delete");
    });
});
