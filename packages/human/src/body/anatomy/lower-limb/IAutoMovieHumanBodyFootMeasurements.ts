import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyCalcaneusMeasurements } from "./IAutoMovieHumanBodyCalcaneusMeasurements";
import type { IAutoMovieHumanBodyTalusMeasurements } from "./IAutoMovieHumanBodyTalusMeasurements";
import type { IAutoMovieHumanBodyHalluxMeasurements } from "./IAutoMovieHumanBodyHalluxMeasurements";
import type { IAutoMovieHumanBodyMidfootMeasurements } from "./IAutoMovieHumanBodyMidfootMeasurements";
import type { IAutoMovieHumanBodyToeMeasurements } from "./IAutoMovieHumanBodyToeMeasurements";

/**
 * Hindfoot bones with distinct ankle and heel roles.
 *
 * Talus transmits the ankle articulation and calcaneus supports the heel;
 * arch bones, metatarsals and phalanges have separate named instances;
 * plantar soft tissues remain unresolved rather than fabricated from length.
 * @author Samchon
 */
export type IAutoMovieHumanBodyFootMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Articulating talus beneath tibia and fibula. */
    talus?: IAutoMovieHumanBodyTalusMeasurements;
    /** Independent posterior heel bone beneath talus. */
    calcaneus?: IAutoMovieHumanBodyCalcaneusMeasurements;
    /** Navicular, cuboid and three cuneiform tarsals. */
    midfoot?: IAutoMovieHumanBodyMidfootMeasurements;
    /** First ray with two phalanges. */
    hallux?: IAutoMovieHumanBodyHalluxMeasurements;
    /** Second ray. */
    secondToe?: IAutoMovieHumanBodyToeMeasurements;
    /** Third ray. */
    thirdToe?: IAutoMovieHumanBodyToeMeasurements;
    /** Fourth ray. */
    fourthToe?: IAutoMovieHumanBodyToeMeasurements;
    /** Fifth ray. */
    fifthToe?: IAutoMovieHumanBodyToeMeasurements;
  }>;
