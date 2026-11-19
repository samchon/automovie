import type { IAutoMovieRestFrame } from "../pose/IAutoMovieRestFrame";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieFootLeg } from "./IAutoMovieFootLeg";
import type { IAutoMovieFootPlant } from "./IAutoMovieFootPlant";
import type { IAutoMovieMotion } from "./IAutoMovieMotion";
import type { IAutoMovieTimedGround } from "./IAutoMovieTimedGround";

/**
 * Data and callback contracts shared by the PlantStanceFeet operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Detection and IK share the skeleton, clinical axes and rest frames; ground and tolerance are model metres and sampleRate is samples per second. plantStanceFeet admits its numerical controls, but ROM or reach limits can leave residual contact error.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMoviePlantStanceFeet contracts used by packages/engine/src/motion/plantStanceFeet.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation Detection and IK share the skeleton, clinical axes and rest frames; ground and tolerance are model metres and sampleRate is samples per second. plantStanceFeet admits its numerical controls, but ROM or reach limits can leave residual contact error. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMoviePlantStanceFeet contract belongs to interface; packages/engine/src/motion/plantStanceFeet.ts uses its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMoviePlantStanceFeet {
  /**
   * Sample admitted motion on a fixed clock, detect finite model-frame stance contacts, pin each run and fit targeted leg chains under the same clinical mappings and rig ROM. Unreachable/constrained pins retain the best allowed pose and may leave residual; the result does not guarantee exact no-skate contact. Opening plants resume authoritative targets only for opening stance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Detection and IK share the skeleton, clinical axes and rest frames; ground and tolerance are model metres and sampleRate is samples per second. plantStanceFeet admits its numerical controls, but ROM or reach limits can leave residual contact error.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMoviePlantStanceFeet.IProps keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Detection and IK share the skeleton, clinical axes and rest frames; ground and tolerance are model metres and sampleRate is samples per second. plantStanceFeet admits its numerical controls, but ROM or reach limits can leave residual contact error. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMoviePlantStanceFeet.IProps contract belongs to interface; packages/engine/src/motion/plantStanceFeet.ts uses this boundary. Runtime computation remains with those consumers.
   */
  export type IProps = {
    /** Rig for forward kinematics. */
    skeleton: IAutoMovieSkeleton;

    /** The humanoid gait/motion to correct. */
    motion: IAutoMovieMotion;

    /** Ground height: plane scalar or `(x, z) → y` source. Defaults to `0` when support is omitted. */
    groundY?: number | ((x: number, z: number) => number);

    /** Explicit time-dependent ground. Takes precedence over the scalar or positional query. */
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
     * When a detected stance begins at the opening sample, its first pin resumes
     * this authoritative position instead of deriving a nearby replacement.
     */
    openingPlants?: ReadonlyArray<
      Pick<IAutoMovieFootPlant, "foot" | "position">
    >;
  };
}
