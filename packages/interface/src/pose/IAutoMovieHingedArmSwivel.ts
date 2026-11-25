import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieHingedChainGeometry } from "./IAutoMovieHingedChainGeometry";

/**
 * Rest-chain geometry and swivel parameterization shared by hingedArmSwivel and
 * hingedArmArticulation. Hinge angles are radians; swivel arguments are
 * degrees.
 */
export namespace IAutoMovieHingedArmSwivel {
  /** One bend branch after the hinge's range. */
  export interface IStop {
    /** The hinge angle, radians, inside the range when one is given. */
    theta: number;

    /**
     * Metres between the chain's span at `theta` and the target distance; `0`
     * for a branch that reaches the distance inside the range.
     */
    shortfall: number;
  }

  /**
   * The chain posed at a hinge angle, for any swivel: the mid joint turned by
   * the hinge angle, the root aimed so the chain's root-to-effector line points
   * at the target (`aimRotation`), then turned about that line by the swivel in
   * degrees. The returned closure retains the precomputed aim and hinge
   * quaternion. Each evaluation makes a new upper rotation but shares its lower
   * quaternion with other evaluations, so treat both as read-only.
   */
  export type IPoseResult = (swivel: number) => {
    /** Root articulation in its bone-local rest frame; unit quaternion. */
    upper: IAutoMovieQuaternion;
    /**
     * Mid articulation about its bone-local hinge; unit quaternion shared
     * across this closure's samples.
     */
    lower: IAutoMovieQuaternion;
  };

  /** Source geometry and one target's independent branch/pose readers. */
  export interface IPrepared {
    /** Borrow one unchanged model-metre point and optional radian hinge range. */
    target(
      point: IAutoMovieVector3,
      range?: IAutoMovieHingedChainGeometry["range"],
    ): IPreparedTarget;
  }

  /** One target's geometric readers under one unchanged prepared source. */
  export interface IPreparedTarget {
    /** Actual hinge roots in direct order, or null at the same degeneracy gates. */
    branches(): IAutoMovieHingedArmSwivel.IStop[] | null;

    /**
     * Build one actual branch's poser for a swivel in degrees, without rig
     * policy.
     */
    pose(theta: number): IAutoMovieHingedArmSwivel.IPoseResult;

    /**
     * Read one radian hinge branch's algebraic upper half-angle family. The
     * returned coefficients use bone-local frames and degree swivels as defined
     * by IHarmonic; this query does not admit goals or constraints.
     */
    harmonic?(theta: number): IHarmonic;
  }

  /**
   * One branch's exact algebraic quaternion half-angle family in bone-local
   * frames. Keep its returned coefficient/lower records unchanged while
   * constructing or using the same branch's poser.
   */
  export interface IHarmonic {
    /** Upper articulation's cosine half-angle coefficient. */
    cosine: IAutoMovieQuaternion;
    /** Upper articulation's sine half-angle coefficient. */
    sine: IAutoMovieQuaternion;
    /** Actual fixed lower articulation about its hinge. */
    lower: IAutoMovieQuaternion;
    /**
     * Build the degree-swivel reader from this completed branch's unchanged
     * geometry.
     */
    pose(): IAutoMovieHingedArmSwivel.IPoseResult;
  }
}
