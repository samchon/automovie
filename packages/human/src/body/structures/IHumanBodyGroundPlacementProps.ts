import type { IAutoMovieHumanBodyBasis } from "./IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBuild } from "./IAutoMovieHumanBodyBuild";

/**
 * The evaluated body and its source ground/foot registration for vertical
 * placement. The source floor remains in its rest frame.
 *
 * @evidence contracts/common.md#principled-implementation Carries the actual evaluated surfaces and the basis that names their ground and foot regions together.
 * @evidence contracts/common.md#clear-and-simple-design Two named owners supply the measurement and its source registration.
 * @evidenceExclude contracts/common.md#prohibited-implementation-shortcuts This input carrier computes no answer.
 * @evidence contracts/common.md#meaningful-documentation States final performed geometry and fixed source-floor ownership.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It carries existing parts and defines none.
 * @evidenceExclude contracts/modeling.md#parameter-channels It transports the evaluated build and defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It carries existing geometry and emits none.
 * @evidence contracts/modeling.md#spatial-conventions Both supplied owners retain the basis metre frame and its fixed ground.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The body builder owns the assembled boundaries.
 * @evidenceExclude contracts/modeling.md#rendered-observation The body assembly consumer owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It introduces no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Pose owners have already admitted the build.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It transports a resolved build rather than an authoring measurement.
 * @author Samchon
 */
export interface IHumanBodyGroundPlacementProps {
  /** Basis that owns the ground landmark and foot attachment regions. */
  basis: IAutoMovieHumanBodyBasis;

  /** Actual final posed surfaces and the static model derived from them. */
  build: IAutoMovieHumanBodyBuild;
}
