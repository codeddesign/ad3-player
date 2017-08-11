import device from '../utils/device';
import { referrer } from '../utils/uri';
import random from '../utils/random';
import { proportion_minimal } from '../utils/proportion';

class Macro {
    constructor(player) {
        this.__player = player;
    }

    /**
     * @param {String} _uri
     * @param {Object} extra
     *
     * @return {String}
     */
    uri(_uri, extra = {}) {
        // random number on each call
        const _random = random();

        const size = proportion_minimal(this.__player.size);

        // add extra macros to main ones
        const macros = Object.assign({
            media_id: 'ad3media',

            user_agent: device.agent,
            referrer_root: referrer.base,
            referrer_url: referrer.simple,

            width: Math.round(size.width),
            height: Math.round(size.height),

            campaign_id: this.__player.campaign.id(),
            ip_address: this.__player.campaign.ip(),
            w: this.__player.campaign.websiteId(),

            timestamp: _random,
            cachebuster: _random,
            cache_buster: _random,
            cachebreaker: _random,
            cache_breaker: _random
        }, extra);

        // replace
        Object.keys(macros).forEach((key) => {
            _uri = _uri.replace(
                new RegExp(`\\[${key}\\]`, 'gi'),
                (macros[key])
            );
        });

        return _uri;
    }
}

export default Macro;
