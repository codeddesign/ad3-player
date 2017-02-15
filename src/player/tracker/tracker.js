import $instance from '../instance';
import eventsList from './events_list';
import Macro from '../macro';
import { referrer, object_to_query } from '../../utils/uri';
import device from '../../utils/device';
import random from '../../utils/random';
import config from '../../../config';

/**
 * Name of the window variable that determines
 * if visit event was called.
 *
 * @type {string}
 */
const VISIT_KEY_NAME = '__a3m_visit';

class Tracker {
    /**
     * Make 'image' request to given uri.
     *
     * @param {String} uri
     * @param {Object} macros
     *
     * @return {Tracker}
     */
    static request(uri, macros = {}) {
        uri = Macro.uri(uri, macros);

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
    static app(info = {}, extra = {}, addExtra = false) {
        if (!$instance.campaign) {
            return this;
        }

        info = Object.assign({
            w: $instance.campaign.websiteId(),
            campaign: $instance.campaign.id(),
            referrer: referrer.simple,
            platform: device.mobile() ? 'mobile' : 'desktop',
            _rd: random()
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
    static visit() {
        if (!window[VISIT_KEY_NAME]) {
            window[VISIT_KEY_NAME] = true;

            this.app({ source: 'visit', status: 'ok' });
        }

        return this;
    }

    /**
     * @return {Tracker}
     */
    static backfill() {
        this.app({ source: 'backfill' });

        return this;
    }

    /**
     * @param {Integer} evName
     *
     * @return {Tracker}
     */
    static campaign(evName) {
        this.app({ source: 'campaign', status: evName });

        return this;
    }

    /**
     * @param {Integer} evName
     * @param {Boolean|Integer} tagId
     *
     * @return {Tracker}
     */
    static tag(evName, tagId) {
        this.app({ source: 'tag', status: evName }, { tag: tagId }, true);
    }

    /**
     * @param {Slog} slot
     * @param {String} evName
     * @param {Mixed} evData
     *
     * @return {Tracker}
     */
    static video(slot, evName, evData) {
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

        this.app({ tag: slot.tag().id(), source: 'ad', status: event.code }, appExtraData);

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
    static __eventName(slot, name) {
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
