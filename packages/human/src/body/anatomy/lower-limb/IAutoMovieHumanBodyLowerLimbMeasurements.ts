import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyFootMeasurements } from "./IAutoMovieHumanBodyFootMeasurements";
import type { IAutoMovieHumanBodyKneeMeasurements } from "./IAutoMovieHumanBodyKneeMeasurements";
import type { IAutoMovieHumanBodyLegMeasurements } from "./IAutoMovieHumanBodyLegMeasurements";
import type { IAutoMovieHumanBodyThighMeasurements } from "./IAutoMovieHumanBodyThighMeasurements";

/**
 * One lower limb's thigh, knee, anatomical leg and foot, with one bone owner.
 *
 * The femur meets the pelvic acetabulum, femoral condyles meet tibia/patella, and tibia/fibula meet talus. The group expresses containment of parts; articulations and muscles crossing groups are separate named relations.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty thigh/knee/leg/foot composition preserves one side's distinct anatomical owners and neighboring articulation references.
 * @evidence contracts/common.md#clear-and-simple-design Regional containment delegates measurement contracts while crossing muscles/articulations remain named relations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Lower-limb membership does not create duplicate bones at regional joint boundaries.
 * @evidence contracts/common.md#meaningful-documentation Comments distinguish regional owners and their pelvic/knee/ankle relationships.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Lower-limb grouping computes no whole-leg geometry or gait algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Containment references store no completed limb reconstruction or pose cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The limb input aggregate acquires no regional model or running gait task.
 * @author Samchon
 */
export type IAutoMovieHumanBodyLowerLimbMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Femur of this side, independent of pelvic gluteal measurements. */
    thigh?: IAutoMovieHumanBodyThighMeasurements;

    /** Patella and knee-specific anatomy. */
    knee?: IAutoMovieHumanBodyKneeMeasurements;

    /** Tibia and fibula between knee and ankle. */
    leg?: IAutoMovieHumanBodyLegMeasurements;

    /** Talus and calcaneus of the hindfoot. */
    foot?: IAutoMovieHumanBodyFootMeasurements;
  }>;
