import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { floatWeightHumanoid } from "./floatWeightHumanoid";
import { set } from "./set";

/**
 * Preserve valid FLOAT weights while toggling accessor normalization metadata.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
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
