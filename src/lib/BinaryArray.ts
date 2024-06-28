/** The number of bytes for an 8-bit integer. */
export const NUM_BYTES_INT8 = 1;
/** The number of bytes for a 16-bit integer. */
export const NUM_BYTES_INT16 = 2;
/** The number of bytes for a 32-bit integer. */
export const NUM_BYTES_INT32 = 4;
/** The number of bytes for a 16-bit floating point number. */
export const NUM_BYTES_FLOAT16 = 2;
/** The number of bytes for a 32-bit floating point number. */
export const NUM_BYTES_FLOAT32 = 4;
/** The number of bytes for a 64-bit floating point number. */
export const NUM_BYTES_FLOAT64 = 8;

// Arbitrarily chosen starting size for the internal buffer
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
   * @param overwrite If this is true, the data will ignore the current content and write to the buffer, starting from index 0
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

  /**
   * The current byte length of the data.
   */
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

/**
 * Convert a BinaryArray to a Uint8Array.
 *
 * It is possible that returned value is a slice of some larger ArrayBuffer, be
 * careful with it.
 *
 * @param array The BinaryArray to convert
 * @returns A Uint8Array representing the data
 */
export function asUint8Array(array: BinaryArray): Uint8Array {
  const { _readIndex: start, _writeIndex: end, _bytes: bytes } = array;

  return start < end
    ? new Uint8Array(bytes.buffer, bytes.byteOffset + start, end - start)
    : new Uint8Array();
}

/**
 * Create a Big-Endian BinaryArray.
 *
 * @param bytes The initial bytes to use
 * @param overwrite Whether to overwrite the existing data
 * @returns A Big-Endian BinaryArray
 */
export function bigEndian(
  bytes?: ArrayBuffer | ArrayBufferView,
  overwrite?: boolean
): BinaryArrayBE {
  return new BinaryArray(bytes, overwrite) as BinaryArrayBE;
}

/**
 * Create a Little-Endian BinaryArray.
 *
 * @param bytes The initial bytes to use
 * @param overwrite Whether to overwrite the existing data
 * @returns A Little-Endian BinaryArray
 */
export function littleEndian(
  bytes?: ArrayBuffer | ArrayBufferView,
  overwrite?: boolean
): BinaryArrayLE {
  const array = new BinaryArray(bytes, overwrite) as BinaryArrayLE;
  array.littleEndian = true;
  return array;
}

/**
 * Get the number of bytes written to the BinaryArray.
 *
 * @param array The BinaryArray to query
 * @returns The number of bytes written
 */
export function numBytes(array: BinaryArray) {
  return array._writeIndex;
}

/**
 * Get the DataView for the BinaryArray.
 *
 * This is used for making custom `read` and `append` methods.
 *
 * @param array The BinaryArray to query
 * @returns The DataView
 */
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

/**
 * Ensure there are additional bytes allocated in the BinaryArray.
 *
 * @param array The BinaryArray to modify
 * @param numBytes The number of bytes to add
 */
export function ensureAdditionalBytes(array: BinaryArray, numBytes: number) {
  // "claim" the bytes but then reset it back down
  array._writeIndex = claimBytes(array, numBytes);
}

/**
 * Shift the read index of the BinaryArray.
 *
 * @param array The BinaryArray to modify
 * @param count The number of bytes to shift
 * @returns The previous read index
 */
export function shiftReadIndex(array: BinaryArray, count: number): number {
  const start = array._readIndex;
  const shifted = start + count;

  shifted > array._writeIndex && throwBinaryArrayError(1);

  array._readIndex = shifted;
  return start;
}

/**
 * Claim bytes in the BinaryArray, reallocating if necessary.
 *
 * @param array The BinaryArray to modify
 * @param numBytes The number of bytes to claim
 * @returns The previous write index
 */
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

/**
 * Append a Uint8 value to the BinaryArray.
 *
 * @param array The BinaryArray to modify
 * @param value The value to append
 */
export function appendUint8(array: BinaryArray, value: number) {
  const index = claimBytes(array, 1);
  array._bytes[index] = value;
}

/**
 * Append a Uint16 value to the BinaryArray.
 *
 * @param array The BinaryArray to modify
 * @param value The value to append
 * @param littleEndian Whether to use little-endian byte order
 */
export function appendUint16(
  array: BinaryArray,
  value: number,
  littleEndian: boolean = array.littleEndian
) {
  const index = claimBytes(array, NUM_BYTES_INT16);
  v(array).setUint16(index, value, littleEndian);
}

/**
 * Append a Uint32 value to the BinaryArray.
 *
 * @param array The BinaryArray to modify
 * @param value The value to append
 * @param littleEndian Whether to use little-endian byte order
 */
export function appendUint32(
  array: BinaryArray,
  value: number,
  littleEndian: boolean = array.littleEndian
) {
  const index = claimBytes(array, NUM_BYTES_INT32);
  v(array).setUint32(index, value, littleEndian);
}

/**
 * Append a Int32 value to the BinaryArray.
 *
 * @param array The BinaryArray to modify
 * @param value The value to append
 * @param littleEndian Whether to use little-endian byte order
 */
export function appendInt32(
  array: BinaryArray,
  value: number,
  littleEndian: boolean = array.littleEndian
) {
  const index = claimBytes(array, NUM_BYTES_INT32);
  v(array).setInt32(index, value, littleEndian);
}

/**
 * Append a Float32 value to the BinaryArray.
 *
 * @param array The BinaryArray to modify
 * @param value The value to append
 * @param littleEndian Whether to use little-endian byte order
 */
