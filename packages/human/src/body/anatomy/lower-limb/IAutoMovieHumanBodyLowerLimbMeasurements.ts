import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyFootMeasurements } from "./IAutoMovieHumanBodyFootMeasurements";
import type { IAutoMovieHumanBodyKneeMeasurements } from "./IAutoMovieHumanBodyKneeMeasurements";
import type { IAutoMovieHumanBodyLegMeasurements } from "./IAutoMovieHumanBodyLegMeasurements";
import type { IAutoMovieHumanBodyThighMeasurements } from "./IAutoMovieHumanBodyThighMeasurements";

/**
 * One lower limb's thigh, knee, anatomical leg and foot, with one bone owner.
 *
 * The femur meets the pelvic acetabulum, femoral condyles meet tibia/patella,
 * and tibia/fibula meet talus. The group expresses containment of parts;
 * articulations and muscles crossing groups are separate named relations.
 *
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
