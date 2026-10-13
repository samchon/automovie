import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";

/**
 * Declare three vertices with independently sized POSITION, JOINTS_0 and normalized WEIGHTS_0 views.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
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
