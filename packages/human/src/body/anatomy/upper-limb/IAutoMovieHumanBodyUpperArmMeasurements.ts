import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyBicepsBrachiiMeasurements } from "./IAutoMovieHumanBodyBicepsBrachiiMeasurements";
import type { IAutoMovieHumanBodyBrachialisMeasurements } from "./IAutoMovieHumanBodyBrachialisMeasurements";
import type { IAutoMovieHumanBodyHumerusMeasurements } from "./IAutoMovieHumanBodyHumerusMeasurements";
import type { IAutoMovieHumanBodyTricepsBrachiiMeasurements } from "./IAutoMovieHumanBodyTricepsBrachiiMeasurements";

/**
 * One anatomical arm from shoulder to elbow, distinct from its shoulder girdle.
 *
 * The humerus, biceps, brachialis and triceps are owned here while deltoid and pectoralis major attach across the shoulder/chest boundary. Missing internal observations are unknown, never a zero-volume bone or permission to draw a generic tube.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty humerus/biceps/brachialis/triceps tree separately owns bone and muscle measurements for one shoulder-to-elbow region.
 * @evidence contracts/common.md#clear-and-simple-design Component schemas retain quantity definitions while shoulder/chest owners keep cross-region deltoid and pectoral attachments.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing internal observations remain unknown and cannot authorize zero-volume anatomy or a generic arm tube.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish same-side bone and anterior/deep/posterior bellies; prose gives regional and cross-group ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Upper-arm composition typing performs no internal bone/muscle reconstruction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This component tree holds no completed humeral or elbow-flexor solve to reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Arm measurement groups retain no generated tissue buffers or anatomical reconstruction task.
 * @author Samchon
 */
export type IAutoMovieHumanBodyUpperArmMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Same side's humerus and articular head. */
    humerus?: IAutoMovieHumanBodyHumerusMeasurements;

    /** Two-head anterior muscle extending onto proximal radius. */
    bicepsBrachii?: IAutoMovieHumanBodyBicepsBrachiiMeasurements;

    /** Deep anterior elbow flexor separate from biceps. */
    brachialis?: IAutoMovieHumanBodyBrachialisMeasurements;

    /** Three-head posterior elbow extensor inserting on olecranon. */
    tricepsBrachii?: IAutoMovieHumanBodyTricepsBrachiiMeasurements;
  }>;
