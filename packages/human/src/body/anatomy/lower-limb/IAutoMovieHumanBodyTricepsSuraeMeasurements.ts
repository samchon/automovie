import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyGastrocnemiusLateralHeadMeasurements } from "./IAutoMovieHumanBodyGastrocnemiusLateralHeadMeasurements";
import type { IAutoMovieHumanBodyGastrocnemiusMedialHeadMeasurements } from "./IAutoMovieHumanBodyGastrocnemiusMedialHeadMeasurements";
import type { IAutoMovieHumanBodySoleusMeasurements } from "./IAutoMovieHumanBodySoleusMeasurements";

/** Calf plantarflexor group converging on the calcaneal tendon. @author Samchon */
export type IAutoMovieHumanBodyTricepsSuraeMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Medial gastrocnemius crossing knee and ankle. */
    gastrocnemiusMedialHead?: IAutoMovieHumanBodyGastrocnemiusMedialHeadMeasurements;
    /** Lateral gastrocnemius crossing knee and ankle. */
    gastrocnemiusLateralHead?: IAutoMovieHumanBodyGastrocnemiusLateralHeadMeasurements;
    /** Deep soleus crossing the ankle but not knee. */
    soleus?: IAutoMovieHumanBodySoleusMeasurements;
  }>;
