import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyGastrocnemiusLateralHeadMeasurements } from "./IAutoMovieHumanBodyGastrocnemiusLateralHeadMeasurements";
import type { IAutoMovieHumanBodyGastrocnemiusMedialHeadMeasurements } from "./IAutoMovieHumanBodyGastrocnemiusMedialHeadMeasurements";
import type { IAutoMovieHumanBodySoleusMeasurements } from "./IAutoMovieHumanBodySoleusMeasurements";

/**
 * Calf plantarflexor group converging on the calcaneal tendon.
 *
 * @evidence contracts/common.md#principled-implementation The nonempty calf group keeps two gastrocnemius heads and soleus independently measurable.
 * @evidence contracts/common.md#clear-and-simple-design Triceps surae contains three named muscle owners without inventing a fourth group part.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A shared calcaneal tendon does not merge separate gastrocnemius and soleus quantities.
 * @evidence contracts/common.md#meaningful-documentation Comments explain convergence and which bellies cross knee versus ankle alone.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Calf group typing performs no shared-tendon deformation or muscle-volume summation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The grouping has no completed calf calculation to memoize across requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Triceps surae metadata retains no grouped muscle arrays or tendon handles.
 * @author Samchon
 */
export type IAutoMovieHumanBodyTricepsSuraeMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Medial gastrocnemius crossing knee and ankle. */
    gastrocnemiusMedialHead?: IAutoMovieHumanBodyGastrocnemiusMedialHeadMeasurements;

    /** Lateral gastrocnemius crossing knee and ankle. */
    gastrocnemiusLateralHead?: IAutoMovieHumanBodyGastrocnemiusLateralHeadMeasurements;

    /** Deep soleus crossing the ankle but not knee. */
    soleus?: IAutoMovieHumanBodySoleusMeasurements;
  }>;
