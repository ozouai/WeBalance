import {IncomingMessage as IncomingMessage1} from "http";
export interface IncomingMessage extends IncomingMessage1{
    profiler?: {
        host?: string,
        target?: string,
        start?: [number, number],
        end?: [number, number]
        proxyStart?: [number, number],
        proxyEnd?: [number, number],
        responseCode?: number
    }
}
/*
Type of Stats
20x responses
30x responses
40x responses
50x responses



 */
enum Codes {
    S20X,
    S30X,
    S40X,
    S50X
}

class LinkedStorage<StorageType> {
    next: LinkedStorage<StorageType>;
    prev: LinkedStorage<StorageType>;
    storage: StorageType;
}

class GranularStorage<StorageType> {
    private storageDuration: number;
    private storageLength: number;
    private incrementer: NodeJS.Timer;
    private current: LinkedStorage<StorageType>;
    constructor(duration: number, length: number) {
        this.storageDuration = duration;
        this.storageLength = length;

        this.current = new LinkedStorage<StorageType>();
    }

    public get(): StorageType {
        return this.current.storage;
    }
    private increment() {
        if(this.onIncrement) {
            this.onIncrement(this.current.storage);
        }
        let n = new LinkedStorage<StorageType>();
        if(this.onCreate) {
            n.storage = this.onCreate();
        }
        n.prev = this.current;
        this.current.next = n;
        this.current = n;
    }
    public init() {
        this.current.storage = this.onCreate();
        this.incrementer = setInterval(()=>{
            this.increment()
        }, this.storageDuration*1000);
    }
    public onIncrement: (storage: StorageType)=>void;
    public onCreate:()=>StorageType;
}


interface Storage {
    map: {
        [key: string]: {
            [key: string]: Frame,
            "global": Frame
        }
    }
    frames: Array<Frame>
}

export class Collector {
    private storages: Array<GranularStorage<Storage>> = [];
    public addGranulanity(duration: number, length: number) {
        let g = new GranularStorage<Storage>(duration, length)
        this.storages.push(g);
        g.onIncrement = (storage)=>{
            for(let f of storage.frames) {
                f.compute();
            }
            console.log(storage);
        }
        g.onCreate = ()=>{
            return {
                map: {},
                frames: []
            }
        }
        g.init();
    }
    constructor() {
        this.addGranulanity(15, 8);
    }
    public profile(message: IncomingMessage) {
        if(message.profiler) {
            for(let storage of this.storages) {
                if (!storage.get().map[message.profiler.host]) {
                    let g = new Frame();
                    storage.get().map[message.profiler.host] = {
                        "global": g
                    }
                    storage.get().frames.push(g);
                }
                if (!storage.get().map[message.profiler.host][message.profiler.target]) {
                    let f = new Frame();
                    storage.get().map[message.profiler.host][message.profiler.target] = f;
                    storage.get().frames.push(f);
                }
                let g = storage.get().map[message.profiler.host]["global"];
                let f = storage.get().map[message.profiler.host][message.profiler.target];
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
    }
}

function hrTime(time: [number, number]) {
    return ((+time[0]) * 1e9) + (+time[1]);
}

export class Frame {
    s20x: number = 0;
    s30x: number = 0;
    s40x: number = 0;
    s50x: number = 0;
    rawTotalTime: number = 0;
    rawProxyTime: number = 0;
    count: number = 0;
    totalTime: number = 0;
    proxyTime: number =0;

    public compute() {
        this.totalTime = this.rawTotalTime/this.count;
        this.proxyTime = this.rawProxyTime/this.count;
    }
    public toJSON() {
        return {
            s20x: this.s20x,
            s30x: this.s30x,
            s40x: this.s40x,
            s50x: this.s50x,
            count: this.count,
            totalTime: this.totalTime,
            proxyTime: this.proxyTime,
        }
    }
}

let defaultCollector = new Collector();
export function profile(message: IncomingMessage) {
    defaultCollector.profile(message);
}
