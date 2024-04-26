export type GLTFTarget = number;
export const GLTF_ARRAY_BUFFER = 34962;
export const GLTF_ELEMENT_ARRAY_BUFFER = 34963;

export const GLTF_ACCESSOR_INT8 = 5120;
export const GLTF_ACCESSOR_UINT8 = 5121;
export const GLTF_ACCESSOR_INT16 = 5122;
export const GLTF_ACCESSOR_UINT16 = 5123;
export const GLTF_ACCESSOR_UINT32 = 5125;
/** values of NaN, +Infinity, -Infinity MUST NOT be present. */
export const GLTF_ACCESSOR_F32 = 5126;

export type GltfAccessorType =
  | typeof GLTF_ACCESSOR_INT8
  | typeof GLTF_ACCESSOR_UINT8
  | typeof GLTF_ACCESSOR_INT16
  | typeof GLTF_ACCESSOR_UINT16
  | typeof GLTF_ACCESSOR_UINT32
  | typeof GLTF_ACCESSOR_F32;

export const GLTF_ACCESSOR_LENGTH = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
};

export type GltfAccessorElementType = keyof typeof GLTF_ACCESSOR_LENGTH;

export type GLTFVersion = string;

export type GLTFAssetMetaData = {
  /**
   * specifies the target glTF version of the asset
   */
  version: GLTFVersion;
  /**
   *  The minVersion property allows asset creators to specify a minimum
   *  version that a client implementation MUST support in order to load the
   *  asset. This is very similar to the extensionsRequired concept described
   *  in Section 3.12, where an asset SHOULD NOT be loaded if the client does
   *  not support the specified extension
   */
  minVersion?: GLTFVersion;

  // optional, unspecified additional properties

  generator?: string;
  copyright?: string;
};

/**
 * The URI to binary data.
 *
 * Buffer data MAY alternatively be embedded in the glTF file via data: URI
 * with base64 encoding. When data: URI is used for buffer storage, its
 * mediatype field MUST be set to application/octet-stream or
 * application/gltf-buffer.
 */
export type GLTFUri = string;

/**
 * A symbol used to craft opaque types in typescript, only used to help the type
 * system.
 */
const GLTFIndexInto = Symbol("GLTFIndexInto");

/**
 * Entities of a glTF asset are referenced by their indices in corresponding
 * arrays, e.g., a bufferView refers to a buffer by specifying the buffer’s
 * index in buffers array.
 *
 * Indices MUST be non-negative integer numbers. Indices MUST always point to
 * existing elements.
 *
 * Whereas indices are used for internal glTF references, optional names are
 * used for application-specific uses such as display. Any top-level glTF object
 * MAY have a name string property for this purpose. These property values are
 * not guaranteed to be unique as they are intended to contain values created
 * when the asset was authored.
 *
 * For property names, glTF usually uses camel case, likeThis.
 */
export type GLTFIndex<Prop extends keyof GLTFAsset> =
  | number
  | { [GLTFIndexInto]: Prop };

export type GLTFDescriptor = {
  /** The user-defined name of this object. */
  name?: string;
};

/**
 * A buffer is arbitrary data stored as a binary blob. The buffer MAY contain
 * any combination of geometry, animation, skins, and images.
 *
 * Binary blobs allow efficient creation of GPU buffers and textures since they
 * require no additional parsing, except perhaps decompression.
 *
 * glTF assets MAY have any number of buffer resources. Buffers are defined in
 * the {@link GLTFAsset} buffers array.
 *
 * While there’s no hard upper limit on buffer’s size, glTF assets SHOULD NOT
 * use buffers bigger than 253 bytes because some JSON parsers may be unable to
 * parse their byteLength correctly. Buffers stored as GLB binary chunk have an
 * implicit limit of 232-1 bytes.
 *
 * All buffer data defined in this specification (i.e., geometry attributes,
 * geometry indices, sparse accessor data, animation inputs and outputs, inverse
 * bind matrices) MUST use little endian byte order.
 */
