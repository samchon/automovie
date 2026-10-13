/** One construction role carried through a junction by both build-ups. */
export interface IAutoMovieAssemblyContinuity {
  /** The role both sides declare. */
  role: string;
  /** Signed span the role occupies on the left build-up. */
  left: {
    /** Lowest signed coordinate. */
    min: number;
    /** Highest signed coordinate. */
    max: number;
  };
  /** Signed span the role occupies on the right build-up. */
  right: {
    /** Lowest signed coordinate. */
    min: number;
    /** Highest signed coordinate. */
    max: number;
  };
  /** Shared signed length in metres; negative states the gap between spans. */
  overlap: number;
  /** Whether the two spans meet or overlap within the caller's tolerance. */
  aligned: boolean;
}
