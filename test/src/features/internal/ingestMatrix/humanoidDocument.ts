import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";

/**
 * Declare three vertices with independently sized POSITION, JOINTS_0 and normalized WEIGHTS_0 views.
 */
export const humanoidDocument: () => ExternalModelMatrixObject = (): ExternalModelMatrixObject => ({
  asset: { version: "2.0" },
  buffers: [{ byteLength: 60, uri: "human.bin" }],
  bufferViews: [
    { buffer: 0, byteOffset: 0, byteLength: 36 },
    { buffer: 0, byteOffset: 36, byteLength: 12 },
    { buffer: 0, byteOffset: 48, byteLength: 12 },
  ],
  accessors: [
    { bufferView: 0, componentType: 5126, count: 3, type: "VEC3" },
    { bufferView: 1, componentType: 5121, count: 3, type: "VEC4" },
    {
      bufferView: 2,
      componentType: 5121,
      normalized: true,
      count: 3,
      type: "VEC4",
    },
  ],
  meshes: [
    {
      primitives: [{ attributes: { POSITION: 0, JOINTS_0: 1, WEIGHTS_0: 2 } }],
    },
  ],
  nodes: [{ mesh: 0, skin: 0 }, { name: "Hips" }],
  skins: [{ joints: [1] }],
  scenes: [{ nodes: [0, 1] }],
});
