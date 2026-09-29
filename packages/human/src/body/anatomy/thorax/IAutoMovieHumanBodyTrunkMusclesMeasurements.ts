import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyExternalObliqueMeasurements } from "./IAutoMovieHumanBodyExternalObliqueMeasurements";
import type { IAutoMovieHumanBodyInternalObliqueMeasurements } from "./IAutoMovieHumanBodyInternalObliqueMeasurements";
import type { IAutoMovieHumanBodyLatissimusDorsiMeasurements } from "./IAutoMovieHumanBodyLatissimusDorsiMeasurements";
import type { IAutoMovieHumanBodyPectoralisMajorMeasurements } from "./IAutoMovieHumanBodyPectoralisMajorMeasurements";
import type { IAutoMovieHumanBodyRectusAbdominisMeasurements } from "./IAutoMovieHumanBodyRectusAbdominisMeasurements";
import type { IAutoMovieHumanBodyTrapeziusMeasurements } from "./IAutoMovieHumanBodyTrapeziusMeasurements";

/**
 * One side's anterior, lateral and posterior superficial trunk muscles.
 *
 * The pectoral and latissimus tendons insert on the upper limb; trapezius
 * attaches to the shoulder girdle. This group owns their bellies while
 * cross-group bone attachments remain separate named relations.
 * @author Samchon
 */
export type IAutoMovieHumanBodyTrunkMusclesMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Anterior chest muscle beneath breast tissue. */
    pectoralisMajor?: IAutoMovieHumanBodyPectoralisMajorMeasurements;
    /** Anterior abdominal strap muscle. */
    rectusAbdominis?: IAutoMovieHumanBodyRectusAbdominisMeasurements;
    /** Superficial lateral abdominal wall. */
    externalOblique?: IAutoMovieHumanBodyExternalObliqueMeasurements;
    /** Deep lateral abdominal wall. */
    internalOblique?: IAutoMovieHumanBodyInternalObliqueMeasurements;
    /** Broad back-to-humerus muscle. */
    latissimusDorsi?: IAutoMovieHumanBodyLatissimusDorsiMeasurements;
    /** Upper-back and cervical-to-scapular muscle. */
    trapezius?: IAutoMovieHumanBodyTrapeziusMeasurements;
  }>;
