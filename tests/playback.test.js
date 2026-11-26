const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createApp(playResult = () => Promise.resolve()) {
    let audio;
    let notice;
    const container = {
        set innerHTML(value) {
            if (!value.includes('id="audio-player"')) return;
            const listeners = {};
            audio = {
                playCalls: 0,
                duration: 60,
                currentTime: 60,
                addEventListener(type, callback) {
                    listeners[type] = callback;
                },
                play() {
                    this.playCalls++;
                    return playResult();
                },
                emit(type) {
                    listeners[type]?.();
                },
                focus() {}
            };
            notice = { hidden: true, textContent: '' };
        }
    };
    const document = {
        readyState: 'loading',
        addEventListener() {},
        getElementById(id) {
            return {
                'audio-player-container': container,
                'audio-player': audio,
                'playback-notice': notice
            }[id] || null;
        }
    };
    const context = vm.createContext({
        document,
        console: { warn() {}, error() {} },
        setTimeout() {},
        setInterval() {},
        clearInterval() {}
    });
    const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'script.js'), 'utf8');
    vm.runInContext(source, context);
    vm.runInContext(`
        links = ['https://example.com/audio/2024/01/story.mp3'];
        addToHistory = () => {};
        savePlaybackPosition = () => {};
    `, context);
    return {
        context,
        get audio() { return audio; },
        get notice() { return notice; }
    };
}

test('finished audio starts the next random story without waiting for canplay', () => {
    const app = createApp();
    vm.runInContext("openAudioPlayer('first.mp3', 'First')", app.context);
    const first = app.audio;
    assert.equal(first.playCalls, 0);

    first.emit('ended');

    assert.notEqual(app.audio, first);
    assert.equal(app.audio.playCalls, 1);
});

test('random story playback starts immediately', () => {
    const app = createApp();
    vm.runInContext('playRandomSession()', app.context);
    assert.equal(app.audio.playCalls, 1);
});

test('blocked autoplay prompts the user and clears the notice on play', async () => {
    const app = createApp(() => Promise.reject(new Error('Autoplay blocked')));
    vm.runInContext('playRandomSession()', app.context);
    await new Promise(resolve => setImmediate(resolve));

    assert.equal(app.notice.hidden, false);
    assert.match(app.notice.textContent, /press play/i);
    app.audio.emit('play');
    assert.equal(app.notice.hidden, true);
});
