import $ from './utils/element';

window.postMessage('player-exists', location.href);

$('body').sub('player-init', (event) => {
    const source = event.detail;

    if (source.initiated) {
        return false;
    }

    source.initiated = true;

    source.script = $(source.script);

    console.log(source);
});
