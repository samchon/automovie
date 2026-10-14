import { HUMAN_BODY_MEASUREMENTS } from "../constants/HUMAN_BODY_MEASUREMENTS";
import type { IAutoMovieHumanBodyMeasurement } from "../structures/IAutoMovieHumanBodyMeasurement";

/**
 * Find an authored body measurement rule by its channel id.
 *
 * Editors, inverse solvers and the simple tier receive string IDs from a basis/document. Only own entries of HUMAN_BODY_MEASUREMENTS name instruments; inherited object members such as constructor are not morph-channel metrics. This lookup returns a borrowed rule or undefined without changing the table; rule presence does not establish current-basis measurement availability.
 *
 * @evidence contracts/common.md#principled-implementation Object.hasOwn gates the shared measurement table lookup so only authored own-ID instruments resolve.
 * @evidence contracts/common.md#clear-and-simple-design One optional lookup serves editor, inverse and simple-tier consumers without copying the rule table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown and inherited property IDs stay unmeasured rather than becoming metric controls or fallback anatomy.
 * @evidence contracts/common.md#meaningful-documentation The prose states borrowed result ownership, undefined absence and the difference between an authored instrument and measurable current geometry.
 * @evidence contracts/performance.md#efficient-algorithms One own-key check and table access use constant expected lookup work without source geometry traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Consumers share the existing table record and this own-ID policy rather than maintaining secondary rule copies.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No collection or cache is allocated; the caller borrows an existing rule and the function retains no source or task.
 */
export function humanBodyMeasurementRule(
  id: string,
): IAutoMovieHumanBodyMeasurement | undefined {
  return Object.hasOwn(HUMAN_BODY_MEASUREMENTS, id)
    ? HUMAN_BODY_MEASUREMENTS[id]
    : undefined;
}