export function appendFloat32(
  array: BinaryArray,
  value: number,
  littleEndian: boolean = array.littleEndian
) {
  const index = claimBytes(array, NUM_BYTES_FLOAT32);
  v(array).setFloat32(index, value, littleEndian);
}

/**
 * Append a buffer to the BinaryArray.
 *
 * @param array The BinaryArray to modify
 * @param buffer The buffer to append
 * @param byteOffset The byte offset to start from
 * @param length The length of bytes to append
 */
export function appendBuffer(
  array: BinaryArray,
  buffer: ArrayBuffer,
  byteOffset?: number,
  length?: number
) {
  const index = claimBytes(array, buffer.byteLength);
  array._bytes.set(new Uint8Array(buffer, byteOffset, length), index);
}

/**
 * Append a Uint8Array to the BinaryArray.
 *
 * @param array The BinaryArray to modify
 * @param buffer The Uint8Array to append
 */
export function appendUint8Array(array: BinaryArray, buffer: Uint8Array) {
  const index = claimBytes(array, buffer.byteLength);
  array._bytes.set(buffer, index);
}

let utf8Encoder: undefined | TextEncoder;

/**
 * Append an ASCII string to the BinaryArray.
 *
 * This is the same as {@link appendUtf8}, except that function needs to
 * overallocate the bytes so that it all fits, whereas this one assumes one byte
 * per character and so can pre-allocate exactly what's needed.l
 *
 * @param array The BinaryArray to modify
 * @param text The text to append
 * @param maxBytes The maximum number of bytes to use
 * @returns The result of the encoding
 */
export function appendAscii(
  array: BinaryArray,
  text: string,
  maxBytes: number = text.length
) {
  return appendUtf8(array, text, maxBytes);
}

/**
 * Append a UTF-8 string to the BinaryArray.
 *
 * @param array The BinaryArray to modify
 * @param text The text to append
 * @param maxBytes The maximum number of bytes to use
 * @returns The result of the encoding
 */
export function appendUtf8(
  array: BinaryArray,
  text: string,
  maxBytes?: number
): TextEncoderEncodeIntoResult {
  // an over-allocation, but the text will be guaranteed to fit
  const length = maxBytes ?? text.length * 4;
  const index = claimBytes(array, length);

  const bytes = array._bytes.subarray(index, index + length);
  const result = (utf8Encoder ??= new TextEncoder()).encodeInto(text, bytes);

  // reset the write index to reclaim any potentially unused bytes
  array._writeIndex = index + result.written;

  return result;
}

/**
 * Read a Uint8 value from the BinaryArray.
 *
 * @param array The BinaryArray to read from
 * @returns The read value
 */
export function readUint8(array: BinaryArray): number {
  const index = shiftReadIndex(array, 1);
  return array._bytes[index];
}

/**
 * Read a Uint16 value from the BinaryArray.
 *
 * @param array The BinaryArray to read from
 * @param littleEndian Whether to use little-endian byte order
 * @returns The read value
 */
export function readUint16(
  array: BinaryArray,
  littleEndian: boolean = array.littleEndian
): number {
  const index = shiftReadIndex(array, 2);
  return v(array).getUint16(index, littleEndian);
}

/**
 * Read a Uint32 value from the BinaryArray.
 *
 * @param array The BinaryArray to read from
 * @param littleEndian Whether to use little-endian byte order
 * @returns The read value
 */
export function readUint32(
  array: BinaryArray,
  littleEndian: boolean = array.littleEndian
): number {
  const index = shiftReadIndex(array, 4);
  return v(array).getUint32(index, littleEndian);
}

/**
 * Read a Float32 value from the BinaryArray.
 *
 * @param array The BinaryArray to read from
 * @param littleEndian Whether to use little-endian byte order
 * @returns The read value
 */
export function readFloat32(
  array: BinaryArray,
  littleEndian: boolean = array.littleEndian
): number {
  const index = shiftReadIndex(array, 4);
  return v(array).getFloat32(index, littleEndian);
}

/**
 * Read a Uint8Array from the BinaryArray.
 *
 * @param array The BinaryArray to read from
 * @param length The length of the Uint8Array
 * @returns The read Uint8Array
 */
export function readUint8Array(array: BinaryArray, length: number): Uint8Array {
  const index = shiftReadIndex(array, length);
  return array._bytes.subarray(index, index + length);
}

let utf8Decoder: undefined | TextDecoder;

/**
 * Read a UTF-8 string from the BinaryArray.
 *
 * @param array The BinaryArray to read from
 * @param length The length of the string
 * @returns The read string
 */
export function readUtf8(array: BinaryArray, length: number): string {
  const index = shiftReadIndex(array, length);

  return (utf8Decoder ??= new TextDecoder()).decode(
    array._bytes.subarray(index, index + length)
  );
}

/**
 * Throw a BinaryArray error with a specific code.
 *
 * @param errorCode The error code
 */
function throwBinaryArrayError(errorCode: number) {
  throw new Error(`BinaryArrayError (code ${errorCode})`);
}

/**
 * Build a binary array using a builder function.
 *
 * @param builder The builder function
 * @param binary The binary array to build (optional)
 * @returns The built binary array
 */
export function buildBinary(
  builder: (bin: BinaryArrayBE) => unknown,
  binary: BinaryArrayBE
): BinaryArrayBE;
export function buildBinary(
  builder: (bin: BinaryArrayLE) => unknown,
  binary: BinaryArrayLE
): BinaryArrayLE;
export function buildBinary(
  builder: (bin: BinaryArrayLE) => unknown
): BinaryArrayLE;
export function buildBinary(
  builder: (bin: any) => unknown,
  binary: BinaryArrayBE | BinaryArrayLE = littleEndian()
): any {
  builder(binary);
  return binary;
}
