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
 * @evidence contracts/common.md#principled-implementation Absolute reading errors are compared with each request's metre or kilogram budget on one evaluated body; null and nonfinite readings fail rather than becoming approximate success.
 * @evidence contracts/common.md#clear-and-simple-design This final assertion owns reporting all missed names; expansion and the coupled adapter retain iteration and reach selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The same predicate reads every supplied unknown, without consumer exceptions or altered anatomical envelopes.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies tolerance acceptance, shared-body measurement, named failure and unchanged shape ownership.
 * @evidence contracts/performance.md#efficient-algorithms One reader evaluates the shape once and U unknowns each read it once; geometry evaluation and each measurement dominate the O(U) result collection.
 * @evidence contracts/performance.md#reuse-equivalent-work All unknowns share the reader only for this exact basis and shape; no reading survives a later candidate.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The synchronous call owns its reader and at most U miss strings until return or throw; no handles, tasks or cross-call cache are retained.
 */
export function assertHumanBodySimpleValues(
  basis: IAutoMovieHumanBodyBasis,
  shape: Record<string, number>,
  unknowns: IHumanBodySimpleUnknown[],
): void {
  const reader: ReturnType<typeof createHumanBodyMeasurementReader> = createHumanBodyMeasurementReader(basis, shape);
  const misses: string[] = unknowns.flatMap((unknown: IHumanBodySimpleUnknown): string[] => {
    const value: number | null = unknown.read(reader, shape);
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
