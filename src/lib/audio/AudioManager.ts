import {
  createPromise,
  InspectablePromise,
} from "../other/InspectablePromise.ts";
import { SoundEffect } from "./SoundEffect.ts";

export class Music {
  dom?: HTMLAudioElement = undefined;
  _loop: boolean = true;

  constructor(readonly manager: AudioManager, readonly url: string) {}

  get loop() {
    return this._loop;
  }

  set loop(loop: boolean) {
    this._loop = loop;

    const { dom } = this;
    if (dom) {
      dom.loop = loop;
    }
  }

  preload(): HTMLAudioElement {
    let { dom } = this;

    if (!dom) {
      this.dom = dom = new Audio();
      dom.src = this.url;
      dom.loop = this._loop;
    }

    return dom;
  }

  play(restart: boolean = false) {
    AudioManager.M.p(this, restart);
  }

  pause() {
    AudioManager.M.s(this);
  }

  stop() {
    AudioManager.M.s(this);
    if (this.dom) {
      this.dom.currentTime = 0;
    }
  }
}

export class AudioManager {
  context: undefined | AudioContext;
  readonly activeSounds: WeakMap<{}, AudioBufferSourceNode> = new WeakMap();
  preloads:
    | undefined
    | Array<[ArrayBuffer, (audio: Promise<AudioBuffer>) => void]>;

  private _volume = 1;

  private readonly soundtracks: Map<string, Music> = new Map();
  private activeMusic: undefined | Music;
  private prevMusic: undefined | Music;

  /**
   * For a proper web browsing experience, it is not possible to start playing
   * sounds until the user interacts with the page. We have to work within that
   * restriction. Your game should, on some early user interaction, call this
   * method to being all the audio processing.
   */
  enable() {
    if (this.context) return;

    const context = new AudioContext();
    this.context = context;

    const { preloads } = this;
    if (preloads) {
      this.preloads = undefined;
      for (const [raw, resolve] of preloads) {
        resolve(context.decodeAudioData(raw));
      }
    }

    this.soundtracks.forEach((st) => {
      st.preload();
    });
  }

  setVolume(volume: number) {
    this._volume = volume;
  }

  preloadAll(sounds: Array<SoundEffect | URL>): Array<SoundEffect>;
  preloadAll<T extends Record<string, SoundEffect | URL>>(
    sounds: T
  ): { [K in keyof T]: SoundEffect };
  preloadAll(sounds: any): any {
    return Array.isArray(sounds)
      ? sounds.map((s) => this.preload(s))
      : Object.fromEntries(
          Object.keys(sounds).map((key) => [key, this.preload(sounds[key])])
        );
  }

  preload(sound: SoundEffect | URL): SoundEffect {
    const s = sound instanceof SoundEffect ? sound : new SoundEffect(sound);

    if (!s.rawBuffer || s.rawBuffer.isError()) {
      s.rawBuffer = new InspectablePromise(
        fetch(s.url).then((response) => response.arrayBuffer())
      );
    }

    if (!s.decoded || s.decoded.isError()) {
      const p = s.rawBuffer!.promise.then((raw) => {
        const { context } = this;
        if (!context) {
          const [promise, resolve] = createPromise<AudioBuffer>();
          (this.preloads ??= []).push([raw, resolve]);
          return promise;
        }

        return context.decodeAudioData(raw);
      });

      s.decoded = new InspectablePromise(p);
    }

    return s;
  }

  play(source: null | {}, sound: SoundEffect, volume: number = 1) {
    const { activeSounds, context } = this;
    const vol = volume * this._volume;

    if (!context) {
      console.warn(`AudioManager.play called before AudioManager.enable`);
      return;
    }

    if (source) {
      const priorSound = activeSounds.get(source);
      if (priorSound) {
        activeSounds.delete(source);
        priorSound.stop();
      }
    }

    if (!sound.decoded?.isFulfilled()) {
      this.preload(sound);
      console.warn(`Sound not yet loaded: ${sound.url}`);
      return;
    }

    if (vol <= 0) return;

    const { destination } = context;

    const head = context.createBufferSource();
    head.buffer = sound.decoded.get();

    if (vol >= 1) {
      head.connect(destination);
    } else {
      const gainNode = context.createGain();
      gainNode.gain.value = vol;
      head.connect(gainNode);
      gainNode.connect(destination);
    }

    if (source) {
      activeSounds.set(source, head);
    }

    head.start();
  }

  music(): undefined | Music;
  music(url: string | URL): Music;
  music(url?: string | URL): undefined | Music {
    if (!url) return this.activeMusic ?? this.prevMusic;

    const { soundtracks } = this;

    const urlStr = String(url);
    let soundtrack = soundtracks.get(urlStr);

    if (!soundtrack) {
      soundtrack = new Music(this, urlStr);
      soundtracks.set(urlStr, soundtrack);
    }

    return soundtrack;
  }

  /**
   * Cleans up internal resources, at least theoretically.
   *
   * At the moment it only stops the music.
   */
  destroy() {
    this.activeMusic?.stop();
  }

  /**
   * Internal methods to control the music audio, ignore this object.
   */
  static M = {
    /** Plays the current soundtrack */
    p(music: Music, restart: boolean) {
      let { manager } = music;

      const active = manager.activeMusic;
      if (active === music) {
        if (restart) {
          music.dom!.currentTime = 0;
        }
        return;
      }

      active?.dom?.pause();

      manager.prevMusic = active;
      manager.activeMusic = music;

      const dom = music.preload();
      if (restart) dom.currentTime = 0;
      dom.play();
    },

    /** Stops the soundtrack */
    s(st: Music) {
      const { manager } = st;

      const active = manager.activeMusic;
      if (active !== st) return;

      manager.prevMusic = active;
      manager.activeMusic = undefined;

      st.dom?.pause();
    },
  };
}
