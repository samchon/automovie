import type { IAutoMovieBuildProjectOutput, IAutoMovieDiagnostic } from "@automovie/interface";
import { fingerprintOf } from "./fingerprintOf";
import type { ISourceStatusState } from "./ISourceStatusState";

/**
 * Assemble one existing in-memory gate answer.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads revision and source identity from the supplied world state, copies the diagnostic population and returns the same empty materialized population; empty diagnostics alone select fixture success.
 * @evidence contracts/testing.md#independent-expectations Owning units provide literal failures and expected revision/source facts; this answer carrier is part of their arrangement, not independent proof of complete project validity.
 * @evidence contracts/testing.md#distinguishing-cases Success, invalid source, stale compile and tampered generated populations share the same answer shape; the actual retention owner separately decides reuse and protects returned answer copies.
 * @evidence contracts/testing.md#execution-ownership The supplied state is borrowed and diagnostics are copied into the returned answer; no state field is changed and no capability callback is executed here.
 */
export const answerOf: (state: ISourceStatusState, diagnostics: readonly IAutoMovieDiagnostic[]) => IAutoMovieBuildProjectOutput = (
  state: ISourceStatusState,
  diagnostics: readonly IAutoMovieDiagnostic[],
): IAutoMovieBuildProjectOutput => ({
  success: diagnostics.length === 0,
  revision: state.revision,
  builder: { version: "unit", inputFingerprint: fingerprintOf(state.source) },
  diagnostics: [...diagnostics],
  materialized: [],
});
