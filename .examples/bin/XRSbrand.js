export default class XRSbrand {
    constructor(data) {
        if (!data) return;

        this.code = data.code; // enum XRScodeBrand
    }

    toString() {
        return JSON.stringify(this, null, 4);
    }
}