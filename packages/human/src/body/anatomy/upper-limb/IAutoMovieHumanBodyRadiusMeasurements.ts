import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Target or observed dimensions of the lateral forearm bone, the radius.
 *
 * Its proximal head turns at the humerus and its distal surface carries the wrist; this bone is independent of the ulna even when an exterior forearm girth is the only user input. Its volume does not specify either joint face.
 *
 * @evidence contracts/common.md#principled-implementation Nonempty maximum radius length and segmented volume preserve the lateral forearm bone's separate target/observation provenance.
 * @evidence contracts/common.md#clear-and-simple-design The radius owns osseous quantities while common length/volume types define measurement units and acquisition details.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exterior girth cannot substitute for radius/ulna separation or reconstruct radial head and distal wrist surfaces from volume.
 * @evidence contracts/common.md#meaningful-documentation Members specify head-to-styloid extent and radius-only volume, and prose explains its two distinct articulations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Radius typing computes no proximal/distal joint surface or radioulnar motion.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Radial scalar inputs store no evaluated wrist/head shape to share across body states.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Radius metadata owns no segmented bone array or pronation solver handle.
 * @author Samchon
 */
export type IAutoMovieHumanBodyRadiusMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Whole osseous radius from head to styloid, not skin forearm length. */
    maximumLength?: IAutoMovieHumanBodyAnatomicalLength;

    /** Segmented radius alone, excluding ulna and carpal bones. */
    boneVolume?: IAutoMovieHumanBodyAnatomicalVolume;
  }>;
