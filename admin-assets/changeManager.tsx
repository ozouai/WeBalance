import axios from 'axios';

class _ArrayKey {

}
class _NullKey {

}
const ArrayKey = new _ArrayKey();
const NullKey = new _NullKey();
export class ChangeManager {
    public static Calculators: Array<typeof ChangeCalculator> = [];
    private originalTree: {};
    public tree;
    public host: string;
    public certLookup: {
        [key: string]: string
    } = {};
    private calculators: {
        [key: string]: ChangeCalculator
    } = {};
    constructor() {
        for(let c of ChangeManager.Calculators) {
            let i = new (c as any)(this);
            this.calculators[i.key] = i;
        }
    }
    public setTree(host: string, tree: any) {
        this.host = host;
        this.originalTree = JSON.parse(JSON.stringify((tree)));
        this.tree = JSON.parse(JSON.stringify((tree)));
    }

    public recalculate() {
        (window as any).setHeaderState({
            changes: this.calculateHumanChanges()
        });
        (window as any).setEndpointState({
            data: this.tree
        });
    }

    public calculateHumanChanges() : Array<HumanChangeResult> {
        let results = [];
        let keys = Object.keys(this.originalTree);
        for(let key of Object.keys(this.tree)) {
            if(keys.indexOf(key) === -1) keys.push(key);
        }
        for(let key of keys) {
            if(this.calculators[key]) {
                results = results.concat(this.calculators[key].calculateHumanChange(this.originalTree[key], this.tree[key]));
            }
        }
        return results;
    }

    public applyChanges(cb:(e:Array<string>)=>void) {
        let results : Array<ComputerChangeResult> = [];
        let keys = Object.keys(this.originalTree);
        for(let key of Object.keys(this.tree)) {
            if(keys.indexOf(key) === -1) keys.push(key);
        }
        for(let key of keys) {
            if(this.calculators[key]) {
                results = results.concat(this.calculators[key].calculateComputerChange(this.originalTree[key], this.tree[key]));
            }
        }

        let requests : {
            [key: string]: {
                [key: string]: {
                    [key: string] : any;
                }
            }
        } = {};
        for(let r of results) {
            if(!requests[r.endpoint]) requests[r.endpoint] = {};
            if(r.key instanceof _ArrayKey) {
                if (!requests[r.endpoint][r.type]) requests[r.endpoint][r.type] = [];
                requests[r.endpoint][r.type].push(r.value);
            } else if(typeof r.key == "string") {
                if (!requests[r.endpoint][r.type]) requests[r.endpoint][r.type] = {};
                requests[r.endpoint][r.type][r.key] = r.value;
            } else if(r.key instanceof _NullKey) {
                if (!requests[r.endpoint][r.type]) requests[r.endpoint][r.type] = {};
            }
        }
        for(let key of Object.keys(requests)) {
            let endpoint = `/api/endpoint/${this.host}`;
            if(key != "default") endpoint+="/"+key;
            for(let method of Object.keys(requests[key])) {
                switch(method) {
                    case "PATCH":
                        axios.patch(endpoint, requests[key][method],{headers:{"Authorization": "bearer "+ window.token}}).then((res)=>{
                            if(!res.data.error) {
                                if(!res.data.success) return cb(null);
                                else return cb(res.data.errors);
                            } else {
                                window.token.invalidate();
                            }
                        });
                        break;
                    case "DELETE":
                        axios.delete(endpoint, {headers:{"Authorization": "bearer "+ window.token}}).then((res)=>{
                            if(!res.data.error) {
                                if(!res.data.success) return cb(null);
                                else return cb(res.data.errors);
                            } else {
                                window.token.invalidate();
                            }
                        });
                        break;
                    case "PUT":
                        axios.put(endpoint, requests[key][method], {headers:{"Authorization": "bearer "+ window.token}}).then((res)=>{
                            if(!res.data.error) {
                                if(!res.data.success) return cb(null);
                                else return cb(res.data.errors);
                            } else {
                                window.token.invalidate();
                            }
                        });
                        break;
                    case "POST":
                        axios.post(endpoint, requests[key][method], {headers:{"Authorization": "bearer "+ window.token}}).then((res)=>{
                            if(!res.data.error) {
                                if (!res.data.success) return cb(null);
                                else return cb(res.data.errors);
                            } else {
                                window.token.invalidate();
                            }
                        });
                        break;
                }
            }
        }
        console.log(requests);
    }


}

export interface HumanChangeResult {
    text: string;
    undo: ()=>void;
}

export interface ComputerChangeResult {
    type: "PUT" | "POST" | "DELETE" | "PATCH"| string,
    endpoint: "default" | string;
    key: string | _ArrayKey | _NullKey,
    value: any
}

abstract class ChangeCalculator {
    public key: string;
    protected changeManager: ChangeManager;
    constructor(changeManager: ChangeManager) {
        this.changeManager = changeManager;
    }
    public abstract calculateHumanChange(original: any, modified: any) : Array<HumanChangeResult>;
    public abstract calculateComputerChange(original: any, modified: any) : Array<ComputerChangeResult>;
}

