export default class XRSLanguage {
    constructor(data) {
        if (!data) return;

        this.code = data.code; // string
    }

    toString() {
        return JSON.stringify(this, null, 4);
    }
}