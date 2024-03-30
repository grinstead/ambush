export const NUM_BYTES_INT16 = 2;
export const NUM_BYTES_INT32 = 4;
export const NUM_BYTES_FLOAT32 = 4;

// arbitrarily chosen
const START_SIZE = 32;

/**
 * A class that helps parse and write binary data.
 *
 * It contains a read and write index. When you read from the DataArray, it will
 * shift the read index, so that reading an int32 and then reading an int32
 * again is equivalent to taking the front 8 bytes and interpreting it as two
 * ints.
 *
 * Writing to this class is done almost exclusively with appends. The class
 * will automatically resize its internal buffer if you write past the end of
 * what is currently allocated.
 */
export class BinaryArray {
  _bytes: Uint8Array;
  _view: undefined | DataView;
  _readIndex: number = 0;
  _writeIndex: number;
  _allocated: number;
  littleEndian: boolean = false;

  /**
   * @param bytes The bytes to read from
   * @param overwrite If this is true, the data will instead write to this buffer
   */
  constructor(
    bytes?: ArrayBuffer | ArrayBufferView,
    overwrite: boolean = !bytes
  ) {
    let asUint8;
    if (bytes instanceof ArrayBuffer) {
      asUint8 = new Uint8Array(bytes);
    } else if (bytes) {
      asUint8 =
        bytes instanceof Uint8Array
          ? bytes
          : new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    } else {
      asUint8 = new Uint8Array(START_SIZE);
    }

    this._bytes = asUint8;
    this._allocated = asUint8.length;
    this._writeIndex = overwrite ? 0 : asUint8.byteLength;
  }

  get byteLength() {
    return this._writeIndex - this._readIndex;
  }
}

/**
 * A Little-Endian Binary Array
 */
export type BinaryArrayLE = BinaryArray & { littleEndian: true };
/**
 * A Big-Endian Binary Array
 */
export type BinaryArrayBE = BinaryArray & { littleEndian: false };

export function asUint8Array(array: BinaryArray): Uint8Array {
  const { _readIndex: start, _writeIndex: end, _bytes: bytes } = array;

  return start < end
    ? new Uint8Array(bytes.buffer, bytes.byteOffset + start, end - start)
    : new Uint8Array();
}

export function bigEndian(
  bytes?: ArrayBuffer | ArrayBufferView,
  overwrite?: boolean
): BinaryArrayBE {
  return new BinaryArray(bytes, overwrite) as BinaryArrayBE;
}

export function littleEndian(
  bytes?: ArrayBuffer | ArrayBufferView,
  overwrite?: boolean
): BinaryArrayLE {
  const array = new BinaryArray(bytes, overwrite) as BinaryArrayLE;
  array.littleEndian = true;
  return array;
}

export function numBytes(array: BinaryArray) {
  return array._writeIndex;
}

function v(array: BinaryArray): DataView {
  let view = array._view;
  if (!view) {
    const bytes = array._bytes;
    array._view = view = new DataView(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength
    );
  }

  return view;
}

export { v as viewOf };

export function ensureAdditionalBytes(array: BinaryArray, numBytes: number) {
  // "claim" the bytes but then reset it back down
  array._writeIndex = claimBytes(array, numBytes);
}

export function shiftReadIndex(array: BinaryArray, count: number): number {
  const start = array._readIndex;
  const shifted = start + count;

  shifted > array._writeIndex && throwBinaryArrayError(1);

  array._readIndex = shifted;
  return start;
}

export function claimBytes(array: BinaryArray, numBytes: number): number {
  let { _writeIndex: index, _allocated: allocated } = array;

  if ((array._writeIndex = index + numBytes) > allocated) {
    const offset = array._readIndex;

    // we have to re-allocate the underlying buffer, either double the size, or
    // add some bytes if the bytesize is tiny
    allocated = Math.max(2 * (allocated - offset), START_SIZE, numBytes);

    const prev = array._bytes;
    const data = new Uint8Array(allocated);
    data.set(offset ? prev.subarray(offset) : prev);

    array._readIndex = 0;
    array._writeIndex = (index -= offset) + numBytes;
    array._allocated = allocated;
    array._bytes = data;
    array._view = undefined;
  }

  return index;
}

export function appendUint8(array: BinaryArray, value: number) {
  const index = claimBytes(array, 1);
  array._bytes[index] = value;
}

export function appendUint16(
  array: BinaryArray,
  value: number,
  littleEndian: boolean = array.littleEndian
) {
  const index = claimBytes(array, NUM_BYTES_INT16);
  v(array).setUint16(index, value, littleEndian);
}

export function appendUint32(
  array: BinaryArray,
  value: number,
  littleEndian: boolean = array.littleEndian
) {
  const index = claimBytes(array, NUM_BYTES_INT32);
  v(array).setUint32(index, value, littleEndian);
}

export function appendFloat32(
  array: BinaryArray,
  value: number,
  littleEndian: boolean = array.littleEndian
) {
  const index = claimBytes(array, NUM_BYTES_FLOAT32);
  v(array).setFloat32(index, value, littleEndian);
}

export function appendUint8Array(array: BinaryArray, buffer: Uint8Array) {
  const index = claimBytes(array, buffer.byteLength);
  array._bytes.set(buffer, index);
}

let utf8Encoder: undefined | TextEncoder;
export function appendUtf8(
  array: BinaryArray,
  text: string,
  maxBytes?: number
): TextEncoderEncodeIntoResult {
  // an over-allocation, but the text will be guaranteed to fit
  const length = maxBytes ?? text.length * 3;
  const index = claimBytes(array, length);

  const bytes = array._bytes.subarray(index, index + length);
  const result = (utf8Encoder ??= new TextEncoder()).encodeInto(text, bytes);

  // reset the write index to reclaim any potentially unused bytes
  array._writeIndex = index + result.written;

  return result;
}

export function readUint8(array: BinaryArray): number {
  const index = shiftReadIndex(array, 1);
  return array._bytes[index];
}

export function readUint16(
  array: BinaryArray,
  littleEndian: boolean = array.littleEndian
): number {
  const index = shiftReadIndex(array, 2);
  return v(array).getUint16(index, littleEndian);
}

export function readUint32(
  array: BinaryArray,
  littleEndian: boolean = array.littleEndian
): number {
  const index = shiftReadIndex(array, 4);
  return v(array).getUint32(index, littleEndian);
}

export function readFloat32(
  array: BinaryArray,
  littleEndian: boolean = array.littleEndian
): number {
  const index = shiftReadIndex(array, 4);
  return v(array).getFloat32(index, littleEndian);
}

export function readUint8Array(array: BinaryArray, length: number): Uint8Array {
  const index = shiftReadIndex(array, length);
  return array._bytes.subarray(index, index + length);
}

let utf8Decoder: undefined | TextDecoder;
export function readUtf8(array: BinaryArray, length: number): string {
  const index = shiftReadIndex(array, length);

  return (utf8Decoder ??= new TextDecoder()).decode(
    array._bytes.subarray(index, index + length)
  );
}

function throwBinaryArrayError(errorCode: number) {
  throw new Error(`BinaryArrayError (code ${errorCode})`);
}
