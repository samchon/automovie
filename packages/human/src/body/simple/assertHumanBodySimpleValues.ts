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
 */
export function assertHumanBodySimpleValues(
  basis: IAutoMovieHumanBodyBasis,
  shape: Record<string, number>,
  unknowns: IHumanBodySimpleUnknown[],
): void {
  const reader = createHumanBodyMeasurementReader(basis, shape);
  const misses = unknowns.flatMap((unknown) => {
    const value = unknown.read(reader, shape);
    return value !== null &&
      Math.abs(value - unknown.target) <= unknown.tolerance
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
