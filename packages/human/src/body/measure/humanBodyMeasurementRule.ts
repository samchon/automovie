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
 */
export function humanBodyMeasurementRule(
  id: string,
): IAutoMovieHumanBodyMeasurement | undefined {
  return Object.hasOwn(HUMAN_BODY_MEASUREMENTS, id)
    ? HUMAN_BODY_MEASUREMENTS[id]
    : undefined;
}
