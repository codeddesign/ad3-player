#!/bin/sh

cd $(dirname $0)

if [ "$1" = "install" ]; then
    if [ -f flex_sdk/bin/mxmlc ]; then
        echo 'already installed... skipping...'
    else
        mkdir flex_sdk

        curl -o './flex_sdk/sdk.zip' 'http://download.macromedia.com/pub/flex/sdk/flex_sdk_4.6.zip'
        unzip './flex_sdk/sdk.zip' -d './flex_sdk'

        rm './flex_sdk/sdk.zip'

        chmod -R 755 './flex_sdk'

        # replace line for x32
        sed -i .previous "s/D32='-d32'/echo '-d3 was replaced..'/g" ./flex_sdk/bin/mxmlc;

        # get players
        # git clone git://github.com/nexussays/playerglobal.git ./flex_sdk/frameworks/libs/player

        echo 'installation complete...'
    fi

    exit
fi

if [ "$1" = "flv" ]; then
    ./flex_sdk/bin/mxmlc -output ../dist/assets/swf/flv.swf   ../flex/flv/FLVPlayer.as    -compiler.source-path ../flex/flv/   -target-player '11.1'

    exit
fi
