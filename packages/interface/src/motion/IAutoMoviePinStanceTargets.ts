import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieResolvedBone } from "../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieFootLeg } from "./IAutoMovieFootLeg";
import type { IAutoMovieFootPlant } from "./IAutoMovieFootPlant";
import type { IAutoMovieTimedGround } from "./IAutoMovieTimedGround";

/** Data and callback contracts shared by the PinStanceTargets operations. */
export namespace IAutoMoviePinStanceTargets {
  /**
   * Group each leg's stance mask into maximal inclusive runs and assign one
   * fixed model-frame contact per run. A run beginning at frame zero resumes an
   * authoritative opening target; otherwise its first foot supplies XZ and
   * sampled ground supplies Y. Parallel times/FK arrays are caller-admitted.
   */
  export type IProps = {
    /** Legs whose feet are planted. */
    legs: readonly IAutoMovieFootLeg[];

    /** Per-frame FK bone lookups. */
    resolved: ReadonlyArray<
      ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>
    >;

    /** Frame times, parallel to `resolved`. */
    times: readonly number[];

    /** Ground height at a plan position. */
    groundAt: (x: number, z: number) => number;

    /** Static terrain scoped on the local clock, when authored. */
    support?: IAutoMovieTimedGround;

    /** Contact tolerance above the ground counted as stance. */
    tolerance: number;

    /** Prior beat's authoritative opening pin per foot, in model space. */
    openingTargets?: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>;
  };

  /**
   * Group each leg's stance mask into maximal inclusive runs and assign one
   * fixed model-frame contact per run. A run beginning at frame zero resumes an
   * authoritative opening target; otherwise its first foot supplies XZ and
   * sampled ground supplies Y. Parallel times/FK arrays are caller-admitted.
   */
  export type IResult = {
    /** Compact inclusive stance records, one per detected run. */
    plants: IAutoMovieFootPlant[];

    /** Parallel per-frame maps sharing each run's fixed contact target. */
    targets: Array<Map<AutoMovieHumanoidBone, IAutoMovieVector3>>;
  };
}
