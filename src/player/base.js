import $ from '../utils/element';
import { request_campaign } from './request';

window.postMessage('player-exists', location.href);

$('body').sub('player-init', (event) => {
    const source = event.detail;

    if (source.initiated) {
        return false;
    }

    source.initiated = true;

    source.script = $(source.script);

    request_campaign(source);
});
