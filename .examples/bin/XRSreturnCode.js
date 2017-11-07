export default class XRSreturnCode {
    static KO = 'KO';
    static OK = 'OK';

    constructor() {
        throw Error('do not instantiate XRSreturnCode, ENUM class here');
    }

    toString() {
        return JSON.stringify(this, null, 4);
    }
}