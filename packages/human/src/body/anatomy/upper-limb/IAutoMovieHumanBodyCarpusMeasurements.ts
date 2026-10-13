import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySmallBoneMeasurements } from "../measurements/IAutoMovieHumanBodySmallBoneMeasurements";

/**
 * Eight anatomically named carpal bones of one wrist, each measured alone.
 *
 * The proximal row meets radius and the distal row meets metacarpals. A single wrist girth never licenses merging their distinct joint surfaces.
 *
 * @evidence contracts/common.md#principled-implementation Nonempty named fields preserve eight distinct proximal/distal carpal bones with individual small-bone quantities.
 * @evidence contracts/common.md#clear-and-simple-design The wrist collection owns closed anatomical names while the small-bone schema owns lengths and volumes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts One wrist girth cannot merge separately articulating carpals or reconstruct their joint surfaces.
 * @evidence contracts/common.md#meaningful-documentation Members identify radial/ulnar and proximal/distal positions including pisiform's sesamoid relationship.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Carpal grouping performs no wrist joint-surface fit or individual bone generation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Eight carpal inputs store no completed proximal/distal row correspondence to cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Wrist bone records own no articular surface buffers or carpal assembly task.
 * @author Samchon
 */
export type IAutoMovieHumanBodyCarpusMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Radial proximal carpal. */
    scaphoid?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Central proximal carpal. */
    lunate?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Ulnar proximal carpal. */
    triquetrum?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Sesamoid bone anterior to triquetrum. */
    pisiform?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Distal radial carpal under thumb. */
    trapezium?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Distal carpal beneath index metacarpal. */
    trapezoid?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Central large distal carpal. */
    capitate?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Distal ulnar carpal. */
    hamate?: IAutoMovieHumanBodySmallBoneMeasurements;
  }>;
