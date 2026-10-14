import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySkinfoldThickness } from "../measurements/IAutoMovieHumanBodySkinfoldThickness";
import type { IAutoMovieHumanBodySurfaceDistance } from "../measurements/IAutoMovieHumanBodySurfaceDistance";
import type { IAutoMovieHumanBodySurfaceGirth } from "../measurements/IAutoMovieHumanBodySurfaceGirth";

/**
 * One upper arm's skin measures, separate from the humerus and its muscles.
 *
 * The mid-upper-arm circumference and shoulder-to-elbow landmark distance constrain skin only. A measured biceps or triceps boundary needs separate imaging; neither can be inferred from one circumference alone. PhenX protocol PX021102 defines mid-upper-arm circumference between the acromion and olecranon, distinct from a maximum inside the legacy basis's shoulder–elbow search band.
 *
 * @evidence contracts/common.md#principled-implementation Nonempty upper-arm quantities retain the acromion-olecranon midpoint girth/fold and shoulder-elbow landmark distance as independent surface conditions.
 * @evidence contracts/common.md#clear-and-simple-design This regional owner names skin sites while shared quantity contracts define units and acquisition provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Clinical mid-arm circumference cannot be replaced by a legacy search-band maximum or interpreted as biceps/triceps boundary geometry.
 * @evidence contracts/common.md#meaningful-documentation Members identify relaxed-arm midpoint stations and distinguish skin conditions from humeral and muscle imaging.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Upper-arm quantity typing performs no circumference maximization or biceps/triceps segmentation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The upper-arm schema caches no clinical MUAC or source-band maximum reading.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources These arm conditions own no imaging boundary, circumference station stack or inverse task.
 * @author Samchon
 */
export type IAutoMovieHumanBodyUpperArmSurfaceMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Girth halfway from acromion to olecranon with the arm relaxed at the side; this is the clinical MUAC station, not a biceps maximum. */
    midUpperArmGirth?: IAutoMovieHumanBodySurfaceGirth;

    /** Posterior triceps skinfold at the acromion–olecranon midpoint. */
    tricepsSkinfold?: IAutoMovieHumanBodySkinfoldThickness;

    /** Palpable acromion to lateral humeral epicondyle. */
    shoulderToElbowLength?: IAutoMovieHumanBodySurfaceDistance;
  }>;
