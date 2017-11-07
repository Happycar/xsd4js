import XRSstation from './XRSstation';

export default class XRSstationList {
    constructor(data) {
        if (!data) return;

        this.station = data.station.map(function(value){ return new XRSstation(data.value); }); // array
    }

    toString() {
        return JSON.stringify(this, null, 4);
    }
}