export type GLTFBuffer = GLTFDescriptor & {
  /**
   * The byteLength property specifies the size of the buffer file.
   *
   * The byte length of the referenced resource MUST be greater than or equal to
   * the buffer.byteLength property.
   */
  byteLength: number;

  /**
   * The uri property is the URI to the buffer data.
   *
   * Buffer data MAY alternatively be embedded in the glTF file via data: URI
   * with base64 encoding. When data: URI is used for buffer storage, its
   * mediatype field MUST be set to application/octet-stream or
   * application/gltf-buffer.
   *
   * The glTF asset MAY use the GLB file container to pack glTF JSON and one
   * glTF buffer into one file. Data for such a buffer is provided via the
   * GLB-stored BIN chunk.
   *
   * A buffer with data provided by the GLB-stored BIN chunk, MUST be the first
   * element of buffers array and it MUST have its buffer.uri property
   * undefined. When such a buffer exists, a BIN chunk MUST be present.
   *
   * Any glTF buffer with undefined buffer.uri property that is not the first
   * element of buffers array does not refer to the GLB-stored BIN chunk, and
   * the behavior of such buffers is left undefined to accommodate future
   * extensions and specification versions.
   *
   * The byte length of the BIN chunk MAY be up to 3 bytes bigger than
   * JSON-defined buffer.byteLength value to satisfy GLB padding requirements.
   */
  uri?: GLTFUri;
};

/**
 * A buffer view represents a contiguous segment of data in a buffer, defined by
 * a byte offset into the buffer specified in the byteOffset property and a
 * total byte length specified by the byteLength property of the buffer view.
 *
 * Buffer views used for images, vertex indices, vertex attributes, or inverse
 * bind matrices MUST contain only one kind of data, i.e., the same buffer view
 * MUST NOT be used both for vertex indices and vertex attributes.
 *
 * When a buffer view is used by vertex indices or attribute accessors it SHOULD
 * specify bufferView.target with a value of element array buffer or array
 * buffer respectively.
 *
 * When a buffer view is used by vertex indices or attribute accessors it SHOULD
 * specify bufferView.target with a value of element array buffer or array
 * buffer respectively. This allows client implementations to early designate
 * each buffer view to a proper processing step, e.g, buffer views with vertex
 * indices and attributes would be copied to the appropriate GPU buffers, while
 * buffer views with image data would be passed to format-specific image
 * decoders.
 *
 * Buffers and buffer views do not contain type information. They simply define
 * the raw data for retrieval from the file. Objects within the glTF asset
 * (meshes, skins, animations) access buffers or buffer views via accessors.
 */
export type GLTFBufferView = GLTFDescriptor & {
  buffer: GLTFIndex<"buffers">;
  /**
   * The length of the bufferView in bytes.
   */
  byteLength: number;
  /**
   * The offset into the buffer in bytes.
   */
  byteOffset?: number;
  /**
   * The stride, in bytes.
   *
   * When a buffer view is used for vertex attribute data, it MAY have a
   * byteStride property. This property defines the stride in bytes between each
   * vertex. Buffer views with other types of data MUST NOT not define
   * byteStride (unless such layout is explicitly enabled by an extension).
   */
  byteStride?: number;

  /**
   * The hint representing the intended GPU buffer type to use with this buffer
   * view.
   */
  target?: GLTFTarget;

  /**
   * JSON object with extension-specific objects.
   */
  extensions?: Record<string, unknown>;

  /**
   * Application-specific data.
   *
   * Although extras MAY have any type, it is common for applications to store
   * and access custom data as key/value pairs. Therefore, extras SHOULD be a
   * JSON object rather than a primitive value for best portability.
   */
  extras?: unknown;
};

/**
 * (TODO) unfinished
 *
 * Sparse encoding of arrays is often more memory-efficient than dense encoding
 * when describing incremental changes with respect to a reference array. This
 * is often the case when encoding morph targets (it is, in general, more
 * efficient to describe a few displaced vertices in a morph target than
 * transmitting all morph target vertices).
 *
 * Similar to a standard accessor, a sparse accessor initializes an array of
 * typed elements from data stored in a bufferView. When accessor.bufferView is
 * undefined, the sparse accessor is initialized as an array of zeros of size
 * (size of the accessor element) * (accessor.count) bytes.
 *
 * On top of that, a sparse accessor includes a sparse JSON object describing
 * the elements that are different from their initialization values.
 */
export type GLTFSparseAccessor = {
  /**
   * number of displaced elements. This number MUST NOT be greater than the
   * number of the base accessor elements.
   */
  count: number;

  // indices:
};

/**
 * All binary data for meshes, skins, and animations is stored in buffers and
 * retrieved via accessors.
 *
 * An accessor defines a method for retrieving data as typed arrays from within
 * a buffer view. The accessor specifies a component type (e.g., float) and a
 * data type (e.g., VEC3 for 3D vectors), which when combined define the
 * complete data type for each data element. The number of elements is specified
 * using the count property. Elements could be, e.g., vertex indices, vertex
 * attributes, animation keyframes, etc.
 *
 * All accessors are stored in the asset’s accessors array.
 */
