import type {
  IAutoMovieLinearizePhysicalTargetRows,
  IAutoMoviePoses,
} from "@automovie/interface";

/**
 * Freeze local witnesses once and differentiate only rows affected by the probed joint subtree. Every row remains present, including invariant self distances.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Freeze local witnesses once and differentiate only rows affected by the probed joint subtree) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Freeze local witnesses once and differentiate only rows affected by the probed joint subtree) directly over its typed inputs (`rows`, `accepted`) as nested iteration of depth 2 (map over rows; map over models; flatMap over rows), delegating to `rows.map`, `row.linearize`, `models.map`, `model`, `rows.flatMap`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 22 lines and 3 top-level statements that reuses `rows.map`, `row.linearize`, `models.map`, `model`, `rows.flatMap` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 3 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `rows`, `accepted`; the dominant cost is nested iteration of depth 2 (map over rows; map over models; flatMap over rows), performed once per call with 1 allocation site (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 1 allocation site become the returned value or die with the call, so nothing grows.
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
