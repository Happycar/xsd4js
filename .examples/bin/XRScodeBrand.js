export default class XRScodeBrand {
    static AL = 'AL';
    static EP = 'EP';
    static KD = 'KD';
    static ZL = 'ZL';

    constructor() {
        throw Error('do not instantiate XRScodeBrand, ENUM class here');
    }

    toString() {
        return JSON.stringify(this, null, 4);
    }
}