export type GLTFAccessor = {
  bufferView?: GLTFIndex<"bufferViews">;

  /**
   * All binary data for meshes, skins, and animations is stored in buffers and
   * retrieved via accessors.
   *
   * An accessor defines a method for retrieving data as typed arrays from
   * within a buffer view. The accessor specifies a component type (e.g., float)
   * and a data type (e.g., VEC3 for 3D vectors), which when combined define the
   * complete data type for each data element. The number of elements is
   * specified using the count property. Elements could be, e.g., vertex
   * indices, vertex attributes, animation keyframes, etc.
   */
  byteOffset?: number;

  /**
   * The datatype of the accessor's components.  UNSIGNED_INT type **MUST NOT**
   * be used for any accessor that is not referenced by
   * `mesh.primitive.indices`.
   *
   * `type` parameter of `vertexAttribPointer()`.  The corresponding typed
   * arrays are `Int8Array`, `Uint8Array`, `Int16Array`, `Uint16Array`,
   * `Uint32Array`, and `Float32Array`.
   */
  componentType: GltfAccessorType;

  /**
   * Specifies whether integer data values are normalized (`true`) to [0, 1]
   * (for unsigned types) or to [-1, 1] (for signed types) when they are
   * accessed. This property **MUST NOT** be set to `true` for accessors with
   * `FLOAT` or `UNSIGNED_INT` component type.
   *
   * `normalized` parameter of `vertexAttribPointer()`
   */
  normalized?: boolean;

  /**
   * The number of elements referenced by this accessor, not to be confused with
   * the number of bytes or number of components.
   *
   * MUST be a positive integer
   */
  count: number;

  /**
   *
   */
  type: GltfAccessorElementType;

  /**
   * accessor.min and accessor.max properties are arrays that contain
   * per-component minimum and maximum values, respectively. The length of these
   * arrays MUST be equal to the number of accessor’s components.
   *
   * Values stored in glTF JSON MUST match actual minimum and maximum binary
   * values stored in buffers. The accessor.normalized flag has no effect on
   * these properties.
   *
   * A sparse accessor min and max properties correspond, respectively, to the
   * minimum and maximum component values once the sparse substitution is
   * applied.
   *
   * When neither sparse nor bufferView is defined, min and max properties MAY
   * have any values. This is intended for use cases when binary data is
   * supplied by external means (e.g., via extensions).
   *
   * For floating-point components, JSON-stored minimum and maximum values
   * represent single precision floats and SHOULD be rounded to single precision
   * before usage to avoid any potential boundary mismatches.
   *
   * Animation input and vertex position attribute accessors MUST have
   * accessor.min and accessor.max defined. For all other accessors, these
   * properties are optional.
   */
  max?: Array<number>;
  min?: Array<number>;
};

export type GLTFScene = {
  name?: string;

  /**
   *  All nodes listed in scene.nodes array MUST be root nodes, i.e., they MUST
   *  NOT be listed in a node.children array of any node. The same root node MAY
   *  appear in multiple scenes.
   */
  nodes: Array<GLTFIndex<"nodes">>;
};

/**
 * glTF uses a right-handed coordinate system. glTF defines +Y as up, +Z as
 * forward, and -X as right; the front of a glTF asset faces +Z.
 *
 * The units for all linear distances are meters.
 */
export type GLTFVector = [number, number, number];

/**
 * XYZW, in the local coordinate system, where W is the scalar.
 */
export type GLTFQuarternion = [number, number, number, number];

/**
 * Any node MAY define a local space transform either by supplying a matrix
 * property, or any of translation, rotation, and scale properties (also known
 * as TRS properties). translation and scale are 3D vectors in the local
 * coordinate system. rotation is a unit quaternion value, XYZW, in the local
 * coordinate system, where W is the scalar.
 *
 * When a node is targeted for animation (referenced by an
 * animation.channel.target), only TRS properties MAY be present; matrix MUST
 * NOT be present.
 *
 * To compose the local transformation matrix, TRS properties MUST be converted
 * to matrices and postmultiplied in the T * R * S order; first the scale is
 * applied to the vertices, then the rotation, and then the translation.
 *
 * Non-invertible transforms (e.g., scaling one axis to zero) could lead to
 * lighting and/or visibility artifacts.
 *
 * When the scale is zero on all three axes (by node transform or by animated
 * scale), implementations are free to optimize away rendering of the node’s
 * mesh, and all of the node’s children’s meshes. This provides a mechanism to
 * animate visibility. Skinned meshes must not use this optimization unless all
 * of the joints in the skin are scaled to zero simultaneously.
 */
