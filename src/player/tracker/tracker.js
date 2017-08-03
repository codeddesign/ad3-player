import eventsList from './events_list';
import { referrer, object_to_query } from '../../utils/uri';
import device from '../../utils/device';
import random from '../../utils/random';
import { randomString } from '../../utils/random';
import { decode_uri } from '../../utils/uri';
import config from '../../../config';

/**
 * Name of the window variable that determines
 * if visit event was called.
 *
 * @type {string}
 */
const VISIT_KEY_NAME = '__a3m_visit';

/**
 * Name of the window variable that holds
 * an unique identifier for visit
 *
 * @type {string}
 */
const VISIT_UNIQUE_ID = '__a3m__vuid';

class Tracker {
    constructor(player) {
        this.__player = player;

        if (!window[VISIT_UNIQUE_ID]) {
            this.vuid = randomString();
        }
    }

    /**
     * Make 'image' request to given uri.
     *
     * @param {String} uri
     * @param {Object} macros
     *
     * @return {Tracker}
     */
    request(uri, macros = {}) {
        uri = this.__player.macro.uri(decode_uri(uri), macros);

        if (config.app_tracking) {
            const image = new Image;
            image.src = uri;
        } else {
            console.log(uri);
        }

        return this;
    }

    /**
     * App request.
     *
     * @param {Object} info
     * @param {Object} extra
     * @param {Boolean} addExtra
     *
     * @return {Tracker}
     */
    app(info = {}, extra = {}, addExtra = false) {
        if (!this.__player.campaign) {
            return this;
        }

        info = Object.assign({
            w: this.__player.campaign.websiteId(),
            campaign: this.__player.campaign.id(),
            referrer: referrer.simple,
            platform: device.mobile() ? 'mobile' : 'desktop',
            _rd: random(),
            vuid: this.vuid
        }, info);

        if (addExtra) {
            info = Object.assign(info, extra);
        }

        const uri = `${config.app_tracking || ''}/track?${object_to_query(info)}`;

        this.request(uri);

        console.info(`{${info.campaign}} tag:${info.tag || '~'} ${info.source}:${info.status || '~'} [${extra.statusName || '~'}]`);

        return this;
    }

    /**
     * @return {Tracker}
     */
    visit() {
        if (!window[VISIT_KEY_NAME]) {
            window[VISIT_KEY_NAME] = true;

            this.app({ source: 'visit', status: 'ok' });
        }

        return this;
    }

    /**
     * @return {Tracker}
     */
    backfill() {
        this.app({ source: 'backfill', backfill: this.__player.campaign.$backfill.id });

        return this;
    }

    /**
     * @param {Integer} evName
     *
     * @return {Tracker}
     */
    campaign(evName) {
        this.app({ source: 'campaign', status: evName });

        return this;
    }

    /**
     * @param {Integer} evName
     * @param {Boolean|Integer} tagId
     *
     * @return {Tracker}
     */
    tag(evName, tagId) {
        this.app({ source: 'tag', status: evName }, { tag: tagId }, true);
    }

    /**
     * @param {Slog} slot
     * @param {String} evName
     * @param {Mixed} evData
     *
     * @return {Tracker}
     */
    video(slot, evName, evData) {
        evName = this.__eventName(slot, evName);

        // check event existence
        const event = eventsList[evName];
        if (!event) {
            return false;
        }

        // ignore timeupdate
        if (event.code == 13) {
            return false;
        }

        let macros = {};
        let appExtraData = {
            statusName: evName
        };

        const uris = [];
        switch (event.source) {
            case 'ad':
                if (evName == 'impression') {
                    uris.push(
                        ...slot.ad().impression()
                    );
                }

                if (evName == 'error') {
                    event.code = evData;

                    uris.push(
                        ...slot.ad().error()
                    );

                    macros = {
                        'errorcode': evData,
                        'error_code': evData,
                        'error': evData
                    };
                }
                break;
            case 'creative':
                uris.push(
                    ...slot.creative().trackingEvent(evName)
                );
                break;
            case 'videoclicks':
                evName = 'clicktracking';

                uris.push(
                    ...slot.creative().videoClick(evName)
                );
                break;
        }

        uris.forEach((uri) => {
            this.request(uri, macros);
        });

        if (event.cacheCheck && slot.tag().vast()._fromCache) {
            if (!slot.media().isVPAID()) return this;

            // don't track 'loaded' - again - for vpaid
            if (event.code == 1) return this;
        }

        let ignore_event = false;
        if (config.production) {
            ignore_event = config.tracking_ignore_events.some((name) => {
                return name.toLowerCase() == evName;
            });
        }

        if (!ignore_event) {
            this.app({ tag: slot.tag().id(), source: 'ad', status: event.code }, appExtraData);
        }

        return this;
    }

    /**
     * Clean up event name and use it's aliases - if any.
     *
     * @param {Slog} slot
     *
     * @param {String} name
     *
     * @return {String}
     */
    __eventName(slot, name) {
        name = name.replace('video', '').toLowerCase();

        const aliases = {
            clickthru: 'clickthrough',
            skipped: 'skip',
            playing: 'resume',
            paused: 'pause',
            volumechange: () => {
                return slot.video().volume() ? 'mute' : 'unmute';
            }
        };

        const alias = aliases[name];
        if (alias) {
            if (typeof alias == 'function') {
                name = alias();
            } else {
                name = alias;
            }
        }

        return name;
    }
}

export default Tracker;
