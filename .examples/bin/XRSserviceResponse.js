import XRSbrand from './XRSbrand';
import XRSserviceContext from './XRSserviceContext';
import XRSstationList from './XRSstationList';

export default class XRSserviceResponse {
    constructor(data) {
        if (!data) return;

        this.brand = data.brand ? new XRSbrand(data.brand) : null;
        this.returnCode = data.returnCode; // enum XRSreturnCode
        this.serviceContext = data.serviceContext ? new XRSserviceContext(data.serviceContext) : null;
        this.stationList = data.stationList ? new XRSstationList(data.stationList) : null;
    }

    toString() {
        return JSON.stringify(this, null, 4);
    }
}