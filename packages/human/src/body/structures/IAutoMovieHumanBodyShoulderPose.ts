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
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-joints Gives an author a plane, total elevation and independent humeral axial rotation for each shoulder.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints Fixes the thorax frame, sides, angles and pole equivalence of the shoulder orientation.
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
