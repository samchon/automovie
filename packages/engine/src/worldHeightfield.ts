import { IAutoMovieWorldSurface } from "@automovie/interface";

/**
 * Bake a supplied height callback into a row-major terrain lattice.
 *
 * @evidence contracts/common.md#principled-implementation Each row/column coordinate is evaluated once, finite returned heights become stored samples, and downstream surfaceHeightAt owns bilinear edge-clamped reading. A pure callback is a determinism premise not enforced by this constructor.
 * @evidence contracts/common.md#clear-and-simple-design The design retains sampled numbers and a copied footprint instead of a live callback, so later rendering depends on the baked generation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Blank id, nonfinite origin/nonpositive spacing, non-safe dimensions below two and nonfinite callback results throw. Derived coordinate overflow and an allocatable total sample population remain unchecked prerequisites; callback effects/errors propagate.
 * @evidence contracts/common.md#meaningful-documentation Documents world metre origin/pitch, row-major +X/+Z order, finite sample admission, caller-owned purity and the absence of a lattice population budget.
 * @evidence contracts/performance.md#efficient-algorithms C columns and R rows require C*R callback evaluations/storage plus footprint cloning; callback cost is additional and individually safe dimensions do not bound their product or memory use.
 * @evidence contracts/performance.md#reuse-equivalent-work Every lattice point is sampled once and the result serves future queries; effectful callbacks are not memoized or retried and changed terrain needs a new bake.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the fresh sample buffer, rule and copied polygon; the callback and input footprint are not retained after success or failure, with no background sampler.
 * @author Samchon
 */
export const worldHeightfield: (input: {
  id: string;
  polygon: { x: number; z: number }[];
  origin: { x: number; z: number };
  spacing: { x: number; z: number };
  columns: number;
  rows: number;
  height: (point: { x: number; z: number }) => number;
  walkable: boolean;
}) => IAutoMovieWorldSurface = (input: {
  id: string;
  polygon: IAutoMovieWorldSurface["polygon"];
  /** World XZ of sample column and row zero. */
  origin: { x: number; z: number };
  /** Column and row pitch in meters, both strictly above zero. */
  spacing: { x: number; z: number };
  /** Sample columns along +X; at least two. */
  columns: number;
  /** Sample rows along +Z; at least two. */
  rows: number;
  /** Surface height in meters at one lattice point. */
  height: (point: { x: number; z: number }) => number;
  walkable: boolean;
}): IAutoMovieWorldSurface => {
  assertText(input.id, "World heightfield id");
  if (
    Number.isFinite(input.spacing.x) === false ||
    input.spacing.x <= 0 ||
    Number.isFinite(input.spacing.z) === false ||
    input.spacing.z <= 0 ||
    Number.isFinite(input.origin.x) === false ||
    Number.isFinite(input.origin.z) === false
  )
    throw new Error(
      `World heightfield "${input.id}" requires a finite origin and positive spacing.`,
    );
  if (
    Number.isSafeInteger(input.columns) === false ||
    Number.isSafeInteger(input.rows) === false ||
    input.columns < 2 ||
    input.rows < 2
  )
    throw new Error(
      `World heightfield "${input.id}" requires at least two sample columns and rows.`,
    );
  const samples: number[] = [];
  for (let row: number = 0; row < input.rows; ++row)
    for (let column: number = 0; column < input.columns; ++column) {
      const height: number = input.height({
        x: input.origin.x + column * input.spacing.x,
        z: input.origin.z + row * input.spacing.z,
      });
      if (Number.isFinite(height) === false)
        throw new Error(
          `World heightfield "${input.id}" sampled a non-finite height at column ${column}, row ${row}.`,
        );
      samples.push(height);
    }
  return {
    id: input.id,
    polygon: structuredClone(input.polygon),
    height: {
      kind: "heightfield",
      originX: input.origin.x,
      originZ: input.origin.z,
      spacingX: input.spacing.x,
      spacingZ: input.spacing.z,
      columns: input.columns,
      rows: input.rows,
      samples,
    },
    walkable: input.walkable,
  };
};

/** Require non-whitespace terrain identity while preserving its authored spelling. */
const assertText: (value: string, field: string) => void = (
  value: string,
  field: string,
): void => {
  if (value.trim().length === 0)
    throw new Error(`${field} must contain non-whitespace text.`);
};
