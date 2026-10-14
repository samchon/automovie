import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyCalcaneusMeasurements } from "./IAutoMovieHumanBodyCalcaneusMeasurements";
import type { IAutoMovieHumanBodyHalluxMeasurements } from "./IAutoMovieHumanBodyHalluxMeasurements";
import type { IAutoMovieHumanBodyMidfootMeasurements } from "./IAutoMovieHumanBodyMidfootMeasurements";
import type { IAutoMovieHumanBodyTalusMeasurements } from "./IAutoMovieHumanBodyTalusMeasurements";
import type { IAutoMovieHumanBodyToeMeasurements } from "./IAutoMovieHumanBodyToeMeasurements";

/**
 * Hindfoot bones with distinct ankle and heel roles.
 *
 * Talus transmits the ankle articulation and calcaneus supports the heel; arch bones, metatarsals and phalanges have separate named instances; plantar soft tissues remain unresolved rather than fabricated from length.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty foot group composes distinct talus/calcaneus/midfoot and five ray measurement owners.
 * @evidence contracts/common.md#clear-and-simple-design Foot containment imports each bone/ray contract instead of copying joint or surface definitions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Plantar tissues stay unresolved rather than being fabricated from external foot length.
 * @evidence contracts/common.md#meaningful-documentation Members identify hindfoot, tarsals, two-phalange hallux and independent second-through-fifth rays.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Foot grouping performs no arch reconstruction or plantar-contact algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Named foot membership caches no generated hindfoot or ray measurements.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The foot input group acquires no plantar skin or tarsal mesh population.
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
