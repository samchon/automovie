import { seededValue } from "@automovie/engine";

/**
 * Prepare the Gaussian dimple centres consumed by the skin detail texture. The caller supplies its table's follicular density per square centimetre, tile side in millimetres and deterministic seed; none is mutated or fitted. This sampler establishes a representation, not a physiological density range. The table owner carries the measurement conditions and their limitations.
 *
 * The tile area is (side / 10)^2 cm². Its nearest integer population has an absolute density error of at most 0.5 / area; ties round upward. Zero emits no centres. Both the area and integer population must be representable. Preparation and each indexed sample cost O(1), without allocating N points.
 *
 * R = ceil(sqrt(N)) rows contain floor(N / R) or one more cells. A row with c cells has height c / N and cell width 1 / c, so every stratum has area 1 / N. One seeded jittered point occupies each stratum. This is a declared sampling convention, not a measured follicle point process. Square populations retain the square partition and the existing one-pore seed identities. Coordinates are dimensionless tile UVs, +u across columns and +v across rows; periodically wrapping a rounded seam coordinate keeps it in [0,1). Finite coordinates and the consumer's texels can merge unresolved features at high density; count admission alone proves neither anatomical validity nor resolved texture detail.
 *
 * @evidence contracts/common.md#principled-implementation Integer population comes from tile area times declared density; unequal row lengths give each seeded stratum equal area without inventing a physiological distribution.
 * @evidence contracts/common.md#clear-and-simple-design Preparation stores row arithmetic and exposes one indexed UV sampler, rather than materializing an entire population.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Finite input, representable positive area, safe population and index admission prevent invalid arithmetic; rounding and texel resolution remain explicit approximation limits.
 * @evidence contracts/common.md#meaningful-documentation Units, rounding error, row partition, periodic seams and the distinction between sampling convention and measured anatomy are stated above.
 * @evidence contracts/performance.md#efficient-algorithms Preparation and indexed sampling each perform constant arithmetic and seeded lookups, so population size does not cause an allocation or traversal here.
 * @evidence contracts/performance.md#reuse-equivalent-work Prepared row and population values serve every index; identical seed and index arithmetic reproduce the same UV without a point cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned closure retains only numeric partition state until unreachable; it owns no point array, external handle or asynchronous work.
 */
export function createHumanBodySkinPoreSampler(input: {
  seed: number;
  tileMillimetres: number;
  perSquareCentimetre: number;
}): { count: number; at: (index: number) => [number, number] } {
  const { seed, tileMillimetres, perSquareCentimetre }: typeof input = input;
  if (
    !Number.isFinite(seed) ||
    !Number.isFinite(tileMillimetres) ||
    tileMillimetres <= 0 ||
    !Number.isFinite(perSquareCentimetre) ||
    perSquareCentimetre < 0
  )
    throw new Error(
      "Skin pore sampling needs finite seed, positive tile side and nonnegative density.",
    );
  const area: number = (tileMillimetres / 10) ** 2;
  if (!Number.isFinite(area) || area <= 0)
    throw new Error("Skin pore sampling needs a finite positive tile area.");
  const count: number = Math.round(perSquareCentimetre * area);
  if (!Number.isSafeInteger(count))
    throw new Error("Skin pore sampling needs a safe integer population.");
  // An empty population prepares without division by zero and admits no index.
  const rows: number = Math.max(1, Math.ceil(Math.sqrt(count)));
  const columns: number = Math.floor(count / rows);
  const longerRows: number = count - rows * columns;
  const longerPopulation: number = longerRows * (columns + 1);
  return {
    count,
    at: (index: number): [number, number] => {
      if (!Number.isSafeInteger(index) || index < 0 || index >= count)
        throw new Error(
          "Skin pore sampling needs an index inside its population.",
        );
      const longer: boolean = index < longerPopulation;
      const width: number = columns + (longer ? 1 : 0);
      const local: number = longer ? index : index - longerPopulation;
      const row: number = Math.floor(local / width) + (longer ? 0 : longerRows);
      const column: number = local % width;
      const before: number = longer
        ? row * width
        : longerPopulation + (row - longerRows) * width;
      return [
        ((column + seededValue(seed, 7, column, row, 1)) / width) % 1,
        ((before + seededValue(seed, 7, column, row, 2) * width) / count) % 1,
      ];
    },
  };
}
