import XRSLocalisation from './XRSLocalisation';

export default class XRSserviceContext {
    constructor(data) {
        if (!data) return;

        this.localisation = data.localisation ? new XRSLocalisation(data.localisation) : null;
    }

    toString() {
        return JSON.stringify(this, null, 4);
    }
}