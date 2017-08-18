import '../../dist/assets/css/style.css';
import Player from './player';
import { request_campaign } from './request';
import $ from '../utils/element';
import source from '../utils/source';
import config from '../../config';

if (!source.initiated) {
    // Mark as initiated
    source.initiated = true;

    // Add Element's features
    source.script = $(source.script);

    // First campaign id
    source.id = source.script.attr('ids').split(',')[0];

    request_campaign(source.id)
        .then((response) => {
            const __player = new Player(response.text, source);

            setTimeout(() => {
                __player.tracker.visit();
            }, config.timeout.visit_minimum * 1000);

            __player.tracker.campaign(response.status);
        })
        .catch((e) => {
            console.error(e);

            // @todo: add tracking
        });
}
