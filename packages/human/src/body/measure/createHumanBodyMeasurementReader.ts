import { evaluateHumanBodyShape } from "../basis/evaluateHumanBodyShape";
import { humanBodyBasisWeights } from "../basis/humanBodyBasisWeights";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyMeasurement } from "../structures/IAutoMovieHumanBodyMeasurement";
import { readHumanBodyShapedMeasurement } from "./readHumanBodyShapedMeasurement";

/**
 * Compile one rest body for several measurement rules. Its shaped skin and
 * landmarks are owned by this reader; callers treat them as read-only. Every
 * reading observes that same numerical body. A different trial shape needs a
 * new reader, so mass, stature and tape reports cannot silently mix candidate
 * geometries.
 *
 * A rule with several stations shares one normal, so each surface is indexed
 * once for all its stations (`indexHumanBodySectionTriangles`) and every cut
 * reads only the triangles near its plane; the readings equal those of a
 * full walk of each station.
 */
export function createHumanBodyMeasurementReader(
  basis: IAutoMovieHumanBodyBasis,
  shape: Record<string, number>,
): {
  shaped: ReturnType<typeof evaluateHumanBodyShape>;
  read: (rule: IAutoMovieHumanBodyMeasurement) => number | null;
} {
  const shaped = evaluateHumanBodyShape(
    basis,
    humanBodyBasisWeights(basis, { shape }),
  );
  return {
    shaped,
    read: (rule) => readHumanBodyShapedMeasurement(basis, shaped, rule),
  };
}
