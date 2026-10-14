import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySurfaceDistance } from "../measurements/IAutoMovieHumanBodySurfaceDistance";

/**
 * One hand's overall skin length and breadth, with no authored finger mesh.
 *
 * Overall dimensions leave palm and digit proportions unknown. A future hand generator must report its source and validation for those proportions.
 *
 * @evidence contracts/common.md#principled-implementation Nonempty hand length/breadth quantities preserve independent skin-distance targets or observations without specifying digit geometry.
 * @evidence contracts/common.md#clear-and-simple-design This hand owns overall spans while the shared surface-distance contract owns measurement units and provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Overall dimensions cannot supply palm/digit proportions or a validated finger mesh.
 * @evidence contracts/common.md#meaningful-documentation Members identify distal wrist crease, middle-finger tip and second-to-fifth metacarpal breadth endpoints.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Hand surface typing performs no digit proportion fit or finger mesh generation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Hand span metadata stores no reusable palm/digit reconstruction or skin reading.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Overall hand inputs own no finger buffers, landmark registration task or acquisition handle.
 * @author Samchon
 */
export type IAutoMovieHumanBodyHandSurfaceMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Distal wrist crease to the tip of the middle finger. */
    length?: IAutoMovieHumanBodySurfaceDistance;

    /** Width across the second through fifth metacarpal heads. */
    breadth?: IAutoMovieHumanBodySurfaceDistance;
  }>;
