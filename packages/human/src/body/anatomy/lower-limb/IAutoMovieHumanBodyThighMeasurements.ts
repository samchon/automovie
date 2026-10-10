import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAdductorMagnusMeasurements } from "./IAutoMovieHumanBodyAdductorMagnusMeasurements";
import type { IAutoMovieHumanBodyFemurMeasurements } from "./IAutoMovieHumanBodyFemurMeasurements";
import type { IAutoMovieHumanBodyHamstringsMeasurements } from "./IAutoMovieHumanBodyHamstringsMeasurements";
import type { IAutoMovieHumanBodyIliotibialTractMeasurements } from "./IAutoMovieHumanBodyIliotibialTractMeasurements";
import type { IAutoMovieHumanBodyQuadricepsMeasurements } from "./IAutoMovieHumanBodyQuadricepsMeasurements";

/**
 * One thigh's internal femur, distinct from its overlying gluteal muscles.
 *
 * The femoral head participates in the hip but the whole femur has one owner
 * here; the patella belongs at the knee. A hip or thigh girth cannot specify
 * a femoral head radius or neck axis without further evidence.
 *
 * @author Samchon
 */
export type IAutoMovieHumanBodyThighMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Full femur including head, neck, shaft and distal condyles. */
    femur?: IAutoMovieHumanBodyFemurMeasurements;

    /** Four-head anterior extensor group. */
    quadriceps?: IAutoMovieHumanBodyQuadricepsMeasurements;

    /** Posterior hip/knee muscles with independent bellies. */
    hamstrings?: IAutoMovieHumanBodyHamstringsMeasurements;

    /** Large separate medial adductor. */
    adductorMagnus?: IAutoMovieHumanBodyAdductorMagnusMeasurements;

    /** Lateral fascial tract receiving superficial gluteal fibres. */
    iliotibialTract?: IAutoMovieHumanBodyIliotibialTractMeasurements;
  }>;
