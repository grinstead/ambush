import {
  BinaryArray,
  appendAscii,
  littleEndian,
  shiftReadIndex,
} from "./BinaryArray.ts";

const CHAR_PAD = 61; // '='

export function readBase64(
  array: BinaryArray,
  byteLength: number = array.byteLength
): Uint8Array {
  if (!byteLength) return new Uint8Array();

  const start = shiftReadIndex(array, byteLength);
  const encoded = array._bytes;

  let length = byteLength;
  let overhang = length & 3;

  // test if data is aligned, in which case it may have a pad

  if (overhang === 0 && encoded[start + length - 1] === CHAR_PAD) {
    length -= encoded[start + length - 2] === CHAR_PAD ? 2 : 1;
    overhang = length & 3;
  }

  // starts as the length of the output array
  let j = overhang
    ? (3 / 4) * (length - overhang) + overhang - 1
    : (3 / 4) * length;
  const output = new Uint8Array(j);

  let i = start + length;
  let a, b, c, d;

  if (overhang === 3) {
    c = decodeByte(encoded[i - 1]);
    b = decodeByte(encoded[i - 2]);
    a = decodeByte(encoded[(i -= 3)]);

    // a   b   c
    // |  /|  /|
    // 6+2 4+4 -
    output[j - 1] = ((b & 0x0f) << 4) | (c >> 2);
    output[(j -= 2)] = (a << 2) | (b >> 4);
  } else if (overhang === 2) {
    // a   b
    // |  /|
    // 6+2 -
    b = decodeByte(encoded[i - 1]);
    a = decodeByte(encoded[(i -= 2)]);

    output[--j] = (a << 2) | (b >> 4);
  }

  while (i > start) {
    d = decodeByte(encoded[i - 1]);
    c = decodeByte(encoded[i - 2]);
    b = decodeByte(encoded[i - 3]);
    a = decodeByte(encoded[(i -= 4)]);

    // a   b   c d
    // |  /|  /| |
    // 6+2 4+4 2+6
    output[j - 1] = ((c & 0x03) << 6) | d;
    output[j - 2] = ((b & 0x0f) << 4) | (c >> 2);
    output[(j -= 3)] = (a << 2) | (b >> 4);
  }

  return output;
}

function decodeByte(byte: number) {
  return byte === 43 /* '+' */
    ? 62
    : byte === 47 /* '/' */
    ? 63
    : byte <= 57 /* '9' */
    ? byte + 4 // 61 - ('9' - byte)
    : byte <= 90 /* 'Z' */
    ? byte - 65 // 25 - ('Z' - byte)
    : byte - 71; // 51 - ('z' - byte)
}

export function parseBase64(base64: string) {
  const bin = littleEndian();
  appendAscii(bin, base64);
  return readBase64(bin);
}