export type GLTFTransRotScale = {
  translation?: GLTFVector;
  scale?: GLTFVector;
  /**
   * rotation is a unit quaternion value, XYZW, in the local coordinate system,
   * where W is the scalar.
   */
  rotation?: GLTFQuarternion;
};

export type GLTFApplicationSpecificAttribute = `_${string}`;

export type GLTFStandardAttribute =
  | "POSITION"
  | "NORMAL"
  | "TANGENT"
  | `TEXCOORD_${number}`
  | `COLOR_${number}`
  | `JOINTS_${number}`
  | `WEIGHTS_${number}`;

export type GLTFAttribute =
  | GLTFStandardAttribute
  | GLTFApplicationSpecificAttribute;

export type GLTFMeshPrimitive<
  Attribute extends GLTFAttribute = GLTFStandardAttribute
> = {
  attributes: { [A in Attribute]?: GLTFIndex<"accessors"> };
};

export type GLTFMesh = {
  primitives?: Array<GLTFMeshPrimitive>;
};

export type GLTFNode = GLTFTransRotScale & {
  name?: string;
  children?: Array<GLTFIndex<"nodes">>;

  /**
   * Any node MAY define a local space transform either by supplying a matrix
   * property, or any of translation, rotation, and scale properties (also known
   * as TRS properties).
   *
   * Transformation matrices cannot skew or shear.
   *
   * When a node is targeted for animation (referenced by an
   * animation.channel.target), only TRS properties MAY be present; matrix MUST
   * NOT be present.
   *
   * The global transformation matrix of a node is the product of the global
   * transformation matrix of its parent node and its own local transformation
   * matrix. When the node has no parent node, its global transformation matrix
   * is identical to its local transformation matrix.
   */
  matrix?: Array<number>;

  /**
   * Any node MAY contain one mesh, defined in its mesh property. The mesh MAY
   * be skinned using information provided in a referenced skin object. The mesh
   * MAY have morph targets.
   */
  mesh?: GLTFIndex<"meshes">;
};

/**
 * When a node is targeted for animation (referenced by an
 * animation.channel.target), only translation, rotation, and scale properties
 * MAY be present; matrix MUST NOT be present.
 */
export type GLTFAnimationTargetNode = GLTFNode & { matrix?: undefined };

export type GLTFAsset = {
  asset: GLTFAssetMetaData;
  accessors?: Array<GLTFAccessor>;
  buffers?: Array<GLTFBuffer>;
  bufferViews?: Array<GLTFBufferView>;

  /**
   * Meshes are defined as arrays of primitives. Primitives correspond to the
   * data required for GPU draw calls. Primitives specify one or more
   * attributes, corresponding to the vertex attributes used in the draw calls.
   * Indexed primitives also define an indices property. Attributes and indices
   * are defined as references to accessors containing corresponding data. Each
   * primitive MAY also specify a material and a mode that corresponds to the
   * GPU topology type (e.g., triangle set).
   */
  meshes?: Array<GLTFMesh>;

  /**
   * glTF assets MAY define nodes, that is, the objects comprising the scene to
   * render.
   *
   * Nodes MAY have transform properties, as described later.
   *
   * Nodes are organized in a parent-child hierarchy known informally as the
   * node hierarchy. A node is called a root node when it doesn’t have a
   * parent.
   *
   * The node hierarchy MUST be a set of disjoint strict trees. That is node
   * hierarchy MUST NOT contain cycles and each node MUST have zero or one
   * parent node.
   *
   * The node hierarchy is defined using a node’s children property, as in the
   * following example:
   *
   *    {
   *        "nodes": [
   *            {
   *                "name": "Car",
   *                "children": [1, 2, 3, 4]
   *            },
   *            {
   *                "name": "wheel_1"
   *            },
   *            {
   *                "name": "wheel_2"
   *            },
   *            {
   *                "name": "wheel_3"
   *            },
   *            {
   *                "name": "wheel_4"
   *            }
   *        ]
   *    }
   *
   * The node named Car has four children. Each of those nodes could in turn
   * have its own children, creating a hierarchy of nodes.
   */
  nodes?: Array<GLTFNode>;
  /**
   * glTF 2.0 assets MAY contain zero or more scenes, the set of visual objects
   * to render. Scenes are defined in a scenes array.
   *
   * A glTF asset that does not contain any scenes SHOULD be treated as a
   * library of individual entities such as materials or meshes.
   */
  scenes?: Array<GLTFScene>;
  /**
   * An additional root-level property, scene (note singular), identifies which
   * of the scenes in the array SHOULD be displayed at load time. When scene is
   * undefined, client implementations MAY delay rendering until a particular
   * scene is requested.
   */
  scene?: GLTFIndex<"scenes">;
};
