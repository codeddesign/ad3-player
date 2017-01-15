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
}

export default Player;
