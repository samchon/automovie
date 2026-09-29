import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyFibulaMeasurements } from "./IAutoMovieHumanBodyFibulaMeasurements";
import type { IAutoMovieHumanBodyTibiaMeasurements } from "./IAutoMovieHumanBodyTibiaMeasurements";
import type { IAutoMovieHumanBodyTibialisAnteriorMeasurements } from "./IAutoMovieHumanBodyTibialisAnteriorMeasurements";
import type { IAutoMovieHumanBodyTibialisPosteriorMeasurements } from "./IAutoMovieHumanBodyTibialisPosteriorMeasurements";
import type { IAutoMovieHumanBodyTricepsSuraeMeasurements } from "./IAutoMovieHumanBodyTricepsSuraeMeasurements";

/**
 * The anatomical leg between knee and ankle, with separate tibia and fibula.
 *
 * The tibia bears most axial load; the fibula forms the lateral malleolus.
 * Neither bone is duplicated under knee or foot when those joints refer to it.
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
