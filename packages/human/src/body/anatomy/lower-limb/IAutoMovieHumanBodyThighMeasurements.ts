import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAdductorMagnusMeasurements } from "./IAutoMovieHumanBodyAdductorMagnusMeasurements";
import type { IAutoMovieHumanBodyFemurMeasurements } from "./IAutoMovieHumanBodyFemurMeasurements";
import type { IAutoMovieHumanBodyHamstringsMeasurements } from "./IAutoMovieHumanBodyHamstringsMeasurements";
import type { IAutoMovieHumanBodyIliotibialTractMeasurements } from "./IAutoMovieHumanBodyIliotibialTractMeasurements";
import type { IAutoMovieHumanBodyQuadricepsMeasurements } from "./IAutoMovieHumanBodyQuadricepsMeasurements";

/**
 * One thigh's internal femur, distinct from its overlying gluteal muscles.
 *
 * The femoral head participates in the hip but the whole femur has one owner here; the patella belongs at the knee. A hip or thigh girth cannot specify a femoral head radius or neck axis without further evidence.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty mapped union permits sparse thigh components while requiring one specified owner.
 * @evidence contracts/common.md#clear-and-simple-design Femur, quadriceps, hamstrings, adductor and fascial tract remain separately nested owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Hip girth supplies neither femoral head radius nor neck orientation in this schema.
 * @evidence contracts/common.md#meaningful-documentation Documentation explains unique femur ownership across hip/thigh and separate patella ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Thigh component typing performs no thigh mesh traversal or muscle segmentation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The thigh grouping does not cache or coordinate femoral reconstruction results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The thigh vocabulary stores no generated limb arrays or process handles.
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
