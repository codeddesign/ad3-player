import Collection from '../collection/collection';
import createCreative from './creative';

export class Creatives extends Collection {
    constructor(creatives) {
        super(creatives, createCreative);
    }
}

export default (creatives) => {
    return new Creatives(creatives);
};
