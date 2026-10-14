/**
 * One thorax-relative humeral orientation in tilt-and-torsion coordinates.
 *
 * The body basis fixes +X toward the subject's left, +Y superior and +Z
 * anterior. A plane of 0° elevates laterally on either side, +90° elevates
 * anteriorly and -90° posteriorly. Elevation is the total humerothoracic
 * angle from a hanging arm, not a local glenohumeral angle. Positive axial
 * rotation is external. At elevation 0° the plane is unobservable; at 180°
 * `(plane + d, axialRotation - 2d)` is the same orientation. Both poles remain
 * authorable, and these equivalent angles are never silently canonicalized.
 *
 * @evidence contracts/common.md#principled-implementation Tilt-and-torsion coordinates identify total thorax-relative humeral orientation; poles preserve authorable equivalent angles.
 * @evidence contracts/common.md#clear-and-simple-design The explicit upper-arm choice keeps side separate from three angular coordinates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equivalent pole coordinates remain unchanged rather than being canonicalized to conceal a singularity.
 * @evidence contracts/common.md#meaningful-documentation The prose gives body axes, degree signs, total elevation meaning and pole degeneracies.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The shoulder orientation coordinates declaration is erased by TypeScript and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shoulder orientation coordinates schema coordinates no requests or cached computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The shoulder orientation coordinates type acquires no handles, tasks or retained storage.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyShoulderPose {
  /** Which measured upper arm receives this thorax-relative goal. */
  bone: "leftUpperArm" | "rightUpperArm";

  /** Degrees in [-180, 180); 0 lateral, +90 anterior. */
  plane: number;

  /** Total humerothoracic elevation in degrees. */
  elevation: number;

  /** Humeral external (+) or internal (−) axial rotation in degrees. */
  axialRotation: number;
}
