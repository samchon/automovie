import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

/** Borrowed world transforms for one candidate. */
type Poses = Readonly<Record<string, P.ITransform>>;

/** Freeze local witnesses once and differentiate only rows affected by the probed joint subtree. Every row remains present, including invariant self distances. */
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

/** Exact row dependencies are declared by their existing geometric owner. */
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
