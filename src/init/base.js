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
    promises.push(
        (new Asset(asset)).load()
    )
});

Promise.all(promises)
    .then((names) => {
        (new Element('body')).pub('player-init', initSource);
    })
    .catch((e) => {
        console.error('assets', e);
    });
