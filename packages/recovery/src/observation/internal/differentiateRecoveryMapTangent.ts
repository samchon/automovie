/**
 * Differentiate r*normalize(t+Bz) at the unchanged current translation. The
 * radius r=norm(t) is constant within one local chart. Columns of B are raw
 * coefficient directions, which need not be exactly tangent or unit.
 */
export function differentiateRecoveryMapTangent(
  translation: readonly [number, number, number],
  tangent: readonly (readonly [number, number, number])[],
): [number, number, number][] | null {
  if (translation.length !== 3 || tangent.length !== 2)
    throw new Error("camera-map-chart: finite owned seed chart required");
  for (let column: number = 0; column < 2; column++) {
    const row: readonly number[] | undefined = tangent[column];
    if (row === undefined || row.length !== 3)
      throw new Error("camera-map-chart: finite owned seed chart required");
  }
  const squared: number = Math.hypot(...translation) ** 2;
  if (!(squared > 0) || squared === Infinity) return null;
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
  return result.some((row: readonly number[]): boolean =>
    row.some(
      (value: number): boolean => value === Infinity || value === -Infinity,
    ),
  )
    ? null
    : result;
}
