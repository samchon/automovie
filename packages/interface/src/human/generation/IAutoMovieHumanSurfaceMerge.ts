import type { IAutoMovieSolidMesh } from "../../construction/IAutoMovieSolidMesh";

/**
 * One solid join as published data: its blend chain
 * (`AutoMovieSolidBlendChain`) and the two rails as trim loops of their faces,
 * column `k` of each loop at the blend's phase `2 pi k / n`.
 */
export interface IAutoMovieHumanSurfaceMerge {
  /** The blend chain's name, in `chains`. */
  blend: string;

  /**
   * The host chain's name: the face the whole host rail lies on, unless
   * `hostChains` names each column's.
   */
  host: string;

  /**
   * The host chain of each column of `hostLoop`, for a rail that crosses the
   * faces of a merged body (`AutoMovieSolidBody`): column `k`'s chart point
   * lies on chain `hostChains[k]`. Absent, every column is on `host`.
   */
  hostChains?: string[];

  /** The part chain's name. */
  part: string;

  /** The blend chain's station span, mm. */
  length: number;

  /** The host's rail as a trim of the host's face. */
  hostLoop: IAutoMovieSolidMesh.ILoopChart;

  /** The part's rail as a trim of the part's face. */
  partLoop: IAutoMovieSolidMesh.ILoopChart;

  /**
   * The host's chart direction at each column toward and past its rail, of unit
   * world speed (`AutoMovieSolidBlendChain.IBlend.across`).
   */
  across: [number, number][];

  /**
   * The part's chart direction at each column toward and past its rail, of unit
   * world speed (`AutoMovieSolidBlendChain.IBlend.partAcross`): along its
   * station under the phase parameter, square to the curve under the angle.
   * Absent, the station direction `sigma`.
   */
  partAcross?: [number, number][];

  /**
   * The intersection curve's point at each column, mm
   * (`AutoMovieSolidBlendChain.IBlend.curve`). Absent on an entry built before
   * it was published.
   */
  curve?: [number, number, number][];

  /**
   * The declared chords at each column, mm
   * (`AutoMovieSolidBlendChain.IBlend.widths`).
   */
  widths?: {
    /**
     * Declared host-side chord width in millimetres at each corresponding blend
     * column, in phase order.
     */
    host: number[];
    /**
     * Declared part-side chord width in millimetres at each blend column; null
     * means its part rail is constrained to one fixed station.
     */
    part: (number | null)[];
  };

  /**
   * The kind of the curve's parameter: `phase`, `angle` or `arc`
   * (`AutoMovieSolidBlendChain.IBlend.parameter`).
   */
  parameter?: "phase" | "angle" | "arc";

  /**
   * The part's kept side in its station
   * (`AutoMovieSolidBlendChain.IBlend.sigma`).
   */
  sigma: 1 | -1;

  /** Rows of the blend between its rails, at least 1. */
  rows: number;

  /**
   * Whether the join is a diff, whose part face (the cutter's wall) faces into
   * the cutter. Absent, a merge.
   */
  diff?: boolean;
}
