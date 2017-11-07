import XRSLanguage from './XRSLanguage';

export default class XRSLocalisation {
    constructor(data) {
        if (!data) return;

        this.active = data.active; // boolean
        this.language = data.language ? new XRSLanguage(data.language) : null;
    }

    toString() {
        return JSON.stringify(this, null, 4);
    }
}