function signJWT(payload, header, protectedFields) {
    header = header || {
        alg: 'RS256',
        jwk: this.publicKey,
        nonce: this._replayNonce,
        typ: 'JWS',
    };
    var jsonProtectedHeader = JSON.stringify(header);
    var jsonPayload = JSON.stringify(payload);
    var publicHeader = Object.assign({}, header);
    protectedFields = protectedFields || ['nonce'];
    protectedFields.forEach(function (key) {
        publicHeader[key] = void 0;
        delete publicHeader[key];
    });
    var signatureInput = base64_encode(jsonProtectedHeader) + '.' +
        base64_encode(jsonPayload);
    var signature = JSONWebAlgorithms.sign('RS256', new Buffer(signatureInput), new Buffer(this.privateKeyPEM));
    // var compactSerialization = base64Url.encode( jsonProtectedHeader ) + '.' +
    //   base64Url.encode( jsonPayload ) + '.' +
    //   base64Url.encode( signature )
    return {
        payload: base64_encode(jsonPayload),
        protected: base64_encode(jsonProtectedHeader),
        header: publicHeader,
        signature: base64_encode(signature),
    };
}
function base64_encode(data) {
    if (data instanceof Buffer) {
        return data.toString("base64");
    }
    if (typeof (data) == "string") {
        return new Buffer(data).toString("base64");
    }
}
