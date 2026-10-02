import { createHumanBodyMeasurementReader } from "../measure/createHumanBodyMeasurementReader";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IHumanBodySimpleUnknown } from "./IHumanBodySimpleUnknown";

/**
 * Refuse a solved body that misses a requested simple value by more than
 * that value's tolerance, naming each miss.
 *
 * Stature, mass and every tape are solved against one skin, and a request
 * whose values cannot hold together on the basis (a thigh, hips and waist of
 * a heavier body with the mass of a lighter one) has no body that meets them
 * all. The solves then stop at a compromise, and returning it would tell the
 * caller that a waist of 0.75 m was solved when the body reads 0.76. A miss
 * inside the tolerance is the solve's own residue and passes; a value the
 * skin cannot answer is a miss too. The shape is read once through one
 * measurement reader and is never changed.
 *
 * @evidence contracts/common.md#principled-implementation One reader fixes one candidate skin for every requested quantity; inclusive absolute-error checks preserve each row's measurement unit and collect every miss before throwing, including unavailable readings.
 * @evidence contracts/common.md#clear-and-simple-design One shared-body assertion owns the complete miss list, leaving iteration and individual measurement definitions to their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither targets nor weights are changed to hide a miss; each failure reports the actual named reading without person-specific exceptions.
 * @evidence contracts/common.md#meaningful-documentation States why simultaneous target checks are required, how tolerance and unreadable values behave, and the shared-reader/read-only boundary.
 * @evidence contracts/modeling.md#spatial-conventions Each error is in the same metre/kilogram unit as its target and tolerance; no body coordinate frame is converted.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It owns no part or group.
 * @evidence contracts/modeling.md#parameter-channels The candidate weight record is consumed through one shared-body reader using the basis's existing channels. Omitted weights use neutral zero; endpoint signs and explicit left/right identities remain the basis's definitions. This assertion changes no weight or pairing. Each requested quantity can depend on several weights, so every row reads the same candidate skin instead of assuming the readings vary independently. It verifies measurement budgets and not biological independence of the authored channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part or joint.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Physical measurement definitions belong to the rules supplied to the reader, not to this assertion.
 * @evidenceExclude contracts/anatomy.md#permitted-range These are numerical accuracy budgets over a solved body, not new physiological intervals.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The request list is derived internal solve state; this assertion defines no authored body control.
 */
export function assertHumanBodySimpleValues(
  basis: IAutoMovieHumanBodyBasis,
  shape: Record<string, number>,
  unknowns: IHumanBodySimpleUnknown[],
): void {
  const reader = createHumanBodyMeasurementReader(basis, shape);
  const misses = unknowns.flatMap((unknown) => {
    const value = unknown.read(reader);
    return value !== null && Math.abs(value - unknown.target) <= unknown.tolerance
      ? []
      : [
          `${unknown.name} ${unknown.target} reads ${
            value === null ? "nothing" : value.toFixed(4)
          }`,
        ];
  });
  if (misses.length > 0)
    throw new Error(
      `These simple values cannot hold together on this basis: ${misses.join(", ")}.`,
    );
}
