import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { humanoidDocument } from "./humanoidDocument";
import { set } from "./set";

/**
 * Encode full FLOAT skin weights using independently computed three-vertex byte offsets.
 */
export const floatWeightHumanoid: () => {
  document: ExternalModelMatrixObject;
  payload: Buffer;
} = (): { document: ExternalModelMatrixObject; payload: Buffer } => {
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
