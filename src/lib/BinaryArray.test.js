import { expect, test } from "bun:test";
import {
  BinaryArray,
  appendUint16,
  appendUint32,
  appendUint8,
  asUint8Array,
  bigEndian,
  littleEndian,
} from "./BinaryArray";

test("basic appending", () => {
  const binary = bigEndian();

  appendUint32(binary, 1);
  appendUint16(binary, 602);
  appendUint8(binary, 3);

  expect(asUint8Array(binary)).toEqual(
    new Uint8Array([...[0, 0, 0, 1], ...[2, 90], ...[3]])
  );
});

test("little endian", () => {
  const binary = littleEndian();

  appendUint32(binary, 1);
  appendUint16(binary, 602);
  appendUint8(binary, 3);

  expect(asUint8Array(binary)).toEqual(
    new Uint8Array([
      ...[0, 0, 0, 1].reverse(),
      ...[2, 90].reverse(),
      ...[3].reverse(),
    ])
  );
});
