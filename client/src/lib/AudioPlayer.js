const {SimpleFilter, SoundTouch} = require('../vendor/soundtouch');
const BUFFER_SIZE = 4096;

//https://developer.mozilla.org/en-US/docs/Web/Guide/Audio_and_video_manipulation
class AudioPlayer {
    constructor({emitter, pitch, tempo}) {
        this.emitter = emitter;
        var AudioContext = window.AudioContext // Default
            || window.webkitAudioContext // Safari and old versions of Chrome
            || false; 

        this.context = new AudioContext();
        this.scriptProcessor = this.context.createScriptProcessor(BUFFER_SIZE, 2, 2);
        this.scriptProcessor.onaudioprocess = e => {
            const l = e.outputBuffer.getChannelData(0);
            const r = e.outputBuffer.getChannelData(1);
            if(this.simpleFilter!=null){
                const framesExtracted = this.simpleFilter.extract(this.samples, BUFFER_SIZE);
                if (framesExtracted === 0) {
                    this.emitter.emit('stop');
                }
                for (let i = 0; i < framesExtracted; i++) {
                    l[i] = this.samples[i * 2];
                    r[i] = this.samples[i * 2 + 1];
                }
            }
        };

        this.soundTouch = new SoundTouch();
        this.soundTouch.pitch = pitch;
        this.soundTouch.tempo = tempo;

        this.duration = undefined;
    }

    //get and set pitch value
    get pitch() {
        return this.soundTouch.pitch;
    }
    set pitch(pitch) {
        this.soundTouch.pitch = pitch;
    }

    //get and set tempo value
    get tempo() {
        return this.soundTouch.tempo;
    }
    set tempo(tempo) {
        this.soundTouch.tempo = tempo;
    }

    //decode audio data and set buffer
    decodeAudioData(data) {
        var context = this.context;
        return new Promise(function (resolve, reject) {
            context.decodeAudioData(
                data, 
                (buffer) => {
                    resolve(buffer);
                }, 
                (e) => { reject(e); }
            );
        });
    }

    //create a buffer source from given data and send info to observer
    setBuffer(buffer,ref) {
        const bufferSource = this.context.createBufferSource();
        bufferSource.buffer = buffer;

        this.samples = new Float32Array(BUFFER_SIZE * 2);
        this.source = {
            extract: (target, numFrames, position) => {
                this.emitter.emit('state', {t: position / this.context.sampleRate});
                const l = buffer.getChannelData(0);
                const r = buffer.getChannelData(1);
                for (let i = 0; i < numFrames; i++) {
                    target[i * 2] = l[i + position];
                    target[i * 2 + 1] = r[i + position];
                }
                return Math.min(numFrames, l.length - position);
            },
        };
        this.simpleFilter = new SimpleFilter(this.source, this.soundTouch);

        this.duration = buffer.duration;
        this.emitter.emit('state', {duration: buffer.duration});
    }

    //play and pause audio
    play() {
        this.context.resume();
        this.scriptProcessor.connect(this.context.destination);
    }
    pause() {
        this.context.resume();
        this.scriptProcessor.disconnect(this.context.destination);
    }

    //set current source position to requested percentage of the full-length 
    seekPercent(percent) {
        if (this.simpleFilter !== undefined) {
            this.simpleFilter.sourcePosition = Math.round(
                percent / 100 * this.duration * this.context.sampleRate
            );
        }
        this.context.resume();
    }
}

export default AudioPlayer;
