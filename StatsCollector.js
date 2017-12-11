"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
Type of Stats
20x responses
30x responses
40x responses
50x responses



 */
var onSetFinished;
function setFinished(cb) {
    onSetFinished = cb;
}
exports.setFinished = setFinished;
var Codes;
(function (Codes) {
    Codes[Codes["S20X"] = 0] = "S20X";
    Codes[Codes["S30X"] = 1] = "S30X";
    Codes[Codes["S40X"] = 2] = "S40X";
    Codes[Codes["S50X"] = 3] = "S50X";
})(Codes || (Codes = {}));
var LinkedStorage = (function () {
    function LinkedStorage() {
    }
    return LinkedStorage;
}());
var GranularStorage = (function () {
    function GranularStorage(duration, length) {
        this.storageDuration = duration;
        this.storageLength = length;
        this.current = new LinkedStorage();
    }
    GranularStorage.prototype.get = function () {
        return this.current.storage;
    };
    GranularStorage.prototype.increment = function () {
        if (this.onIncrement) {
            this.onIncrement(this.current.storage);
        }
        var n = new LinkedStorage();
        if (this.onCreate) {
            n.storage = this.onCreate();
        }
        n.prev = this.current;
        this.current.next = n;
        this.current = n;
        var step = 0;
        var i = this.current;
        while (i.prev && step < this.storageLength) {
            i = i.prev;
            step++;
        }
        if (i.prev) {
            i.prev = null;
        }
    };
    GranularStorage.prototype.init = function () {
        var _this = this;
        this.current.storage = this.onCreate();
        this.incrementer = setInterval(function () {
            _this.increment();
        }, this.storageDuration * 1000);
    };
    return GranularStorage;
}());
var Collector = (function () {
    function Collector() {
        this.storages = [];
        this.addGranulanity(15, 8);
    }
    Collector.prototype.addGranulanity = function (duration, length) {
        var g = new GranularStorage(duration, length);
        this.storages.push(g);
        g.onIncrement = function (storage) {
            for (var _i = 0, _a = storage.frames; _i < _a.length; _i++) {
                var f = _a[_i];
                f.compute();
            }
            if (onSetFinished) {
                onSetFinished({ timeFrame: duration, storage: storage });
            }
        };
        g.onCreate = function () {
            return {
                map: {},
                frames: []
            };
        };
        g.init();
    };
    Collector.prototype.profile = function (message) {
        if (message.profiler) {
            for (var _i = 0, _a = this.storages; _i < _a.length; _i++) {
                var storage = _a[_i];
                if (!storage.get().map[message.profiler.host]) {
                    var g_1 = new Frame();
                    storage.get().map[message.profiler.host] = {
                        "global": g_1
                    };
                    storage.get().frames.push(g_1);
                }
                if (!storage.get().map[message.profiler.host][message.profiler.target]) {
                    var f_1 = new Frame();
                    storage.get().map[message.profiler.host][message.profiler.target] = f_1;
                    storage.get().frames.push(f_1);
                }
                var g = storage.get().map[message.profiler.host]["global"];
                var f = storage.get().map[message.profiler.host][message.profiler.target];
                f.count++;
                g.count++;
                f.rawProxyTime += hrTime(message.profiler.proxyEnd);
                f.rawTotalTime += hrTime(message.profiler.end);
                g.rawProxyTime += hrTime(message.profiler.proxyEnd);
                g.rawTotalTime += hrTime(message.profiler.end);
                if (message.profiler.responseCode >= 200 && message.profiler.responseCode < 300) {
                    f.s20x++;
                    g.s20x++;
                }
                else if (message.profiler.responseCode >= 300 && message.profiler.responseCode < 400) {
                    f.s30x++;
                    g.s30x++;
                }
                else if (message.profiler.responseCode >= 400 && message.profiler.responseCode < 500) {
                    f.s40x++;
                    g.s40x++;
                }
                else if (message.profiler.responseCode >= 500 && message.profiler.responseCode < 600) {
                    f.s50x++;
                    g.s50x++;
                }
            }
        }
    };
    return Collector;
}());
exports.Collector = Collector;
function hrTime(time) {
    return ((+time[0]) * 1e9) + (+time[1]);
}
var Frame = (function () {
    function Frame() {
        this.s20x = 0;
        this.s30x = 0;
        this.s40x = 0;
        this.s50x = 0;
        this.rawTotalTime = 0;
        this.rawProxyTime = 0;
        this.count = 0;
        this.totalTime = 0;
        this.proxyTime = 0;
    }
    Frame.prototype.compute = function () {
        this.totalTime = this.rawTotalTime / this.count;
        this.proxyTime = this.rawProxyTime / this.count;
    };
    Frame.prototype.toJSON = function () {
        return {
            s20x: this.s20x,
            s30x: this.s30x,
            s40x: this.s40x,
            s50x: this.s50x,
            count: this.count,
            totalTime: this.totalTime,
            proxyTime: this.proxyTime,
        };
    };
    return Frame;
}());
exports.Frame = Frame;
var defaultCollector = new Collector();
function profile(message) {
    defaultCollector.profile(message);
}
exports.profile = profile;
