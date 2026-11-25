import type { IAutoMovieRecoveryOpenArcIncidence } from "./IAutoMovieRecoveryOpenArcIncidence";

/** Transient source support for one saved open-section row. */
export interface IAutoMovieRecoveryOpenContinuationRow {
  /** Observed open arcs with private source support. */
  arcs: IAutoMovieRecoveryOpenArcIncidence[];

  /** Saved coefficient ordinal corresponding to each observed arc. */
  ordinals: number[];

  /** Saved open-curve ordinals lacking an identical endpoint-bound observation. */
  missing: number[];

  /** Private source face groups that prevent ordinary slab admission. */
  defects: Set<number>[];
}
