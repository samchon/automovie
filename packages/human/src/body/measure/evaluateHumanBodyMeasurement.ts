import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyMeasurement } from "../structures/IAutoMovieHumanBodyMeasurement";
import { createHumanBodyMeasurementReader } from "./createHumanBodyMeasurementReader";

/**
 * Evaluate one measurement on a freshly shaped rest body. The simple tier's
 * projection uses `createHumanBodyMeasurementReader` when it reads several
 * rules on exactly the same shape; an inverse trial is a new shape and uses
 * this direct entry.
 *
 * @evidence contracts/common.md#principled-implementation Building a reader over the exact shape and reading the one rule is by definition the value the builder's rest skin has; the rule decides the instrument and a null reading is passed through unchanged for an unanswerable instrument.
 * @evidence contracts/common.md#clear-and-simple-design A one-line entry over the shared reader for a shape that is read once, leaving the reader to own skin construction and caching.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No rule, shape or consumer is special-cased and no value is substituted for a null reading.
 * @evidence contracts/common.md#meaningful-documentation States when to use this entry instead of a shared reader, that each call shapes a new body, and the null result.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel; it reads a rule on the shape it is given.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry; the reader builds the rest skin.
 * @evidence contracts/modeling.md#spatial-conventions The shape is dimensionless channel weights and the result is the rule's metres on the rest skin; the reader owns that frame and this entry converts nothing.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no surface or boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part or joint.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rule and the reader own the anatomical definition; this entry carries no value.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It converts no simple input to a detailed one; it reads one named measurement on a shape.
 */
export function evaluateHumanBodyMeasurement(
  basis: IAutoMovieHumanBodyBasis,
  shape: Record<string, number>,
  rule: IAutoMovieHumanBodyMeasurement,
): number | null {
  return createHumanBodyMeasurementReader(basis, shape).read(rule);
}
