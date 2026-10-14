import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { humanoidDocument } from "./humanoidDocument";
import { set } from "./set";

/**
 * Encode full unsigned-short skin weights and their independently computed view extents.
 */
export const unsignedShortHumanoid: () => { document: ExternalModelMatrixObject; payload: Buffer } = (): { document: ExternalModelMatrixObject; payload: Buffer } => {
  const document: ExternalModelMatrixObject = humanoidDocument();
  document.buffers = [{ byteLength: 84, uri: "human.bin" }];
  document.bufferViews = [
    { buffer: 0, byteLength: 36 },
    { buffer: 0, byteOffset: 36, byteLength: 24 },
    { buffer: 0, byteOffset: 60, byteLength: 24 },
  ];
  set(document, ["accessors", 1, "componentType"], 5123);
  set(document, ["accessors", 2, "componentType"], 5123);
  const payload: Buffer = Buffer.alloc(84);
  for (let vertex: number = 0; vertex < 3; ++vertex)
    payload.writeUInt16LE(65535, 60 + vertex * 8);
  return { document, payload };
};
