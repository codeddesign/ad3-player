import $instance from './instance';
import device from '../utils/device';
import { referrer } from '../utils/uri';
import random from '../utils/random';

class Macro {
    /**
     * @param {String} _uri
     * @param {Object} extra
     *
     * @return {String}
     */
    static uri(_uri, extra = {}) {
        // random number on each call
        const _random = random();

        // add extra macros to main ones
        const macros = Object.assign({
            media_id: 'ad3media',

            user_agent: device.agent,
            referrer_root: referrer.base,
            referrer_url: referrer.simple,

            width: Math.round($instance.size.width),
            height: Math.round($instance.size.height),

            campaign_id: $instance.campaign.id(),
            ip_address: $instance.campaign.ip(),
            w: $instance.campaign.websiteId(),

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
