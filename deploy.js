"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require("request");
var fs = require("fs");
if (process.env.TRAVIS_BRANCH != "master") {
    console.log("Only run on master");
    process.exit(0);
}
var uploadFiles = {
    "build/proxy.zip": {
        name: "proxy.zip",
        contentType: "application/zip"
    },
    "build/webalance.deb": {
        name: "webalance.deb",
        contentType: "application/octet-stream"
    }
};
var packageJ = JSON.parse(fs.readFileSync("package.json", "UTF-8"));
request({
    url: "https://api.github.com/repos/ozouai/WeBalance/releases",
    method: "POST",
    auth: {
        pass: "x-oauth-basic",
        user: process.env.GITHUB_OAUTH_TOKEN
    },
    headers: {
        'User-Agent': 'Release-Agent',
        'Accept': 'application/vnd.github.v3+json',
    },
    json: {
        tag_name: packageJ.version,
        name: "Build Results - " + packageJ.version,
        body: "Upload results",
        draft: true
    }
}, function (err, response, body) {
    if (body.upload_url) {
        for (var _i = 0, _a = Object.keys(uploadFiles); _i < _a.length; _i++) {
            var file = _a[_i];
            if (fs.existsSync(file)) {
                var stats = fs.statSync(file);
                var options = {
                    url: body.upload_url.replace('{?name,label}', ''),
                    auth: {
                        pass: "x-oauth-basic",
                        user: process.env.GITHUB_OAUTH_TOKEN
                    },
                    json: true,
                    headers: {
                        'User-Agent': 'Release-Agent',
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': uploadFiles[file].contentType,
                        'Content-Length': stats.size
                    },
                    qs: {
                        name: uploadFiles[file].name
                    }
                };
                console.log(options);
                fs.createReadStream(file).pipe(request.post(options, function (err, res) {
                    console.log("File Uploaded");
                }));
            }
        }
    }
});
