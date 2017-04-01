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
    },

    // Campaign setup
    campaigns: [{
        ad_type_id: 1, // ad type id
        with_sound: false, // starts with sound
        by_user: false, // requires start by user
        name: 'onscroll' // Important: unchangeable name
    }, {
        ad_type_id: 2,
        with_sound: false,
        by_user: false,
        name: 'infinity'
    }, {
        ad_type_id: 3,
        with_sound: true,
        by_user: true,
        name: 'preroll'
    }],

    /**
     * Request one tag only if a '?_tid=X' exists in site's query,
     * where X is the tag id.
     *
     * If false, the _tid is being ignored.
     */
    single_tag_testing: false,

    // If false, tags that triggered 'loaded' won't be added to storage
    caching: false,

    // Onscroll workflow config
    onscroll: {
        desktop: 'aside', // 'basic', 'aside'
        mobile: 'basic' // 'basic', 'aside'
    }
};
