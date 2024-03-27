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
  bytes: Uint8Array;
  _view: undefined | DataView;
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

    this.bytes = asUint8;
    this._allocated = asUint8.length;
    this._writeIndex = overwrite ? 0 : asUint8.byteLength;
  }
}

export function bigEndian(
  bytes?: ArrayBuffer | ArrayBufferView,
  overwrite?: boolean
) {
  return new BinaryArray(bytes, overwrite);
}

export function littleEndian(
  bytes?: ArrayBuffer | ArrayBufferView,
  overwrite?: boolean
) {
  const array = new BinaryArray(bytes, overwrite);
  array.littleEndian = true;
  return array;
}

export function numBytes(array: BinaryArray) {
  return array._writeIndex;
}

function v(array: BinaryArray): DataView {
  let view = array._view;
  if (!view) {
    const bytes = array.bytes;
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

export function claimBytes(array: BinaryArray, numBytes: number): number {
  let { _writeIndex: index, _allocated: allocated } = array;

  if ((array._writeIndex = index + numBytes) > allocated) {
    // we have to re-allocate the underlying buffer, either double the size, or
    // add some bytes if the bytesize is tiny
    allocated += Math.max(allocated, START_SIZE, numBytes);

    const prev = array.bytes;
    const data = new Uint8Array(allocated);
    prev && data.set(prev);

    array._allocated = allocated;
    array.bytes = data;
    array._view = undefined;
  }

  return index;
}

export function appendUint8(array: BinaryArray, value: number) {
  const index = claimBytes(array, 1);
  array.bytes[index] = value;
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
