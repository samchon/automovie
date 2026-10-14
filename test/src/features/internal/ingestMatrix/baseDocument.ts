import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";

/**
 * Construct a static mesh control document with an independently sized FLOAT VEC3 payload.
 */
export const baseDocument: () => ExternalModelMatrixObject = (): ExternalModelMatrixObject => ({
  asset: { version: "2.0" },
  buffers: [{ byteLength: 12, uri: "mesh.bin" }],
  bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 12 }],
  accessors: [{ bufferView: 0, componentType: 5126, count: 1, type: "VEC3" }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
  nodes: [{ mesh: 0 }],
  scenes: [{ nodes: [0] }],
});
