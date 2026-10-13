import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { humanoidDocument } from "./humanoidDocument";
import { set } from "./set";

/**
 * Encode full FLOAT skin weights using independently computed three-vertex byte offsets.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
 */
export const floatWeightHumanoid: () => { document: ExternalModelMatrixObject; payload: Buffer } = (): { document: ExternalModelMatrixObject; payload: Buffer } => {
  const document: ExternalModelMatrixObject = humanoidDocument();
  document.buffers = [{ byteLength: 96, uri: "human.bin" }];
  document.bufferViews = [
    { buffer: 0, byteLength: 36 },
    { buffer: 0, byteOffset: 36, byteLength: 12 },
    { buffer: 0, byteOffset: 48, byteLength: 48 },
  ];
  set(document, ["accessors", 2, "componentType"], 5126);
  set(document, ["accessors", 2, "normalized"], false);
  const payload: Buffer = Buffer.alloc(96);
  for (let vertex: number = 0; vertex < 3; ++vertex)
    payload.writeFloatLE(1, 48 + vertex * 16);
  return { document, payload };
};
