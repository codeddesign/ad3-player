import { assets } from '../../config';
import { Asset, Element } from './helpers';
import initSource from '../utils/source';
import { referrer } from '../utils/uri';

window.addEventListener('message', (ev) => {
    if (ev.origin != referrer.base) return false;

    if (ev.data == 'player-exists') {
        (new Element('body')).pub('player-init', initSource);
    }
});

const promises = [];
assets.forEach((asset) => {
    const load_promise = (new Asset(asset)).load();
    if (asset.must_wait) {
        promises.push(
            load_promise
        )
    }
});

Promise.all(promises)
    .then((names) => {
        (new Element('body')).pub('player-init', initSource);
    })
    .catch((e) => {
        console.error('assets', e);
    });
