import { seededValue } from "@automovie/engine";

/**
 * Prepare the Gaussian dimple centres consumed by the skin detail texture.
 * The caller supplies its table's follicular density per square centimetre,
 * tile side in millimetres and deterministic seed; none is mutated or fitted.
 * This sampler establishes a representation, not a physiological density range.
 * The table owner carries the measurement conditions and their limitations.
 *
 * The tile area is (side / 10)^2 cm². Its nearest integer population has an
 * absolute density error of at most 0.5 / area; ties round upward. Zero emits
 * no centres. Both the area and integer population must be representable.
 * Preparation and each indexed sample cost O(1), without allocating N points.
 *
 * R = ceil(sqrt(N)) rows contain floor(N / R) or one more cells. A row with c
 * cells has height c / N and cell width 1 / c, so every stratum has area 1 / N.
 * One seeded jittered point occupies each stratum. This is a declared sampling
 * convention, not a measured follicle point process. Square populations retain
 * the square partition and the existing one-pore seed identities. Coordinates
 * are dimensionless tile UVs, +u across columns and +v across rows; periodically
 * wrapping a rounded seam coordinate keeps it in [0,1). Finite coordinates and
 * the consumer's texels can merge unresolved features at high density; count
 * admission alone proves neither anatomical validity nor resolved texture detail.
 *
 * @evidence contracts/common.md#principled-implementation Rounding density times physical area selects the nearest representable count; equal-area strata distribute that count without square-grid rounding or a forced pore at zero.
 * @evidence contracts/common.md#clear-and-simple-design One lazy population sampler owns cardinality and UV placement; the texture consumer owns Gaussian heights, derivatives and PNG encoding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every population uses the same strata rule and seed domain, with no subject, image or special density value.
 * @evidence contracts/common.md#meaningful-documentation States units, count rounding, strata derivation, caller-owned statistical provenance and finite sampling limits.
 * @evidence contracts/modeling.md#spatial-conventions Converts millimetres to centimetres only for physical area; returned positions are periodic unit-tile coordinates independent of a body mesh's arbitrary UV layout.
 */
export function createHumanBodySkinPoreSampler(input: {
  seed: number;
  tileMillimetres: number;
  perSquareCentimetre: number;
}): { count: number; at: (index: number) => [number, number] } {
  const { seed, tileMillimetres, perSquareCentimetre } = input;
  if (
    !Number.isFinite(seed) ||
    !Number.isFinite(tileMillimetres) || tileMillimetres <= 0 ||
    !Number.isFinite(perSquareCentimetre) || perSquareCentimetre < 0
  )
    throw new Error("Skin pore sampling needs finite seed, positive tile side and nonnegative density.");
  const area = (tileMillimetres / 10) ** 2;
  if (!Number.isFinite(area) || area <= 0)
    throw new Error("Skin pore sampling needs a finite positive tile area.");
  const count = Math.round(perSquareCentimetre * area);
  if (!Number.isSafeInteger(count))
    throw new Error("Skin pore sampling needs a safe integer population.");
  // An empty population prepares without division by zero and admits no index.
  const rows = Math.max(1, Math.ceil(Math.sqrt(count)));
  const columns = Math.floor(count / rows);
  const longerRows = count - rows * columns;
  const longerPopulation = longerRows * (columns + 1);
  return {
    count,
    at: (index) => {
      if (!Number.isSafeInteger(index) || index < 0 || index >= count)
        throw new Error("Skin pore sampling needs an index inside its population.");
      const longer = index < longerPopulation;
      const width = columns + (longer ? 1 : 0);
      const local = longer ? index : index - longerPopulation;
      const row = Math.floor(local / width) + (longer ? 0 : longerRows);
      const column = local % width;
      const before = longer ? row * width : longerPopulation + (row - longerRows) * width;
      return [
        ((column + seededValue(seed, 7, column, row, 1)) / width) % 1,
        ((before + seededValue(seed, 7, column, row, 2) * width) / count) % 1,
      ];
    },
  };
}
