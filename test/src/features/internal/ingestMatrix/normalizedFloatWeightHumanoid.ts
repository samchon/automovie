import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { floatWeightHumanoid } from "./floatWeightHumanoid";
import { set } from "./set";

/**
 * Preserve valid FLOAT weights while toggling accessor normalization metadata.
 */
export const normalizedFloatWeightHumanoid: () => {
  document: ExternalModelMatrixObject;
  payload: Buffer;
} = (): {
  document: ExternalModelMatrixObject;
  payload: Buffer;
} => {
  const fixture: { document: ExternalModelMatrixObject; payload: Buffer } = floatWeightHumanoid();
  set(fixture.document, ["accessors", 2, "normalized"], true);
  return fixture;
};
