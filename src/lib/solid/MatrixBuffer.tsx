import { childrenArray } from "../solid_utils.tsx";
import { UniformBuffer } from "./UniformBuffer.tsx";

/**
 * Props for the UniformMatrix4x4Props component.
 */
export type UniformMatrix4x4Props = {
  /** Optional label for the uniform buffer. */
  label?: string;
  /** Optional usage hint for the uniform buffer, defaults to `GPUBufferUsage.UNIFORM` */
  usage?: number;
  /**  Specifies if the matrix is in row-major order. Defaults to column-major order. */
  rowMajor?: boolean;
  /** The matrix elements in the order specified. */
  // prettier-ignore
  children: Array<number> | [
    number, string, number, string, number, string, number,
    number, string, number, string, number, string, number,
    number, string, number, string, number, string, number,
    number, string, number, string, number, string, number,
  ];
};

/**
 * Component to define a 4x4 matrix for computer graphics.
 *
 * The component expects 16 children, representing the elements of the matrix.
 * By default, the matrix is in column-major order. Set the `rowMajor` prop to
 * `true` for row-major order, in which case the component will transpose them
 * to column major before sending it down to the shader.
 *
 * It will encode the values as float32
 *
 * @component
 * @example
 * <Matrix4x4>
 *   {x} {0} {0} {0}
 *   {0} {y} {0} {0}
 *   {0} {0} {z} {0}
 *   {0} {0} {0} {1}
 * </Matrix4x4>
 *
 * @param props - The properties for the Matrix4x4 component.
 * @returns The {@link UniformBuffer} component with the matrix data.
 */
export function Matrix4x4(props: UniformMatrix4x4Props) {
  const getChildren = childrenArray<string | number>(props);

  const getBytes = () => {
    const floats = new Float32Array(16);

    const values = getChildren().filter(
      (x) => typeof x === "number"
    ) as Array<number>;

    const rowMajor = !!props.rowMajor;
    for (let i = 0, col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++, i++) {
        floats[rowMajor ? row * 4 + col : i] = values[i];
      }
    }

    return floats;
  };

  return (
    <UniformBuffer label={props.label} usage={props.usage} bytes={getBytes()} />
  );
}
