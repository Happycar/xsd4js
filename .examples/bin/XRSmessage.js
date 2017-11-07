import XRSserviceResponse from './XRSserviceResponse';

export default class XRSmessage {
    constructor(data) {
        if (!data) return;

        this.serviceResponse = data.serviceResponse ? new XRSserviceResponse(data.serviceResponse) : null;
        this.sessionID = data.sessionID; // string
    }

    toString() {
        return JSON.stringify(this, null, 4);
    }
}