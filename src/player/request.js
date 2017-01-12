import Player from './player';
import ajax from '../utils/ajax';
import random from '../utils/random';
import config from '../../config';

/**
 * Makes a request to campaign uri.
 *
 * @param {Source} source
 */
export const request_campaign = (source) => {
    const uri = `${config.app_path}/campaign/${source.id}?_rd=${random()}`;

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