abstract class BooleanChangeCalculator extends ChangeCalculator{
    protected text_enabled: string = this.key+" Enabled";
    protected text_disabled: string = this.key+ " Disabled";
    calculateHumanChange(original: boolean, modified: boolean) : Array<HumanChangeResult> {
        if(original != modified) {
            if(modified) return [{text: this.text_enabled, undo:()=>{this.changeManager.tree[this.key] = original;this.changeManager.recalculate();}}];
            if(!modified) return [{text: this.text_disabled, undo:()=>{this.changeManager.tree[this.key] = original;this.changeManager.recalculate();}}];
        }
        return [];
    }
    calculateComputerChange(original: boolean, modified: boolean) {
        if(original != modified) {
            return [{key:this.key, value:modified, type: "PATCH", endpoint: "default"}];
        }
        return [];
    }
}

class TargetChangeCalculator extends ChangeCalculator{
    public key = "targets";
    calculateHumanChange(original:Array<string>, modified:Array<string>) {
        let results: Array<HumanChangeResult> = [];
        for(let m_target of modified) {
            if(original.indexOf(m_target) == -1) {
                results.push({
                    text: "Add Target '"+m_target+"'",
                    undo: ()=>{
                        this.changeManager.tree["targets"].splice(this.changeManager.tree["targets"].indexOf(m_target), 1);
                        this.changeManager.recalculate();
                    }
                });
            }
        }
        for(let o_target of original) {
            if(modified.indexOf(o_target) == -1) {
                results.push({
                    text: "Remove Target '"+o_target+"'",
                    undo: ()=>{
                        this.changeManager.tree["targets"].push(o_target);
                        this.changeManager.recalculate();
                    }
                });
            }
        }
        return results;
    }
    calculateComputerChange(original : Array<string>, modified:Array<string>) {
        let results = [];
        for(let m_target of modified) {
            if(original.indexOf(m_target) == -1) {
                results.push({key: ArrayKey, value: m_target, type:"PATCH", endpoint:"targets"})
            }
        }
        for(let o_target of original) {
            if(modified.indexOf(o_target) == -1) {
                results.push({key: ArrayKey, value: o_target, type:"POST", endpoint:`targets/delete`})
            }
        }
        return results;
    }
}

class HTTPChangeCalculator extends BooleanChangeCalculator {
    key = "http";
    text_enabled = "HTTP Endpoint Enabled";
    text_disabled = "HTTP Endpoint Disabled";
}

class HTTPSChangeCalculator extends BooleanChangeCalculator {
    key = "https";
    text_enabled = "HTTPS Endpoint Enabled";
    text_disabled = "HTTPS Endpoint Disabled";
}
class SelfSignedChangeCalculator extends BooleanChangeCalculator {
    key = "allowSelfSigned";
    text_enabled = "Self Signed Certificates Enabled";
    text_disabled = "Self Signed Certificated Disabled";
}
class SSLChangeCalculator extends ChangeCalculator {
    key = "sslCert";
    calculateHumanChange(original: string, modified: string) {
        if(modified == original) return [];
        if(modified == "letsEncrypt") return [{text:"Request Let's Encrypt Certificate", undo:()=>{this.changeManager.tree[this.key] = original;this.changeManager.recalculate();}}];
        else if(modified == "default") return [{text:"Use Self-Signed Certificate", undo:()=>{this.changeManager.tree[this.key] = original;this.changeManager.recalculate();}}];
        else return [{text:`Use Certificate '${this.changeManager.certLookup[modified]}'`, undo:()=>{this.changeManager.tree[this.key] = original;this.changeManager.recalculate();}}];
    }
    calculateComputerChange(original: string, modified: string) {
        if(modified == original) return [];
        return [{key: "sslCert", value: modified, type:"PATCH", endpoint:"default"}];
    }
}
class FriendlyNameChangeCalculator extends ChangeCalculator {
    key = "friendlyName";
    calculateHumanChange(original: string, modified: string) {
        if(modified == original) return [];
        return [{text: `Set Friendly Name to '${modified}'`, undo:()=>{this.changeManager.tree[this.key] = original;this.changeManager.recalculate();}}]
    }
    calculateComputerChange(original: string, modified: string){
        if(modified == original) return [];
        return [{key: "friendlyName", value:modified, type:"PATCH", endpoint:"default"}];
    }
}

ChangeManager.Calculators.push(TargetChangeCalculator);
ChangeManager.Calculators.push(HTTPChangeCalculator);
ChangeManager.Calculators.push(HTTPSChangeCalculator);
ChangeManager.Calculators.push(SelfSignedChangeCalculator);
ChangeManager.Calculators.push(SSLChangeCalculator);
ChangeManager.Calculators.push(FriendlyNameChangeCalculator);

class Token {
    private token: string;
    private tokenName: string;
    constructor(name: string) {
        this.tokenName = name;
        this.token = localStorage.getItem("token_"+this.tokenName);
    }
    public toString() {
        return this.token;
    }

    public setToken(token: string) {
        this.token = token;
        localStorage.setItem("token_"+this.tokenName, this.token);
    }

    public invalidate() {
        this.token = "";
        window.location.href ="/signin";
    }
    public hasToken(): boolean {
        if(!this.token) return false;
        return this.token.length > 0;
    }
}

declare global {
    interface Window {ChangeManager: typeof ChangeManager, changeManager: ChangeManager, token:Token, Token: typeof Token}
}
window.token = new Token("main");
window.Token = Token;
window["ChangeManager"] = ChangeManager;
window["changeManager"] = new ChangeManager();