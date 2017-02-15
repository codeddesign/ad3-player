export const assets = [{
    name: 'player',
    tag: 'script',
    attributes: {
        src: `http://a3m.dev/player.js`
    }
}, {
    name: 'styling',
    tag: 'link',
    attributes: {
        rel: 'stylesheet',
        href: `https://a3m.dev/style.css`
    }
}];

export default {
    app_path: 'http://a3m.dev',

    app_tracking: 'http://example.com',

    // VPAIDFlash: create it in a friendy iframe
    vpaidflash_fif: true,

    // Timeouts in seconds
    timeout: {
        started: 5.0
    }
};
