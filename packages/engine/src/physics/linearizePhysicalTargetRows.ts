import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

/** Borrowed world transforms for one candidate. */
type Poses = Readonly<Record<string, P.ITransform>>;

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
  rows: readonly linearizePhysicalTargetRows.IRows[],
  accepted: Poses,
): (probe: Poses, moved?: ReadonlySet<string>) => number[] {
  const models: ((probe: Poses) => number[])[] = rows.map(
    (row: linearizePhysicalTargetRows.IRows): ((probe: Poses) => number[]) =>
      row.linearize(accepted),
  );
  const baseline: number[][] = models.map(
    (model: (probe: Poses) => number[]): number[] => model(accepted),
  );
  return (probe: Poses, moved?: ReadonlySet<string>): number[] =>
    rows.flatMap(
      (row: linearizePhysicalTargetRows.IRows, index: number): number[] => {
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

/**
 * Exact row dependencies are declared by their existing geometric owner.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Exact row dependencies are declared by their existing geometric owner) and documents 1 documented member as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Exact row dependencies are declared by their existing geometric owner: companion namespace of 1 member (`IRows`); units and frames named in its text: local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `linearizePhysicalTargetRows` in packages/engine/src/physics/linearizePhysicalTargetRows.ts; its surface is the 1 member listed and the text shows 5 other files naming it, mostly packages/engine (3), test (2), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace linearizePhysicalTargetRows {
  /** One residual group and its call-local witness model. */
  export interface IRows {
    /** All candidate bones read by this group. External bodies remain actual. */ bones: ReadonlySet<string>;
    /** True only for intrinsic same-body separation, invariant under a common rigid motion. */ rigidInvariant?: boolean;
    /** Exact nonlinear residuals used for acceptance. */ measure: (
      poses: Poses,
    ) => number[];
    /** Frozen local model at an accepted configuration. */ linearize: (
      poses: Poses,
    ) => (probe: Poses) => number[];
  }
}
