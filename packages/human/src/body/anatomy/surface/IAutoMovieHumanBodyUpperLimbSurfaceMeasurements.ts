import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyForearmSurfaceMeasurements } from "./IAutoMovieHumanBodyForearmSurfaceMeasurements";
import type { IAutoMovieHumanBodyHandSurfaceMeasurements } from "./IAutoMovieHumanBodyHandSurfaceMeasurements";
import type { IAutoMovieHumanBodyUpperArmSurfaceMeasurements } from "./IAutoMovieHumanBodyUpperArmSurfaceMeasurements";

/**
 * One arm's independently specified exterior lengths and circumferences.
 *
 * A shoulder-to-elbow or elbow-to-wrist skin landmark distance does not determine humeral or forearm bone length. Upper-arm, forearm and wrist girths condition the exterior separately; they do not specify deltoid, biceps, triceps or subcutaneous-fat volume. Left and right may be targeted or observed independently, because a symmetric mean hides real asymmetry. The hand's named dimensions remain exterior scalars, not finger meshes.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty upper-limb tree preserves independently supplied arm, forearm and hand exterior measurements for one side.
 * @evidence contracts/common.md#clear-and-simple-design Region-specific types own skin sites and quantity alternatives while this container composes their anatomical scope.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Skin lengths/girths cannot determine bone dimensions or tissue volumes and symmetric means cannot erase authored bilateral asymmetry.
 * @evidence contracts/common.md#meaningful-documentation The prose explains separate exterior conditions, side independence and scalar hand dimensions without finger geometry.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Upper-limb composition typing runs no humeral/forearm inference or digit mesh generation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This regional grouping stores no repeated upper-limb measurement or body reconstruction result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Its composed scalar records acquire no arm/hand buffers or active shape solver.
 * @author Samchon
 */
export type IAutoMovieHumanBodyUpperLimbSurfaceMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Skin-defined upper-arm conditions between shoulder and elbow. */
    upperArm?: IAutoMovieHumanBodyUpperArmSurfaceMeasurements;

    /** Independent forearm and wrist exterior dimensions. */
    forearm?: IAutoMovieHumanBodyForearmSurfaceMeasurements;

    /** Overall hand spans without generated digit proportions. */
    hand?: IAutoMovieHumanBodyHandSurfaceMeasurements;
  }>;
