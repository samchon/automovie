import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyMass } from "../measurements/IAutoMovieHumanBodyMass";
import type { IAutoMovieHumanBodyStandingStature } from "../measurements/IAutoMovieHumanBodyStandingStature";
import type { IAutoMovieHumanBodyLowerLimbSurfaceMeasurements } from "./IAutoMovieHumanBodyLowerLimbSurfaceMeasurements";
import type { IAutoMovieHumanBodyTrunkSurfaceMeasurements } from "./IAutoMovieHumanBodyTrunkSurfaceMeasurements";
import type { IAutoMovieHumanBodyUpperLimbSurfaceMeasurements } from "./IAutoMovieHumanBodyUpperLimbSurfaceMeasurements";

/**
 * The editor's desired or observed anthropometric dimensions.
 *
 * Existing simple stature, mass and six symmetric girths can enter as `target` values. Its shoulder-joint distance is not the biacromial skin breadth defined here. A detailed editor can preserve real left/right asymmetry and additional named measures. No property denotes a mesh vertex, spline control point or arbitrary deformation weight. A missing value is unknown; population inference must carry its source and validation. A fictional target never claims a stadiometer, scan or clinical observation.
 *
 * @evidence contracts/common.md#principled-implementation The nonempty anthropometric tree preserves stature, mass and bilateral regional conditions with separate target/observation provenance.
 * @evidence contracts/common.md#clear-and-simple-design Shared quantity types own acquisition details and regional records own skin sites; this root composes their optional ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing quantities remain unknown; joint separation cannot replace biacromial skin breadth and fictional targets cannot masquerade as measurements.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies asymmetric detailed inputs, surface ownership and the exclusion of vertex or deformation controls.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Anthropometric root typing performs no population inference or mesh deformation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The desired/observed quantity tree stores no completed body evaluation cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Numerical anthropometric records acquire no source mesh, clinical acquisition process or body-builder handle.
 * @author Samchon
 */
export type IAutoMovieHumanBodySurfaceMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Standing floor-to-vertex height with target or acquisition provenance. */
    stature?: IAutoMovieHumanBodyStandingStature;

    /** Whole-body mass, distinct from any tissue compartment volume. */
    mass?: IAutoMovieHumanBodyMass;

    /** Trunk skin dimensions and site-specific folds. */
    trunk?: IAutoMovieHumanBodyTrunkSurfaceMeasurements;

    /** Independently supplied left arm and hand exterior conditions. */
    leftUpperLimb?: IAutoMovieHumanBodyUpperLimbSurfaceMeasurements;

    /** Right arm and hand conditions, without mirroring the left input. */
    rightUpperLimb?: IAutoMovieHumanBodyUpperLimbSurfaceMeasurements;

    /** Independently supplied left thigh, shank and foot conditions. */
    leftLowerLimb?: IAutoMovieHumanBodyLowerLimbSurfaceMeasurements;

    /** Right lower-limb exterior conditions, preserving asymmetry. */
    rightLowerLimb?: IAutoMovieHumanBodyLowerLimbSurfaceMeasurements;
  }>;
