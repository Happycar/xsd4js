export default class XRSstation {
    constructor(data) {
        if (!data) return;

        this.stationCode = (data.stationCode && data.stationCode.match(/[A-Z][A-Z][A-Z][CDELNOPRSTW][0-9]{2}/g)) ? data.stationCode : null; // string XRSresStationID
        this.stationName = (data.stationName) ? data.stationName.substring(0, 35) : null; // string XRSadress
    }

    toString() {
        return JSON.stringify(this, null, 4);
    }
}