import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalShape } from "./IAutoMoviePhysicalShape";

/**
 * One massive rigid segment and its attached collision geometry.
 *
 * The neutral transform places its bone origin in the body frame. Principal moments about the bone-local centre of mass use kg m²; inertiaRotation places their axes in the bone frame. validatePhysicalProfile requires positive mass and moments, triangle inequalities and at least one admitted shape. Equipment is already included in all segment totals.
 *
 * @evidence contracts/development/design.md#principled-representation A centre of mass, diagonal principal moments and a principal-axis rotation describe arbitrary rigid inertia without assuming the bone axes diagonalize it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Native articulation construction and body-centre calculations read these fields; collider mass is incorporated in the segment rather than counted independently.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The segment uses arbitrary bone identity and explicit measured or derived inertia, without choosing a shape or mass from an anatomical name.
 * @evidence contracts/development/common.md#meaningful-documentation Defines neutral and inertia frames, kilograms, metre centre, kg m² moments and nonempty shapes.
 */
export interface IAutoMoviePhysicalSegment {
  /** Arbitrary skeleton bone id, not a humanoid vocabulary. */
  bone: string;

  /** Neutral bone origin in the body frame. */
  neutral: IAutoMovieRigidTransform;

  /** Kilograms including all attached equipment. */
  mass: number;

  /** Bone-local metre centre, including equipment. */
  centerOfMass: IAutoMovieVector3;

  /** Principal moments, kg m², about centerOfMass. */
  inertia: IAutoMovieVector3;

  /** Principal-inertia axes in the bone-local frame. */
  inertiaRotation: IAutoMovieQuaternion;

  /** At least one finite solid collider, including optional equipment shapes. */
  shapes: IAutoMoviePhysicalShape[];
}
