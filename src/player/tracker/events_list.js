export default {
    'filled': {
        code: 0,
        source: false,
        cacheCheck: true // check event if Vast is from cache
    },
    'loaded': {
        code: 1,
        source: false,
        cacheCheck: true
    },
    'start': {
        code: 2,
        source: 'creative'
    },
    'impression': {
        code: 3,
        source: 'ad',
    },
    'error': {
        code: null, // replaced with vast error code
        source: 'ad'
    },
    'firstquartile': {
        code: 4,
        source: 'creative'
    },
    'midpoint': {
        code: 5,
        source: 'creative'
    },
    'thirdquartile': {
        code: 6,
        source: 'creative'
    },
    'complete': {
        code: 7,
        source: 'creative'
    },
    'skip': {
        code: 8,
        source: 'creative'
    },
    'pause': {
        code: 9,
        source: 'creative'
    },
    'resume': {
        code: 10,
        source: 'creative'
    },
    'mute': {
        code: 11,
        source: 'creative'
    },
    'unmute': {
        code: 12,
        source: 'creative'
    },
    'timeupdate': {
        code: 13,
        source: 'creative'
    },
    'clickthrough': {
        code: 14,
        source: 'videoclicks'
    }
};
