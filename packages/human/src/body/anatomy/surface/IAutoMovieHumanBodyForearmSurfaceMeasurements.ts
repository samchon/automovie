import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySurfaceDistance } from "../measurements/IAutoMovieHumanBodySurfaceDistance";
import type { IAutoMovieHumanBodySurfaceGirth } from "../measurements/IAutoMovieHumanBodySurfaceGirth";

/**
 * One forearm's outer dimensions, independent of radius and ulna geometry.
 *
 * Maximum circumference includes muscle, fat and skin. Elbow-to-wrist landmark length is not the length of either of the two forearm bones.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty forearm record keeps maximum and wrist girths distinct from an elbow-to-wrist landmark distance.
 * @evidence contracts/common.md#clear-and-simple-design Shared girth/distance schemas carry acquisition meaning while this region owns its three exterior quantities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Circumference includes multiple tissues and elbow-to-wrist skin length cannot substitute for either forearm bone's length.
 * @evidence contracts/common.md#meaningful-documentation Members give relaxed-axis girth, wrist station and epicondyle-to-styloid endpoint definitions.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Forearm measurement typing runs no radial/ulnar inference or skin cross-section integration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This regional scalar record owns no completed forearm instrument reading to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Forearm quantities acquire no measurement-plane buffers or bone reconstruction resources.
 * @author Samchon
 */
export type IAutoMovieHumanBodyForearmSurfaceMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Maximum girth of the relaxed forearm perpendicular to its long axis. */
    maximumGirth?: IAutoMovieHumanBodySurfaceGirth;

    /** Girth immediately proximal to the wrist's styloid processes. */
    wristGirth?: IAutoMovieHumanBodySurfaceGirth;

    /** Lateral humeral epicondyle to the radial styloid. */
    elbowToWristLength?: IAutoMovieHumanBodySurfaceDistance;
  }>;
