import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyInfraspinatusMeasurements } from "./IAutoMovieHumanBodyInfraspinatusMeasurements";
import type { IAutoMovieHumanBodySubscapularisMeasurements } from "./IAutoMovieHumanBodySubscapularisMeasurements";
import type { IAutoMovieHumanBodySupraspinatusMeasurements } from "./IAutoMovieHumanBodySupraspinatusMeasurements";
import type { IAutoMovieHumanBodyTeresMinorMeasurements } from "./IAutoMovieHumanBodyTeresMinorMeasurements";

/**
 * Four distinct scapula-to-humerus rotator cuff bellies around one joint.
 *
 * These muscles stabilize and rotate the humeral head through independent tendon footprints; they cannot be replaced by one shoulder skin bulge.
 *
 * @evidence contracts/common.md#principled-implementation The nonempty cuff record preserves four independently measured scapular muscles with distinct humeral attachment relationships.
 * @evidence contracts/common.md#clear-and-simple-design Each muscle owns its quantity schema; this shoulder subgroup only organizes their anatomical identities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A grouped cuff record cannot replace its separate tendon footprints with one shoulder skin bulge.
 * @evidence contracts/common.md#meaningful-documentation Members identify each scapular region and greater- or lesser-tubercle relationship needed to distinguish the bellies.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Cuff grouping evaluates no scapular segmentation or tendon-footprint geometry.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The four-member schema coordinates no completed rotator-cuff solve across shoulders.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Optional cuff quantities own no tendon meshes, solver workspaces or image handles.
 * @author Samchon
 */
export type IAutoMovieHumanBodyRotatorCuffMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Superior scapular fossa to greater tubercle. */
    supraspinatus?: IAutoMovieHumanBodySupraspinatusMeasurements;

    /** Posterior scapular fossa to greater tubercle. */
    infraspinatus?: IAutoMovieHumanBodyInfraspinatusMeasurements;

    /** Posterior scapular border to greater tubercle. */
    teresMinor?: IAutoMovieHumanBodyTeresMinorMeasurements;

    /** Anterior scapular fossa to lesser tubercle. */
    subscapularis?: IAutoMovieHumanBodySubscapularisMeasurements;
  }>;
