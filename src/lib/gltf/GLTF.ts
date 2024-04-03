import { GLTFAsset } from "./gltf_types.ts";
import { GLBFile } from "./parseGLB.ts";

export class GLTF {
  constructor(readonly meta: GLTFAsset, readonly bin?: Uint8Array) {}
}

export function gltfFromFile(file: GLBFile) {
  return new GLTF(file.asset, file.bin);
}
