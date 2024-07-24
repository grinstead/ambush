import { InspectablePromise } from "../other/InspectablePromise.ts";

export class SoundEffect {
  rawBuffer: undefined | InspectablePromise<ArrayBuffer>;
  decoded: undefined | InspectablePromise<AudioBuffer>;

  constructor(readonly url: URL) {}
}
