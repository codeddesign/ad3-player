import $instance from './instance';
import Campaign from './campaign/campaign';
import View from './view/view';

class Player {
    constructor(campaign, source) {
        $instance.add({
            player: this,
            campaign: new Campaign(campaign),
            view: new View(source)
        });

        $instance.view.setup();

        $instance.campaign.requestTags()
            .then((tags) => {
                $instance.add({ tags });

                // console.log($instance);
            });
    }

    /**
     * Listener method.
     *
     * Gets called when a tag gets updated.
     *
     * @param {Tag} tag
     *
     * @return {Player}
     */
    tagListener(tag) {
        console.info(`Tag with id #${tag.id()} updated.`);

        return this;
    }

    /**
     * Listener method.
     *
     * @param {Slot} slot
     * @param {String} name
     * @param {Mixed} data
     *
     * @return {Player}
     */
    slotListener(slot, name, data) {
        if (!name.includes('timeupdate')) {
            console.log('event:', name, data);
        }
    }
}

export default Player;
