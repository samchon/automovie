import type { IAutoMovieResolvedBone } from "../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/** Data and callback contracts shared by the ContactMask operations. */
export namespace IAutoMovieContactMask {
  /**
   * Classify each resolved effector sample as stance when its model-frame Y is
   * at or below sampled ground plus finite nonnegative tolerance. Missing
   * effectors are false; nonfinite sampled ground throws and callback
   * exceptions propagate.
   */
  export type IProps = {
    /** End-effector bone judged against the ground. */
    effector: AutoMovieHumanoidBone;

    /**
     * Per-frame actual FK position lookups; complete bone frames are also
     * accepted.
     */
    resolved: ReadonlyArray<
      ReadonlyMap<
        AutoMovieHumanoidBone,
        IAutoMovieResolvedBone | Pick<IAutoMovieResolvedBone, "worldPosition">
      >
    >;

    /** Ground height at a plan position. */
    groundAt: (x: number, z: number) => number;

    /** Contact tolerance above the ground counted as stance. */
    tolerance: number;
  };
}
