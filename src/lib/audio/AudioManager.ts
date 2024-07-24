import {
  createPromise,
  InspectablePromise,
} from "../other/InspectablePromise.ts";
import { SoundEffect } from "./SoundEffect.ts";

export class AudioManager {
  context: undefined | AudioContext;
  readonly activeSounds: WeakMap<{}, AudioBufferSourceNode> = new WeakMap();
  preloads:
    | undefined
    | Array<[ArrayBuffer, (audio: Promise<AudioBuffer>) => void]>;

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
      console.log("LOADING", s.url.toString());

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

    if (volume <= 0) return;

    const { destination } = context;

    const head = context.createBufferSource();
    head.buffer = sound.decoded.get();

    if (volume >= 1) {
      head.connect(destination);
    } else {
      const gainNode = context.createGain();
      gainNode.gain.value = volume;
      head.connect(gainNode);
      gainNode.connect(destination);
    }

    if (source) {
      activeSounds.set(source, head);
    }

    head.start();
  }
}
