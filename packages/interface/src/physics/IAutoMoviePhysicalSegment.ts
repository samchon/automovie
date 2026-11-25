import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalShape } from "./IAutoMoviePhysicalShape";

/**
 * One massive rigid segment and its attached collision geometry.
 *
 * The neutral transform places its bone origin in the body frame. Principal
 * moments about the bone-local centre of mass use kg m²; inertiaRotation places
 * their axes in the bone frame. validatePhysicalProfile requires positive mass
 * and moments, triangle inequalities and at least one admitted shape. Equipment
 * is already included in all segment totals.
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

  /**
   * Simulation-only colliders: the physical world collides them alongside
   * `shapes`, but they carry no mass and nothing else reads them (motion
   * audits, placement and surface rays read `shapes` only), as a physics
   * engine's simulation shapes are kept apart from its query shapes (PhysX
   * `eSIMULATION_SHAPE` against `eSCENE_QUERY_SHAPE`). Ids are unique across
   * both lists; absent means none.
   */
  contactShapes?: IAutoMoviePhysicalShape[];
}
