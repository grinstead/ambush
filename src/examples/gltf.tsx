import { useContext } from "solid-js";
import { parseBase64 } from "../lib/Base64.ts";
import { Canvas, CanvasContext } from "../lib/Canvas.tsx";
import { BindGroup, RenderShader } from "../lib/Shader.tsx";
import { gltfFromFile } from "../lib/gltf/GLTF.ts";
import { GLTFAsset } from "../lib/gltf/gltf_types.ts";
import { UniformBuffer } from "../lib/solid/UniformBuffer.tsx";

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
  scenes: [
    {
      nodes: [0],
    },
  ],

  nodes: [
    {
      mesh: 0,
    },
  ],

  meshes: [
    {
      primitives: [
        {
          attributes: {
            POSITION: 0,
          },
        },
      ],
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

  const gltf = gltfFromFile({
    asset: TRIANGLE_WITHOUT_INDICES,
    bin: parseBase64("AAAAAAAAAAAAAAAAAACAPwAAAAAAAAAAAAAAAAAAgD8AAAAA"),
  });

  const { device } = useContext(CanvasContext);

  const MyTestShaderCode = `

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) fragUV: vec2f,
}

@vertex
fn vertex_main(@builtin(vertex_index) index: u32) -> VertexOutput {
  const fragPoints = array(
    vec2f(0, 0),
    vec2f(1, 0),
    vec2f(0, 1),
    vec2f(1, 1),
  );

  let uv = fragPoints[index];

  return VertexOutput(
    vec4f(2 * uv - 1, 0, 1),
    uv,
  );
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
      draw={(run) => run.draw(4)}
    >
      <BindGroup>
        <UniformBuffer label="triangle_data" bytes={gltf.bin!} />
      </BindGroup>
    </RenderShader>
  );
}
