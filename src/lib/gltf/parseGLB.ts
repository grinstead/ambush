import {
  BinaryArray,
  BinaryArrayLE,
  NUM_BYTES_INT32,
  littleEndian,
  readUtf8,
  readUint32,
  readUint8,
  readUint8Array,
} from "../BinaryArray.ts";
import { GLTFAsset } from "./gltf_types.ts";

const HEADER_MAGIC = 0x46546c67; // glTF in ASCII (when little-endian), all glb files begin with this
const SUPPORTED_VERSION = 2;
const HEADER_LENGTH = 3 * NUM_BYTES_INT32;
// glb files MUST contain a json chunk
const MIN_LENGTH = HEADER_LENGTH + 2 * NUM_BYTES_INT32 + 2; // 2 === '{}'.length;
const LITTLE_ENDIAN = true;
const CHUNK_HEADER_JSON = 0x4e4f534a;
const CHUNK_HEADER_BIN = 0x004e4942;

export type GLBFile = {
  asset: GLTFAsset;
  bin?: Uint8Array;
};

export function parseGLB(container: BinaryArray): GLBFile {
  const binary = claimGLBContents(container);

  const jsonLength = readUint32(binary);
  const jsonType = readUint32(binary);

  if (jsonType !== CHUNK_HEADER_JSON) {
    throw new Error(`Unrecognized Initial Chunk ${jsonType}`);
  }

  const unparsedJson = readUtf8(binary, jsonLength);

  let bin: undefined | Uint8Array;

  // the spec guarantees if there is a binary chunk, that it will be the second
  // chunk. Additionally, we should ignore any unrecognized chunk types
  if (binary.byteLength > 0) {
    const binLength = readUint32(binary);
    const binType = readUint32(binary);

    if (binType === CHUNK_HEADER_BIN) {
      bin = readUint8Array(binary, binLength);
    }
  }

  // for true correctness, we should check that all remaining data is structured
  // into the spec's chunk format, but why bother.

  // TODO: we should validate this
  const asset = JSON.parse(unparsedJson) as GLTFAsset;

  return { asset, bin };
}

function claimGLBContents(binary: BinaryArray): BinaryArrayLE {
  const byteLength = binary.byteLength;

  if (byteLength < MIN_LENGTH) {
    throw new Error(
      `Given impossibly small (${binary.byteLength} bytes) glb file`
    );
  }

  if (readUint32(binary, LITTLE_ENDIAN) !== HEADER_MAGIC) {
    throw new Error("Given non-glb data");
  }

  const version = readUint32(binary, LITTLE_ENDIAN);
  if (version !== SUPPORTED_VERSION) {
    throw new Error(`Unrecognized .glb version ${version}`);
  }

  const length = readUint32(binary, LITTLE_ENDIAN);
  if (length > byteLength) {
    throw new Error(
      `Incomplete .glb file (expected ${length} bytes, given ${byteLength})`
    );
  }

  return littleEndian(readUint8Array(binary, length - HEADER_LENGTH));
}
