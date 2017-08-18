import vastLoadXML from '../vast/base';
import ajax from '../utils/ajax';
import device from '../utils/device';
import random from '../utils/random';
import { decode_uri, referrer } from '../utils/uri';
import config from '../../config';

/**
 * Makes a request to campaign uri.
 *
 * @param {Integer|string} campaign_id
 */
export const request_campaign = (campaign_id) => {
    let uri = `${config.app_path}/campaign/${campaign_id}?_rd=${random()}&platform=${device.mobile() ? 'mobile' : 'desktop'}&referrer=${referrer.base}`;

    if (config.single_tag_testing && referrer.data._tid) {
        uri += `&test=${referrer.data._tid}`;
    }

    return new Promise((resolve, reject) => {
        ajax().campaign(uri)
            .then((response) => {
                resolve(response);
            })
            .catch((e) => {
                reject(e);
            });
    });
};

/**
 * Makes a request to tag uri.
 *
 * @param {Player} __player
 * @param {String} uri
 * @param {Object} config
 * @param {Boolean|Vast} mainVast
 * @param {Boolean|Integer} wrapperIndex
 *
 * @return Promise}
 */

export const request_tag = (__player, uri, config = {}, mainVast = false, wrapperIndex = false) => {
    uri = __player.macro.uri(decode_uri(uri));

    return new Promise((resolve, reject) => {
        ajax().tag(uri)
            .then((response) => {
                if (wrapperIndex === false) {
                    __player.tracker.tag(response.status, config.id());
                }

                const vast = vastLoadXML(response.text),
                    wrappers = vast.ads().withType('wrapper'),
                    promises = [];

                // backup main vast
                if (!mainVast) {
                    mainVast = vast;
                }

                // save wrapper's index
                if (wrapperIndex !== false) {
                    vast.$index = wrapperIndex;
                }

                // has wrappers
                if (wrappers.length) {
                    wrappers.forEach((wrapper, index) => {
                        if (wrapperIndex !== false) {
                            index = wrapperIndex;
                        }

                        const mainWrapper = mainVast.ads().byIndex(index);

                        if (wrapper.followAdditionalWrappers() &&
                            !mainWrapper.reachedRedirectsLimit(config.wrapperLimit())
                        ) {
                            mainWrapper.addRedirect();

                            promises.push(
                                request_tag(__player, wrapper.adTagUri(), config, mainVast, index)
                            );
                        }
                    });

                    Promise.all(promises)
                        .then((finished) => {
                            if (finished instanceof Array) {
                                finished = finished[0];
                            }

                            resolve(finished);
                        })
                        .catch((e) => {
                            reject(e);
                        });

                    return false;
                }

                // finished
                if (typeof vast.$index !== 'undefined') {
                    const $index = vast.$index;

                    let mainWrapper = false;
                    vast.ads().forEach((ad, index) => {
                        if (!mainWrapper) {
                            mainWrapper = mainVast.ads().byIndex($index);
                        }

                        ad.extendWithWrapper(mainWrapper);

                        if (index == 0) {
                            mainVast.ads().replaceByIndex($index, ad);

                            return false;
                        }

                        if (mainWrapper.allowMultipleAds()) {
                            mainVast.ads().add(ad);
                        }
                    });
                }

                resolve(mainVast);
            })
            .catch((e) => {
                if (wrapperIndex === false) {
                    console.error(e);

                    __player.tracker.tag(e.code, config.id());
                }

                resolve(mainVast);
            });
    });
};
