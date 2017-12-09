declare namespace SharedInterfaces {
    export interface EndpointsWithStatus{endpoint: string, friendlyName: string, targetsAlive: number, targets: number, errors: Array<string>}
}