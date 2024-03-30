import { expect, test } from "bun:test";
import {
  appendUtf8,
  asUint8Array,
  littleEndian,
  readUint8Array,
} from "./BinaryArray.ts";
import { readBase64 } from "./Base64.ts";

test("decode basic", () => {
  // taken from wikipedia examples
  const pairs = {
    "Many hands make light work.": "TWFueSBoYW5kcyBtYWtlIGxpZ2h0IHdvcmsu",
    "light work.": "bGlnaHQgd29yay4=",
    "light work": "bGlnaHQgd29yaw==",
    "light wor": "bGlnaHQgd29y",
    "light wo": "bGlnaHQgd28=",
    "light w": "bGlnaHQgdw==",
  };

  const decoded = littleEndian();
  const encoded = littleEndian();

  for (const [text, base64] of Object.entries(pairs)) {
    appendUtf8(decoded, text);
    appendUtf8(encoded, base64);

    // console.log("expect " + text, base64, decoded.byteLength);
    expect(readBase64(encoded)).toEqual(
      readUint8Array(decoded, decoded.byteLength)
    );

    expect(encoded.byteLength).toEqual(0);
  }
});
