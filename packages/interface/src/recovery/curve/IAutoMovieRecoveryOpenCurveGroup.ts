/** Unsupported open-curve component across two adjacent saved sections. */
export interface IAutoMovieRecoveryOpenCurveGroup {
  /** Involved open-curve ordinals in the preceding section; may be empty. */
  before: number[];

  /** Involved open-curve ordinals in the following section; may be empty. */
  after: number[];

  /** Why no supported ordinary correspondence was published. */
  reason: string;
}
