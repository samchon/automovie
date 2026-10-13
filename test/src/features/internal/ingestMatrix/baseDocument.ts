import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";

/**
 * Construct the smallest static mesh document with an independently sized FLOAT VEC3 payload.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
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
