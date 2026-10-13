import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyExternalObliqueAponeurosisMeasurements } from "./IAutoMovieHumanBodyExternalObliqueAponeurosisMeasurements";
import type { IAutoMovieHumanBodyExternalObliqueMeasurements } from "./IAutoMovieHumanBodyExternalObliqueMeasurements";
import type { IAutoMovieHumanBodyInternalObliqueMeasurements } from "./IAutoMovieHumanBodyInternalObliqueMeasurements";
import type { IAutoMovieHumanBodyLatissimusDorsiMeasurements } from "./IAutoMovieHumanBodyLatissimusDorsiMeasurements";
import type { IAutoMovieHumanBodyPectoralisMajorMeasurements } from "./IAutoMovieHumanBodyPectoralisMajorMeasurements";
import type { IAutoMovieHumanBodyRectusAbdominisMeasurements } from "./IAutoMovieHumanBodyRectusAbdominisMeasurements";
import type { IAutoMovieHumanBodyTrapeziusMeasurements } from "./IAutoMovieHumanBodyTrapeziusMeasurements";

/**
 * One side's anterior, lateral and posterior trunk muscle bellies and the external-oblique aponeurotic sheet.
 *
 * The pectoral and latissimus tendons insert on the upper limb; trapezius attaches to the shoulder girdle. This group owns their bellies while cross-group bone attachments remain separate named relations.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty same-side group distinguishes six muscle bellies and the external-oblique aponeurotic sheet under their own tissue schemas.
 * @evidence contracts/common.md#clear-and-simple-design Trunk ownership contains belly quantities while cross-group humeral and shoulder-girdle attachments remain separate named relations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neighboring skin contours cannot merge distinct superficial/deep bellies or replace fibrous aponeurosis with muscle volume.
 * @evidence contracts/common.md#meaningful-documentation Members identify chest, anterior/lateral abdomen and posterior/cervical scope, and prose explains cross-region tendon ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Trunk muscle grouping performs no belly segmentation or cross-region tendon computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The same-side tissue composition stores no completed multi-muscle boundary reconstruction.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Optional trunk tissue carriers retain no tendon geometry, muscle meshes or attachment solver.
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

    /** Separate aponeurotic sheet continued from external oblique. */
    externalObliqueAponeurosis?: IAutoMovieHumanBodyExternalObliqueAponeurosisMeasurements;

    /** Deep lateral abdominal wall. */
    internalOblique?: IAutoMovieHumanBodyInternalObliqueMeasurements;

    /** Broad back-to-humerus muscle. */
    latissimusDorsi?: IAutoMovieHumanBodyLatissimusDorsiMeasurements;

    /** Upper-back and cervical-to-scapular muscle. */
    trapezius?: IAutoMovieHumanBodyTrapeziusMeasurements;
  }>;
