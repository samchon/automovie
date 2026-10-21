/**
 * Differentiate r*normalize(t+Bz) at the unchanged current translation.
 * The radius r=norm(t) is constant within one local chart. Columns of B are
 * raw coefficient directions, which need not be exactly tangent or unit.
 *
 * @evidence contracts/common.md#principled-implementation The normalization chain rule gives B_i-t*(t dot B_i)/norm(t)^2. This actual differential supplies both ordinary and feasible physical rows and the optional curvature's first derivatives without treating an admitted near-unit input as exactly unit.
 * @evidence contracts/common.md#clear-and-simple-design One fixed two-column projection owns the seed chart differential; raw coefficient construction and actual pose updates remain separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No borrowed direction is changed, radius is clamped or numerical input is silently normalized. Malformed dimensions throw; unsupported computed radius/differential returns null for the caller's original arithmetic policy.
 * @evidence contracts/common.md#meaningful-documentation States the fixed local radius, raw coefficient meaning and actual first derivative at the original current value.
 * @evidence contracts/performance.md#efficient-algorithms Two three-coordinate contractions and projections cost constant work and storage. Map callers prepay512 additional model visits, including validation, both projections and result qualification; optional curvature includes this fixed work in its existing per-observation allowance.
 * @evidence contracts/performance.md#reuse-equivalent-work The squared radius is shared by both columns, and each column's radial contraction is evaluated once.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Two owned tuples transfer; borrowed t and B remain unchanged. The temporary raw/derived overlap and fixed locals fit the separately admitted64-slot chart envelope; no state, image or factor is retained.
 */
export function differentiateRecoveryMapTangent(
  translation: readonly [number, number, number],
  tangent: readonly (readonly [number, number, number])[],
): [number, number, number][] | null {
  if (
    translation.length !== 3 ||
    !Number.isFinite(translation[0]) ||
    !Number.isFinite(translation[1]) ||
    !Number.isFinite(translation[2]) ||
    tangent.length !== 2
  )
    throw new Error("camera-map-chart: finite owned seed chart required");
  for (let column: number = 0; column < 2; column++) {
    const row: readonly number[] | undefined = tangent[column];
    if (
      row === undefined ||
      row.length !== 3 ||
      !Number.isFinite(row[0]) ||
      !Number.isFinite(row[1]) ||
      !Number.isFinite(row[2])
    )
      throw new Error("camera-map-chart: finite owned seed chart required");
  }
  const squared: number = Math.hypot(...translation) ** 2;
  if (!(squared > 0) || !Number.isFinite(squared)) return null;
  const result: [number, number, number][] = tangent.map(
    (row: readonly [number, number, number]): [number, number, number] => {
      const product: number =
        (translation[0] * row[0] +
          translation[1] * row[1] +
          translation[2] * row[2]) /
        squared;
      return [
        row[0] - translation[0] * product,
        row[1] - translation[1] * product,
        row[2] - translation[2] * product,
      ];
    },
  );
  return result.every((row: readonly number[]): boolean =>
    row.every(Number.isFinite),
  )
    ? result
    : null;
}
