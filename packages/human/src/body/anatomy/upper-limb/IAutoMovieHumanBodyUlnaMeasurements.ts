import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Target or observed dimensions of the medial forearm bone, the ulna.
 *
 * Its olecranon contributes to the elbow, while the radius rotates relative to it during pronation and supination. A single forearm cylinder cannot replace the two-bone relationship or reveal the olecranon from skin girth.
 *
 * @evidence contracts/common.md#principled-implementation Nonempty ulnar osseous length/volume quantities preserve medial forearm bone identity and independent acquisition provenance.
 * @evidence contracts/common.md#clear-and-simple-design Shared physical quantity types own measurement details while this ulna record names olecranon-to-styloid scope.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts One forearm cylinder or skin girth cannot replace the two-bone relationship or locate the olecranon.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish osseous extent from tape length and exclude radius/elbow cartilage from volume.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Ulna measurement typing performs no olecranon fitting or radioulnar articulation solve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Ulnar scalar records store no equivalent pronated/supinated bone geometry to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Ulna inputs own no elbow surface, segmented radius/ulna arrays or motion solver.
 * @author Samchon
 */
export type IAutoMovieHumanBodyUlnaMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Olecranon-to-styloid osseous extent, not a surface tape length. */
    maximumLength?: IAutoMovieHumanBodyAnatomicalLength;

    /** Segmented ulna alone, excluding radius and elbow cartilage. */
    boneVolume?: IAutoMovieHumanBodyAnatomicalVolume;
  }>;
