import type { IAutoMovieRestFrame } from "../pose/IAutoMovieRestFrame";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieFootLeg } from "./IAutoMovieFootLeg";
import type { IAutoMovieFootPlant } from "./IAutoMovieFootPlant";
import type { IAutoMovieMotion } from "./IAutoMovieMotion";
import type { IAutoMovieTimedGround } from "./IAutoMovieTimedGround";

/** Data and callback contracts shared by the PlantStanceFeet operations. */
export namespace IAutoMoviePlantStanceFeet {
  /**
   * Sample admitted motion on a fixed clock, detect finite model-frame stance
   * contacts, pin each run and fit targeted leg chains under the same clinical
   * mappings and rig ROM. Unreachable/constrained pins retain the best allowed
   * pose and may leave residual; the result does not guarantee exact no-skate
   * contact. Opening plants resume authoritative targets only for opening
   * stance.
   */
  export type IProps = {
    /** Rig for forward kinematics. */
    skeleton: IAutoMovieSkeleton;

    /** The humanoid gait/motion to correct. */
    motion: IAutoMovieMotion;

    /**
     * Ground height: plane scalar or `(x, z) → y` source. Defaults to `0` when
     * support is omitted.
     */
    groundY?: number | ((x: number, z: number) => number);

    /**
     * Explicit time-dependent ground. Takes precedence over the scalar or
     * positional query.
     */
    support?: IAutoMovieTimedGround;

    /** Contact tolerance above the plane counted as stance. Defaults to `0.02`. */
    tolerance?: number;

    /** Legs to plant. Defaults to both humanoid legs. */
    legs?: readonly IAutoMovieFootLeg[];

    /** Optional clinical-axis remap used consistently by detection and IK. */
    jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

    /** Optional clinical rest frames used consistently by detection and IK. */
    restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;

    /** Samples/second for detection and re-keying. Defaults to `24`. */
    sampleRate?: number;

    /**
     * Prior beat plants expressed in this motion's model frame.
     *
     * When a detected stance begins at the opening sample, its first pin
     * resumes this authoritative position instead of deriving a nearby
     * replacement.
     */
    openingPlants?: ReadonlyArray<
      Pick<IAutoMovieFootPlant, "foot" | "position">
    >;
  };
}
