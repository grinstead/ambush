import { throwError } from "../utils.ts";
import {
  GLTFAccessor,
  GLTFAsset,
  GLTFBuffer,
  GLTFBufferView,
  GLTFIndex,
  GLTFMesh,
  GLTFNode,
  GLTFScene,
} from "./gltf_types.ts";
import { GLBFile } from "./parseGLB.ts";

export class GLTFModel {
  constructor(readonly meta: GLTFAsset, readonly bin?: Uint8Array) {}

  buffer(index: GLTFIndex<"buffers">): GLTFBuffer {
    return (
      this.meta.buffers?.[index as number] ??
      throwError(`Unrecognized buffer ${index}`)
    );
  }

  bufferView(index: GLTFIndex<"bufferViews">): GLTFBufferView {
    return (
      this.meta.bufferViews?.[index as number] ??
      throwError(`Unrecognized bufferView ${index}`)
    );
  }

  accessor(index: GLTFIndex<"accessors">): GLTFAccessor {
    return (
      this.meta.accessors?.[index as number] ??
      throwError(`Unrecognized accessor ${index}`)
    );
  }

  node(index: GLTFIndex<"nodes">): GLTFNode {
    return (
      this.meta.nodes?.[index as number] ??
      throwError(`Unrecognized node ${index}`)
    );
  }

  mesh(index: GLTFIndex<"meshes">): GLTFMesh {
    return (
      this.meta.meshes?.[index as number] ??
      throwError(`Unrecognized meshe ${index}`)
    );
  }

  scene(index: GLTFIndex<"scenes">): GLTFScene {
    return (
      this.meta.scenes?.[index as number] ??
      throwError(`Unrecognized scene ${index}`)
    );
  }

  attachTo(device: GPUDevice) {
    return new GLTF(device, this);
  }
}

export class GLTF {
  constructor(readonly device: GPUDevice, readonly model: GLTFModel) {}
}

export function gltfFromFile(file: GLBFile) {
  return new GLTFModel(file.asset, file.bin);
}
