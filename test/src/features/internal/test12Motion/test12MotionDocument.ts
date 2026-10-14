/**
 * Return the existing three-node, three-sampler motion declaration with independently authored rest transforms and sample offsets.
 */
export function test12MotionDocument(): {
  asset: { version: string };
  buffers: { byteLength: number; uri: string }[];
  bufferViews: { buffer: number; byteOffset: number; byteLength: number }[];
  accessors: {
    bufferView: number;
    componentType: number;
    count: number;
    type: string;
  }[];
  nodes: (
    | {
        name: string;
        children: number[];
        translation?: undefined;
        rotation?: undefined;
        scale?: undefined;
      }
    | {
        name: string;
        children: number[];
        translation: number[];
        rotation: number[];
        scale: number[];
      }
    | {
        name: string;
        translation: number[];
        scale: number[];
        children?: undefined;
        rotation?: undefined;
      }
  )[];
  scenes: { nodes: number[] }[];
  animations: {
    name: string;
    samplers: (
      | { input: number; output: number; interpolation: string }
      | { input: number; output: number; interpolation?: undefined }
    )[];
    channels: { sampler: number; target: { node: number; path: string } }[];
  }[];
} {
  return {
    asset: { version: "2.0" },
    buffers: [{ byteLength: 168, uri: "walk.bin" }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 8 },
      { buffer: 0, byteOffset: 8, byteLength: 96 },
      { buffer: 0, byteOffset: 104, byteLength: 24 },
      { buffer: 0, byteOffset: 128, byteLength: 32 },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 2, type: "SCALAR" },
      { bufferView: 1, componentType: 5126, count: 6, type: "VEC4" },
      { bufferView: 2, componentType: 5126, count: 2, type: "VEC3" },
      { bufferView: 3, componentType: 5126, count: 2, type: "VEC4" },
    ],
    nodes: [
      { name: "Root", children: [1] },
      {
        name: "",
        children: [2],
        translation: [0, 0.25, 0],
        rotation: [0, 0, 1, 0],
        scale: [2, 2, 2],
      },
      {
        name: "Chest",
        translation: [0, 0.75, 0],
        scale: [0.5, 0.5, 0.5],
      },
    ],
    scenes: [{ nodes: [0] }],
    animations: [
      {
        name: "Walk",
        samplers: [
          { input: 0, output: 1, interpolation: "CUBICSPLINE" },
          { input: 0, output: 2, interpolation: "STEP" },
          { input: 0, output: 3 },
        ],
        channels: [
          { sampler: 0, target: { node: 0, path: "rotation" } },
          { sampler: 1, target: { node: 0, path: "translation" } },
          { sampler: 2, target: { node: 2, path: "rotation" } },
        ],
      },
    ],
  };
}
