import $instance from './instance';
import Campaign from './campaign/campaign';

class Player {
    constructor(campaign, source) {
        $instance.add({
            player: this,
            campaign: new Campaign(campaign)
        });

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
}

export default Player;
