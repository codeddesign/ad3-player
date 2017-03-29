import Player from './player';
import vastLoadXML from '../vast/base';
import ajax from '../utils/ajax';
import device from '../utils/device';
import random from '../utils/random';
import { decode_uri, referrer } from '../utils/uri';
import config from '../../config';

/**
 * Makes a request to campaign uri.
 *
 * @param {Source} source
 */
export const request_campaign = (source) => {
    const uri = `${config.app_path}/campaign/${source.id}?_rd=${random()}&platform=${device.mobile() ? 'mobile' : 'desktop'}&referrer=${referrer.base}`;

    ajax().campaign(uri)
        .then((response) => {
            new Player(response.text, source);

            // @todo: add tracking
        })
        .catch((e) => {
            console.error(e);

            // @todo: add tracking
        });
};

/**
 * Makes a request to tag uri.
 *
 * @param {String} uri
 * @param {Object} config
 * @param {Boolean|Vast} mainVast
 * @param {Boolean|Integer} wrapperIndex
 *
 * @return Promise}
 */
export const request_tag = (uri, config = {}, mainVast = false, wrapperIndex = false) => {
    uri = decode_uri(uri);

    return new Promise((resolve, reject) => {
        ajax().tag(uri)
            .then((response) => {
                if (wrapperIndex === false) {
                    // @todo: add tracking
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
                                request_tag(wrapper.adTagUri(), config, mainVast, index)
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

                    // @todo: add tracking
                }

                resolve(mainVast);
            });
    });
};
