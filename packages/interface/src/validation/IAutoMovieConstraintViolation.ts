import { AutoMovieViolationKind } from "./AutoMovieViolationKind";

/**
 * One deterministic constraint violation: the unit of feedback a direct authoring caller or build boundary turns into a located correction.
 *
 * Engine verifiers report rule kind, severity, offending JSON path, expected condition and observed value. Direct callers receive these records; a build boundary may project them into its own diagnostic schema rather than preserving object identity or every field. The record supplies located correction data and does not write annotations into authored source.
 *
 * @evidence contracts/common.md#principled-implementation violation and ViolationCollector retain the failed rule category, severity, located path and observed value; toValidation treats any error as failure and preserves warnings alongside errors.
 * @evidence contracts/common.md#clear-and-simple-design One data record supports direct and build callers; optional magnitude and script-node location add context without separate feedback subclasses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Severity is the producer's explicit classification, not inferred from numeric size. A warning remains observable but does not independently fail the canonical validation envelope.
 * @evidence contracts/common.md#meaningful-documentation Fields distinguish classification, binding severity, path, expected rule, original unknown value and optional channel-unit overshoot or screenplay location.
 * @author Samchon
 */
export interface IAutoMovieConstraintViolation {
  /** Which tier/category failed; routes the correction. */
  kind: AutoMovieViolationKind;

  /**
   * How binding this feedback is. `"error"` is a rig/render-integrity breach (a disconnected skeleton, a non-finite quaternion, a negative duration, an out-of-range coefficient) and fails validation. `"warning"` is physical-plausibility advice (a body that would topple, an unsupported mass that would fall): recommended, not forbidden, because a film may be deliberately unphysical. A `"warning"` never fails validation on its own; it rides the same envelope so the build can surface it and the author (or an action's `physicsIntent` marker) can accept or dismiss it. `"warning"` is the builder's word for this level, not "advisory".
   */
  severity: "error" | "warning";

  /**
   * JSON path to the offending value, in typia's `$input...` notation (e.g. `$input.joints[3].flexion`). A caller uses it to locate the correction; this record writes no source comment.
   */
  path: string;

  /**
   * Human / LLM readable statement of what was required, precise enough to act on (e.g. `"leftLowerArm flexion must be within [0, 150]° (anatomical ROM), but was 175"`).
   */
  expected: string;

  /**
   * The observed offending value, retained without coercion. `unknown` permits malformed values at any field type; downstream diagnostic projection need not retain it.
   */
  value: unknown;

  /**
   * Signed magnitude by which the value missed the bound, in the channel's own unit (degrees for ROM): an elbow at 175° against a 150° maximum yields `25`. Present only when the producer supplies a numeric overshoot, otherwise absent; magnitude does not determine severity.
   */
  overshoot?: number;

  /**
   * Id of the screenplay refinement-graph node ({@link IAutoMovieScriptNode}) this feedback locates on, usually the beat node whose work produced it. With the node in hand, `scriptAncestors` walks the refinement chain up (beat → scene → act → intent), so a physics warning can cascade past the motion into the screenplay itself: the correction may target the pose, the beat's staging, or the scene's intent; the agent decides which level to fix. Absent when no screenplay tree exists or the feedback is not beat-scoped.
   */
  node?: string;
}
