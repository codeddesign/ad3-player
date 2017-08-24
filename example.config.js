export default {
    app_path: 'http://a3m.dev',

    app_tracking: 'http://example.com',

    // VPAIDFlash: create it in a friendy iframe
    vpaidflash_fif: true,

    // Timeouts in seconds
    timeout: {
        ajax: 3.0,
        started: 5.0,
        visit_minimum: 15.0
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
    caching: {
        enabled: false,
        vpaid: false,
        expires: 12, // number of hours
    },

    // Onscroll workflow config
    onscroll: {
        desktop: {
            mode: 'aside', // 'basic', 'aside'
            inview: true // if false it will ignore in view conditions
        },
        mobile: {
            mode: 'basic', // 'basic', 'aside'
            inview: true
        }
    },

    // Changes behaviour
    production: true,

    /*
     * List of events that need to be ignored by tracker by name.
     *
     * Note:You can see a full list of names in src/player/tracker/event_list
     */
    tracking_ignore_events: [
        'error'
    ],

    // Dump tag information
    dump: {
        uri: 'http://a3m.dev/dump/',
        enabled: false,
        tags: []
    },

    // key is being used by rollup.config.js and replaces '_CSS_CDN_' in style.css
    css_cdn: 'http://cdn.a3m.io',

    // Default proportion for tag request
    proportion: 9 / 16,

    // Custom limits
    limit: {
        max_requests: 5
    },

    // Prebidjs configuration
    prebidjs: {
        assets: [{
            name: 'pbjs',
            tag: 'script',
            attributes: {
                src: `http://a3m.dev/prebid.js`,
                async: 'true'
            }
        }],

        // all supported sizes when provider has no specific one/s
        default_sizes: [
            '300x250',
            '336x280'
        ],

        // timeouts in seconds
        timeout: {
            desktop: 2,
            mobile: 2
        },

        // expires
        cache_expiration: 12 // number of hours
    }
};
