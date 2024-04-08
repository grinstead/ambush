import { useContext } from "solid-js";
import { parseBase64 } from "../lib/Base64.ts";
import { Canvas, CanvasContext } from "../lib/Canvas.tsx";
import { BindGroup, RenderShader } from "../lib/Shader.tsx";
import { gltfFromFile, prepareGLTF } from "../lib/gltf/GLTF.ts";
import { GLTFAsset, GLTF_ACCESSOR_LENGTH } from "../lib/gltf/gltf_types.ts";
import { NUM_BYTES_FLOAT32 } from "../lib/BinaryArray.ts";

export default function App() {
  console.log("Rendering App");

  return (
    <Canvas width={512} height={512}>
      <MyTest />
    </Canvas>
  );
}

// https://github.com/KhronosGroup/glTF-Sample-Assets/blob/main/Models/TriangleWithoutIndices/glTF-Embedded/TriangleWithoutIndices.gltf
const TRIANGLE_WITHOUT_INDICES: GLTFAsset = {
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0 }],
  meshes: [
    {
      primitives: [{ attributes: { POSITION: 0 } }],
    },
  ],

  buffers: [{ byteLength: 36 }],
  bufferViews: [
    {
      buffer: 0,
      byteOffset: 0,
      byteLength: 36,
      target: 34962,
    },
  ],
  accessors: [
    {
      bufferView: 0,
      byteOffset: 0,
      componentType: 5126,
      count: 3,
      type: "VEC3",
      max: [1.0, 1.0, 0.0],
      min: [0.0, 0.0, 0.0],
    },
  ],

  asset: {
    version: "2.0",
  },
};

export function MyTest() {
  console.log("Rendering MyTest");

  const { device } = useContext(CanvasContext);

  const model = gltfFromFile({
    asset: TRIANGLE_WITHOUT_INDICES,
    bin: parseBase64("AAAAAAAAAAAAAAAAAACAPwAAAAAAAAAAAAAAAAAAgD8AAAAA"),
  });

  const gltf = model.attachTo(device);

  prepareGLTF(gltf);

  const MyTestShaderCode = `
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) fragUV: vec2f,
}

@vertex
fn vertex_main(@location(0) position: vec3f) -> VertexOutput {
  return VertexOutput(vec4f(position, 1.), saturate(position.xy));
}

@fragment
fn fragment_main(@location(0) fragUV: vec2f) -> @location(0) vec4f {
  return vec4f(0, fragUV.x, fragUV.y, 1);
}
  
  `;

  return (
    <RenderShader
      label="Test Shader"
      code={MyTestShaderCode}
      vertexMain="vertex_main"
      fragmentMain="fragment_main"
      buffers={[
        {
          arrayStride: GLTF_ACCESSOR_LENGTH.VEC3 * NUM_BYTES_FLOAT32,
          attributes: [
            {
              shaderLocation: 0,
              offset: 0,
              format: "float32x3",
            },
          ],
        },
      ]}
      draw={(run) => {
        run.setVertexBuffer(0, gltf._buffers![0]);
        run.draw(model.accessor(0).count);
      }}
    ></RenderShader>
  );
}
