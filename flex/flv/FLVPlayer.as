package {
    import flash.display.Sprite;
    import flash.net.NetConnection;
    import flash.net.NetStream;
    import flash.media.Video;

    // @me
    import flash.external.ExternalInterface;
    import flash.display.StageScaleMode;
    import flash.media.SoundTransform;

    import flash.utils.Timer;
    import flash.events.TimerEvent;

    import flash.display.LoaderInfo;

    import flash.system.Security;

    import flash.events.NetStatusEvent;

    import flash.display.MovieClip;
    import flash.events.MouseEvent;

    [SWF(backgroundColor="0xec9900" , width="640" , height="360")]
    public class FLVPlayer extends Sprite {
        private var nc:NetConnection;
        private var ns:NetStream;
        private var vid:Video;
        private var client:Object;
        private var nsVol:SoundTransform;
        private var mtDt:Object;
        private var jsHandler:String;
        private var clickThrough:String;
        private var stopped:Boolean = false;
        private var paused:Boolean = false;
        private var volume:Number = 0;

        public function FLVPlayer () {
            var paramObj:Object = LoaderInfo(this.root.loaderInfo).parameters;
            jsHandler = paramObj.handler;
            clickThrough = paramObj.target;

            Security.allowDomain("*");
            Security.allowInsecureDomain("*");

            stage.scaleMode = StageScaleMode.NO_BORDER;

            setNetConnection();

            setNetStream();

            setVideo();

            addMethods();
        }

        private function setNetConnection():void {
            nc = new NetConnection();
            nc.connect (null); // Not using a media server.
        }

        private function setNetStream():void {
            ns = new NetStream(nc);

            // Error management
            ns.addEventListener(NetStatusEvent.NET_STATUS, onFailure);

            // Client metadata callback
            client = new Object();
            client.onMetaData = onMetaData;

            ns.client = client;

            // Audio control
            nsVol = new SoundTransform(volume);

            ns.soundTransform = nsVol;
        }

        private function closeNetStream():void {
            ns.close();
            removeChild(vid);
            vid.attachNetStream(null);
        }

        private function onFailure(ev:NetStatusEvent):void {
            if(ev.info.level == 'error') {
                closeNetStream();

                callInterface('event', 'error', 403);

                return;
            }

            // ExternalInterface.call('console.log', ev.info);
        }

        private function setVideo():void {
            vid = new Video(stage.stageWidth, stage.stageHeight);

            vid.x = 0;
            vid.y = 0;

            var mc:MovieClip = new MovieClip();
            mc.addChild(vid);
            mc.buttonMode = true;

            mc.addEventListener(MouseEvent.CLICK, function():void {
              ExternalInterface.call('open', clickThrough, '_blank');

              callInterface('event', 'clickthrough');
            });

            addChild(mc);

            vid.attachNetStream(ns);
        }

        private function adjustVideoHeight():void {
            var height:Number = mtDt.width * stage.stageHeight / stage.stageWidth;

            vid.width = stage.stageWidth;
            vid.height = height;

            if(height != 0) {
                vid.y = (stage.stageHeight - height) / 2;
            }
        }

        private function callInterface(typeName:String, typeId:String, data:*=null):void {
            ExternalInterface.call(jsHandler, typeName, typeId, data);
        }

        private function checkProgress():void {
            var timer:Timer = new Timer(500, 1);

            function timeUpdate():void {
                callInterface('event', 'timeupdate', ns.time);

                if(!stopped && ns.time < mtDt.duration) {
                    checkProgress();
                } else  {
                    stopped = true;

                    callInterface('event', 'videocomplete');
                    callInterface('event', 'stopped');
                }
            }

            timer.addEventListener(TimerEvent.TIMER, timeUpdate);
            timer.start();
        }

        //MetaData
        private function onMetaData(_data:Object):void {
            mtDt = _data;

            callInterface('event', 'loaded', {
                'seekable': _data.canSeekToEnd,
                'codec': _data.videocodecid,
                'framerate': _data.framerate,
                'datarate': _data.videodatarate,
                'height': _data.height,
                'width': _data.width,
                'duration': _data.duration
            });

            // adjustVideoHeight();
        }

        private function addMethods():void {
            ExternalInterface.addCallback('loadUnit', function (data:Object):void {
                loadUnit(data);
            });

            ExternalInterface.addCallback('start', function ():void {
                ns.resume();

                callInterface('event', 'started');
                callInterface('event', 'videostart');

                checkProgress();
            });

            ExternalInterface.addCallback('stop', function ():void {
                ns.pause();

                stopped = true;

                callInterface('event', 'videocomplete');
                callInterface('event', 'stopped');
            });

            ExternalInterface.addCallback('pause', function():void {
                ns.pause();

                if(!paused) {
                    paused = true;

                    callInterface('event', 'paused');
                }
            });

            ExternalInterface.addCallback('resume', function():void {
                ns.resume();

                if(paused) {
                    paused = false;

                    callInterface('event', 'playing');
                }
            });

            ExternalInterface.addCallback('skip', function():void {
                ns.pause();

                stopped = true;

                callInterface('event', 'skipped');
                callInterface('event', 'stopped');
            });

            ExternalInterface.addCallback('setVolume', function(_volume:Number):void {
                nsVol = new SoundTransform(_volume);

                ns.soundTransform = nsVol;

                callInterface('event', 'volumechange', _volume);
            });

            //
            callInterface('method', 'handShake');
        }

        private function loadUnit(data:Object):void {
            ns.play(data.src);
            ns.pause();
        }
    }
}
