import { expect, test } from "bun:test";
import {
  BinaryArray,
  appendUint16,
  appendUint32,
  appendUint8,
  asUint8Array,
  bigEndian,
  littleEndian,
  readUint16,
  readUint32,
  readUint8,
  readUint8Array,
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

test("writing little endian", () => {
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

test("basic reading", () => {
  const binary = bigEndian(
    new Uint8Array([...[0, 0, 0, 1], ...[2, 90], ...[3]])
  );

  expect(readUint32(binary)).toEqual(1);
  expect(readUint16(binary)).toEqual(602);
  expect(readUint8(binary)).toEqual(3);
});

test("overflow", () => {
  const binary = bigEndian(
    new Uint8Array([...[0, 0, 0, 1], ...[2, 90], ...[3]])
  );

  expect(readUint32(binary)).toEqual(1);
  expect(() => readUint32(binary)).toThrow();
});

test("reading and writing", () => {
  const binary = bigEndian();

  appendUint32(binary, 1);
  appendUint32(binary, 2);

  expect(readUint8(binary)).toEqual(0);

  appendUint16(binary, 3);

  expect(asUint8Array(binary)).toEqual(
    new Uint8Array([...[0, 0, 1], ...[0, 0, 0, 2], ...[0, 3]])
  );
});

test("expanding an array", () => {
  const binary = bigEndian();

  const bytes = [];
  for (let i = 1; i <= 10; i++) {
    appendUint32(binary, i);
    bytes.push(0, 0, 0, i);
  }

  expect(binary.byteLength).toEqual(10 * 4);
  expect(asUint8Array(binary)).toEqual(new Uint8Array(bytes));

  expect(readUint8(binary)).toEqual(0);
  expect(readUint32(binary)).toEqual(256);

  for (let i = 0; i < 5; i++) bytes.shift();

  expect(asUint8Array(binary)).toEqual(new Uint8Array(bytes));
});

test("copy only what is necessary", () => {
  const original = new Uint8Array([
    ...[0, 0, 0, 1],
    ...[0, 0, 0, 2],
    ...[0, 0, 0, 3],
  ]);
  const binary = bigEndian(original);
  expect(binary._bytes).toEqual(original);

  readUint32(binary);

  expect(binary._bytes).toEqual(original);

  appendUint32(binary, 4);

  expect(binary._bytes).not.toEqual(original);
  expect(binary._bytes[3]).toEqual(2);
});

test("read Uint8Array", () => {
  const original = new Uint8Array([
    ...[0, 0, 0, 1],
    ...[0, 0, 0, 2],
    ...[0, 0, 0, 3],
  ]);
  const binary = bigEndian(original);
  expect(binary._bytes).toEqual(original);

  expect(readUint8Array(binary, 6)).toEqual(original.subarray(0, 6));
  expect(binary.byteLength).toEqual(6);
  expect(readUint16(binary)).toEqual(2);
});
