import { HUMAN_BODY_MEASUREMENTS } from "../constants/HUMAN_BODY_MEASUREMENTS";
import type { IAutoMovieHumanBodyMeasurement } from "../structures/IAutoMovieHumanBodyMeasurement";

/**
 * Find an authored body measurement rule by its channel id.
 *
 * The body editor, its inverse solver, and the simple tier all receive string
 * ids from a body basis or document. The rule table is an ordinary JavaScript
 * object, whose prototype also has names such as `constructor`. Only its own
 * entries describe anatomical instruments; inherited values must never turn
 * a morph channel into a metric control. This lookup reads the shared table
 * without changing it and returns undefined for every unmeasured id.
 *
 * @evidence contracts/common.md#principled-implementation Own-property lookup (Object.hasOwn) answers only authored entries, so inherited names such as constructor cannot turn a morph channel into a metric control; the table is read, never changed.
 * @evidence contracts/common.md#clear-and-simple-design A single guarded read of the shared rule table, which keeps the prototype check in one place for the editor, the inverse solver and the simple tier.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No id is special-cased; the guard excludes the whole class of inherited keys and the function names no measurement.
 * @evidence contracts/common.md#meaningful-documentation States why the guard exists, what callers pass, the read-only behavior and the undefined result for unmeasured ids.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines and consumes no channel trait; it maps a channel id to its optional measurement rule.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions It carries no value with a unit or frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part or joint.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rule table owns each instrument's definition and source; this lookup carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It converts no input; it only decides whether a channel id has a named measurement rule.
 */
export function humanBodyMeasurementRule(
  id: string,
): IAutoMovieHumanBodyMeasurement | undefined {
  return Object.hasOwn(HUMAN_BODY_MEASUREMENTS, id)
    ? HUMAN_BODY_MEASUREMENTS[id]
    : undefined;
}
