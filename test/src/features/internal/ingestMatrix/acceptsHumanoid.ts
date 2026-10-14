import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { inspect } from "./inspect";

/**
 * Exercise humanoid inspection over one independently encoded document/payload pair.
 */
export const acceptsHumanoid: (fixture: {
  document: ExternalModelMatrixObject;
  payload: Buffer;
}) => boolean = (fixture: {
  document: ExternalModelMatrixObject;
  payload: Buffer;
}): boolean => {
  inspect(fixture.document, "gltf-humanoid-v1", (uri: string): Uint8Array | null =>
    uri === "human.bin" ? fixture.payload : null,
  );
  return true;
};
