import Collection from '../collection/collection';
import createAd from './ad';

export class Ads extends Collection {
    constructor(ads) {
        super(ads, createAd);
    }
}

export default (ads) => {
    return new Ads(ads);
};
