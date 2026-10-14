import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Target or observed dimensions of one scapula behind the thorax.
 *
 * The glenoid articulates with the humeral head and the acromion with the clavicle; the scapulothoracic glide is a separate motion of this bone over the rib cage. A skin shoulder point does not settle its angle, shape or landmarks. Marques et al. (doi:10.1007/s10439-025-03768-1) studied 56 decedent right scapulae using four digitally acquired CT skin/bone landmarks, with 39 fitting and 17 assessment cases. Their statistical reconstruction is not a living palpation protocol; this record supplies neither their model nor landmark correspondence. These scalars cannot masquerade as a resolved scapula.
 *
 * @evidence contracts/common.md#principled-implementation Nonempty bony height, breadth and segmented volume remain independent scalars rather than a resolved scapular shape or orientation.
 * @evidence contracts/common.md#clear-and-simple-design One scapula owns the measurements while shared length/volume types own units and acquisition provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Skin shoulder points cannot locate the glenoid or scapular landmarks; the referenced statistical reconstruction is not implemented by this input schema.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish bony spans from skin breadth and explain missing landmark, articulation and glide information.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Scapula measurement typing performs no statistical shape fit or scapulothoracic glide computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Scapular scalar metadata owns no fitted CT surface or digital-landmark correspondence to reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The scapula record retains no statistical model, CT volume or glide solver task.
 * @author Samchon
 */
export type IAutoMovieHumanBodyScapulaMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Segmented scapula alone, excluding rotator-cuff muscle and cartilage. */
    boneVolume?: IAutoMovieHumanBodyAnatomicalVolume;

    /** Maximum bony superior-inferior span on an imaged scapula. */
    height?: IAutoMovieHumanBodyAnatomicalLength;

    /** Maximum bony medial-lateral span, not shoulder breadth through skin. */
    breadth?: IAutoMovieHumanBodyAnatomicalLength;
  }>;
