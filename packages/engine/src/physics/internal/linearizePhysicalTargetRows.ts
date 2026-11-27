import type {
  IAutoMovieLinearizePhysicalTargetRows,
  IAutoMoviePoses,
} from "@automovie/interface";

/*
 * Freeze local witnesses once and differentiate only rows affected by the
 * probed joint subtree. Every row remains present, including invariant self
 * distances.
 */
export function linearizePhysicalTargetRows(
  rows: readonly IAutoMovieLinearizePhysicalTargetRows.IRows[],
  accepted: IAutoMoviePoses,
): (probe: IAutoMoviePoses, moved?: ReadonlySet<string>) => number[] {
  const models: ((probe: IAutoMoviePoses) => number[])[] = rows.map(
    (
      row: IAutoMovieLinearizePhysicalTargetRows.IRows,
    ): ((probe: IAutoMoviePoses) => number[]) => row.linearize(accepted),
  );
  const baseline: number[][] = models.map(
    (model: (probe: IAutoMoviePoses) => number[]): number[] => model(accepted),
  );
  return (probe: IAutoMoviePoses, moved?: ReadonlySet<string>): number[] =>
    rows.flatMap(
      (
        row: IAutoMovieLinearizePhysicalTargetRows.IRows,
        index: number,
      ): number[] => {
        if (moved === undefined) return models[index]!(probe);
        const affected: string[] = [...row.bones].filter(
          (bone: string): boolean => moved.has(bone),
        );
        return !affected.length ||
          (row.rigidInvariant && affected.length === row.bones.size)
          ? baseline[index]!
          : models[index]!(probe);
      },
    );
}
