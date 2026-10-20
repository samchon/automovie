import { decomposeAutoMovieSingularMatrix } from "@automovie/engine/math/decomposeAutoMovieSingularMatrix";
import { reduceAutoMovieQrDesign } from "@automovie/engine/math/reduceAutoMovieQrDesign";
import type { IAutoMovieRecoveryCameraMapBudget } from "@automovie/interface/recovery";

/**
 * Solve a column-scaled original least-squares design with optional damping.
 * Independent undamped rank is checked first; damping controls a step and never
 * supplies evidence of local observability. The right side is minus residual.
 *
 * @evidence contracts/common.md#principled-implementation Scaling columns preserves physical parameter units on back substitution. Tall original designs are compressed by orthogonal Givens QR before SVD measures the same singular spectrum. An augmented identity design implements Levenberg damping without squaring condition or changing the least-squares step.
 * @evidence contracts/common.md#clear-and-simple-design This recovery numerical helper serves resection and reduced joint camera systems; model derivatives, robust loss and actual-cost acceptance belong to callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No normal-equation inverse, singular floor, damped-rank claim or unconverged decomposition supplies a step.
 * @evidence contracts/common.md#meaningful-documentation States right-side sign, unscaled returned coordinates, dimensionless damping, original rank and preallocation entry bound.
 * @evidence contracts/performance.md#efficient-algorithms For m rows and n parameters, tall QR costs O(m*n^2), followed by square original-design SVDs costing O(S*n^3), with O(m*n+n^2) storage. Variable camera width remains explicitly bounded; compression supplies no measured host-speed guarantee.
 * @evidence contracts/performance.md#reuse-equivalent-work Column norms serve normalization and final unscaling, and undamped factors solve the zero-damping case directly.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only an owned step and scalar diagnostics return; call-local factors expire with no mutable global cache or external resource.
 */
export function solveRecoveryMapDesign(
  design: readonly (readonly number[])[],
  right: readonly number[],
  minimumRatio: number,
  damping: number,
  budget: IAutoMovieRecoveryCameraMapBudget,
): { step: number[]; designRatio: number; gradient: number } {
  const width: number = design[0]?.length ?? 0;
  if (
    width < 1 ||
    design.length !== right.length ||
    !right.every(Number.isFinite) ||
    !(damping >= 0) ||
    !Number.isFinite(damping) ||
    (design.length + width) * width > budget.maxLinearEntries ||
    width * width > budget.maxLinearEntries
  )
    throw new Error(
      "camera-map: inadmissible local design dimensions or damping",
    );
  const scales: number[] = new Array<number>(width).fill(0);
  for (const row of design) {
    if (row.length !== width || !row.every(Number.isFinite))
      throw new Error("camera-map: finite rectangular local design required");
    for (let column: number = 0; column < width; column++)
      scales[column] = Math.hypot(scales[column]!, row[column]!);
  }
  if (
    scales.some(
      (value: number): boolean => !(value > 0) || !Number.isFinite(value),
    )
  )
    throw new Error("camera-map: unresolved local direction");
  const rows: number[][] = design.map((row: readonly number[]): number[] =>
    row.map((value: number, at: number): number => value / scales[at]!),
  );
  const options: Parameters<typeof decomposeAutoMovieSingularMatrix>[1] = {
    maxEntries: budget.maxLinearEntries,
    maxSweeps: budget.maxSingularSweeps,
    orthogonalityTolerance: 1e-12,
  };
  const compressed: ReturnType<typeof reduceAutoMovieQrDesign> | null =
    rows.length >= 2 * width
      ? reduceAutoMovieQrDesign(rows, right, {
          maxEntries: budget.maxLinearEntries,
          maxWork: rows.length * width * (width + 1),
        })
      : null;
  const solveRows: number[][] = compressed?.rows ?? rows;
  const solveRight: readonly number[] = compressed?.right ?? right;
  const rank: ReturnType<typeof decomposeAutoMovieSingularMatrix> =
    decomposeAutoMovieSingularMatrix(solveRows, options);
  const designRatio: number =
    rank.singularValues[width - 1]! / rank.singularValues[0]!;
  if (!(designRatio >= minimumRatio))
    throw new Error("camera-map: rank-degenerate local design");
  let gradient: number = 0;
  for (let column: number = 0; column < width; column++)
    gradient = Math.max(
      gradient,
      Math.abs(
        rows.reduce(
          (sum: number, row: number[], at: number): number =>
            sum + row[column]! * right[at]!,
          0,
        ),
      ),
    );
  const augmented: number[][] = solveRows.slice();
  if (damping > 0)
    for (let row: number = 0; row < width; row++)
      augmented.push(
        Array.from({ length: width }, (_: unknown, at: number): number =>
          at === row ? Math.sqrt(damping) : 0,
        ),
      );
  const factors: ReturnType<typeof decomposeAutoMovieSingularMatrix> =
    damping === 0 ? rank : decomposeAutoMovieSingularMatrix(augmented, options);
  const step: number[] = new Array<number>(width).fill(0);
  for (let component: number = 0; component < width; component++) {
    const coefficient: number =
      solveRight.reduce(
        (sum: number, value: number, at: number): number =>
          sum + factors.leftColumns[component]![at]! * value,
        0,
      ) / factors.singularValues[component]!;
    for (let at: number = 0; at < width; at++)
      step[at] +=
        (coefficient * factors.rightColumns[component]![at]!) / scales[at]!;
  }
  if (!step.every(Number.isFinite))
    throw new Error("camera-map: nonrepresentable local step");
  return { step, designRatio, gradient };
}
