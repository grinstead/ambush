import { read, throwError } from "../utils.ts";
import {
  GLTFAccessor,
  GLTFAsset,
  GLTFAttribute,
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
  _buffers: undefined | Array<GPUBuffer>;

  constructor(readonly device: GPUDevice, readonly model: GLTFModel) {
    // if no buffers, declare ourselves done
    this._buffers = model.meta.buffers?.length ? undefined : [];
  }
}

export function prepareGLTF(gltf: GLTF): Promise<void> {
  if (!gltf._buffers) {
    const {
      device,
      model: {
        meta: { buffers },
        bin,
      },
    } = gltf;

    if (!buffers) return Promise.resolve();

    gltf._buffers = buffers.map((model) => {
      const size = model.byteLength;

      // todo: figure out proper usage
      const buffer = device.createBuffer({
        label: model.name,
        size,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });

      if (!model.uri) {
        device.queue.writeBuffer(
          buffer,
          0,
          bin ?? throwError(`No binary included in GLTF`),
          0,
          size
        );
      } else {
        throw new Error(`TODO: load buffer from uri`);
      }

      return buffer;
    });
  }

  return Promise.resolve();
}

type ShaderIndex = number;

/**
 *
 * @param gltf The data to build from
 * @param attributes The declared values in the shader
 * @param meshIndex Which mesh to draw from (defaults to 0)
 * @returns A value that can be passed as the buffers parameter to a render pipeline
 */
export function getVertexBuffers(
  gltf: GLTF,
  attributes: { [Attr in GLTFAttribute]?: ShaderIndex },
  meshIndex: GLTFIndex<"meshes"> = 0
): GPUVertexBufferLayout[] {
  const results: GPUVertexBufferLayout[] = [];

  const { model } = gltf;

  const mesh = model.mesh(meshIndex);

  // todo: understand why there could be multiple mesh primitives
  const accessors = mesh.primitives?.[0].attributes;
  if (!accessors) return results;

  // const buffers = new Map<GLTFAccessor, GPUVertexBufferLayout>();

  for (const attr in accessors) {
    const loc = read(attributes, attr as GLTFAttribute);
    if (loc == null) continue;

    const accModel = model.accessor(accessors[attr as any]!);
    console.log(accModel);
  }

  return results;
}

export function gltfFromFile(file: GLBFile) {
  return new GLTFModel(file.asset, file.bin);
}
