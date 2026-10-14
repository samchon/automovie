import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyFibulaMeasurements } from "./IAutoMovieHumanBodyFibulaMeasurements";
import type { IAutoMovieHumanBodyTibiaMeasurements } from "./IAutoMovieHumanBodyTibiaMeasurements";
import type { IAutoMovieHumanBodyTibialisAnteriorMeasurements } from "./IAutoMovieHumanBodyTibialisAnteriorMeasurements";
import type { IAutoMovieHumanBodyTibialisPosteriorMeasurements } from "./IAutoMovieHumanBodyTibialisPosteriorMeasurements";
import type { IAutoMovieHumanBodyTricepsSuraeMeasurements } from "./IAutoMovieHumanBodyTricepsSuraeMeasurements";

/**
 * The anatomical leg between knee and ankle, with separate tibia and fibula.
 *
 * The tibia bears most axial load; the fibula forms the lateral malleolus. Neither bone is duplicated under knee or foot when those joints refer to it.
 *
 * @evidence contracts/common.md#principled-implementation Nonempty tibia/fibula, triceps-surae and anterior/posterior tibialis records compose one knee-to-ankle region with independent owners.
 * @evidence contracts/common.md#clear-and-simple-design The leg aggregates named bone and muscle contracts rather than replicating knee/foot definitions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shin bones remain single owners when neighboring joints refer to them.
 * @evidence contracts/common.md#meaningful-documentation Members identify medial/lateral bones, posterior calf group and both tibialis bellies.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Leg input composition executes no shin meshing or ankle-motion algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The knee-to-ankle group retains no shared regional reconstruction output.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Leg metadata owns no extra shin skeleton, calf surface or solver task.
 * @author Samchon
 */
export type IAutoMovieHumanBodyLegMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Medial weight-bearing shin bone. */
    tibia?: IAutoMovieHumanBodyTibiaMeasurements;

    /** Independent lateral bone and ankle malleolus. */
    fibula?: IAutoMovieHumanBodyFibulaMeasurements;

    /** Posterior gastrocnemius heads and deep soleus. */
    tricepsSurae?: IAutoMovieHumanBodyTricepsSuraeMeasurements;

    /** Anterior dorsiflexor belly. */
    tibialisAnterior?: IAutoMovieHumanBodyTibialisAnteriorMeasurements;

    /** Deep posterior arch-supporting belly. */
    tibialisPosterior?: IAutoMovieHumanBodyTibialisPosteriorMeasurements;
  }>;
