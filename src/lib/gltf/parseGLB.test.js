import { expect, test } from "bun:test";
import { readBase64 } from "../Base64.ts";
import { parseGLB } from "./parseGLB.ts";
import { appendUint8Array, appendUtf8, littleEndian } from "../BinaryArray.ts";

// https://github.com/KhronosGroup/glTF-Sample-Assets/blob/main/Models/Box/glTF-Binary/Box.glb
const BOX_FILE =
  "Z2xURgIAAACABgAA3AMAAEpTT057ImFzc2V0Ijp7ImdlbmVyYXRvciI6IkNPTExBREEyR0xURiIsInZlcnNpb24iOiIyLjAifSwic2NlbmUiOjAsInNjZW5lcyI6W3sibm9kZXMiOlswXX1dLCJub2RlcyI6W3siY2hpbGRyZW4iOlsxXSwibWF0cml4IjpbMS4wLDAuMCwwLjAsMC4wLDAuMCwwLjAsLTEuMCwwLjAsMC4wLDEuMCwwLjAsMC4wLDAuMCwwLjAsMC4wLDEuMF19LHsibWVzaCI6MH1dLCJtZXNoZXMiOlt7InByaW1pdGl2ZXMiOlt7ImF0dHJpYnV0ZXMiOnsiTk9STUFMIjoxLCJQT1NJVElPTiI6Mn0sImluZGljZXMiOjAsIm1vZGUiOjQsIm1hdGVyaWFsIjowfV0sIm5hbWUiOiJNZXNoIn1dLCJhY2Nlc3NvcnMiOlt7ImJ1ZmZlclZpZXciOjAsImJ5dGVPZmZzZXQiOjAsImNvbXBvbmVudFR5cGUiOjUxMjMsImNvdW50IjozNiwibWF4IjpbMjNdLCJtaW4iOlswXSwidHlwZSI6IlNDQUxBUiJ9LHsiYnVmZmVyVmlldyI6MSwiYnl0ZU9mZnNldCI6MCwiY29tcG9uZW50VHlwZSI6NTEyNiwiY291bnQiOjI0LCJtYXgiOlsxLjAsMS4wLDEuMF0sIm1pbiI6Wy0xLjAsLTEuMCwtMS4wXSwidHlwZSI6IlZFQzMifSx7ImJ1ZmZlclZpZXciOjEsImJ5dGVPZmZzZXQiOjI4OCwiY29tcG9uZW50VHlwZSI6NTEyNiwiY291bnQiOjI0LCJtYXgiOlswLjUsMC41LDAuNV0sIm1pbiI6Wy0wLjUsLTAuNSwtMC41XSwidHlwZSI6IlZFQzMifV0sIm1hdGVyaWFscyI6W3sicGJyTWV0YWxsaWNSb3VnaG5lc3MiOnsiYmFzZUNvbG9yRmFjdG9yIjpbMC44MDAwMDAwMTE5MjA5MjksMC4wLDAuMCwxLjBdLCJtZXRhbGxpY0ZhY3RvciI6MC4wfSwibmFtZSI6IlJlZCJ9XSwiYnVmZmVyVmlld3MiOlt7ImJ1ZmZlciI6MCwiYnl0ZU9mZnNldCI6NTc2LCJieXRlTGVuZ3RoIjo3MiwidGFyZ2V0IjozNDk2M30seyJidWZmZXIiOjAsImJ5dGVPZmZzZXQiOjAsImJ5dGVMZW5ndGgiOjU3NiwiYnl0ZVN0cmlkZSI6MTIsInRhcmdldCI6MzQ5NjJ9XSwiYnVmZmVycyI6W3siYnl0ZUxlbmd0aCI6NjQ4fV19iAIAAEJJTgAAAAAAAAAAAAAAgD8AAAAAAAAAAAAAgD8AAAAAAAAAAAAAgD8AAAAAAAAAAAAAgD8AAAAAAACAvwAAAAAAAAAAAACAvwAAAAAAAAAAAACAvwAAAAAAAAAAAACAvwAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAAAAAACAPwAAAAAAAAAAAACAPwAAAAAAAAAAAACAPwAAAAAAAAAAAACAPwAAAAAAAIC/AAAAAAAAAAAAAIC/AAAAAAAAAAAAAIC/AAAAAAAAAAAAAIC/AAAAAAAAAAAAAAAAAAAAAAAAgL8AAAAAAAAAAAAAgL8AAAAAAAAAAAAAgL8AAAAAAAAAAAAAgL8AAAC/AAAAvwAAAD8AAAA/AAAAvwAAAD8AAAC/AAAAPwAAAD8AAAA/AAAAPwAAAD8AAAA/AAAAvwAAAD8AAAC/AAAAvwAAAD8AAAA/AAAAvwAAAL8AAAC/AAAAvwAAAL8AAAA/AAAAPwAAAD8AAAA/AAAAvwAAAD8AAAA/AAAAPwAAAL8AAAA/AAAAvwAAAL8AAAC/AAAAPwAAAD8AAAA/AAAAPwAAAD8AAAC/AAAAPwAAAL8AAAA/AAAAPwAAAL8AAAC/AAAAvwAAAD8AAAC/AAAAPwAAAD8AAAC/AAAAvwAAAL8AAAC/AAAAPwAAAL8AAAC/AAAAvwAAAL8AAAC/AAAAPwAAAL8AAAA/AAAAvwAAAL8AAAA/AAAAPwAAAL8AAAEAAgADAAIAAQAEAAUABgAHAAYABQAIAAkACgALAAoACQAMAA0ADgAPAA4ADQAQABEAEgATABIAEQAUABUAFgAXABYAFQA=";

const BOX_FILE_JSON = {
  accessors: [
    {
      bufferView: 0,
      byteOffset: 0,
      componentType: 5123,
      count: 36,
      max: [23],
      min: [0],
      type: "SCALAR",
    },
    {
      bufferView: 1,
      byteOffset: 0,
      componentType: 5126,
      count: 24,
      max: [1, 1, 1],
      min: [-1, -1, -1],
      type: "VEC3",
    },
    {
      bufferView: 1,
      byteOffset: 288,
      componentType: 5126,
      count: 24,
      max: [0.5, 0.5, 0.5],
      min: [-0.5, -0.5, -0.5],
      type: "VEC3",
    },
  ],
  asset: { generator: "COLLADA2GLTF", version: "2.0" },
  bufferViews: [
    {
      buffer: 0,
      byteLength: 72,
      byteOffset: 576,
      target: 34963,
    },
    {
      buffer: 0,
      byteLength: 576,
      byteOffset: 0,
      byteStride: 12,
      target: 34962,
    },
  ],
  buffers: [{ byteLength: 648 }],
  materials: [
    {
      name: "Red",
      pbrMetallicRoughness: {
        baseColorFactor: [0.800000011920929, 0, 0, 1],
        metallicFactor: 0,
      },
    },
  ],
  meshes: [
    {
      name: "Mesh",
      primitives: [
        {
          attributes: { NORMAL: 1, POSITION: 2 },
          indices: 0,
          material: 0,
          mode: 4,
        },
      ],
    },
  ],
  nodes: [
    {
      children: [1],
      matrix: [1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    },
    { mesh: 0 },
  ],
  scene: 0,
  scenes: [{ nodes: [0] }],
};

test("Box file", () => {
  const binary = littleEndian();
  appendUtf8(binary, BOX_FILE);
  appendUint8Array(binary, readBase64(binary));

  expect(parseGLB(binary).asset).toEqual(BOX_FILE_JSON);
});
