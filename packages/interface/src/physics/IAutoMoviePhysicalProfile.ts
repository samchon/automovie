import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalJoint } from "./IAutoMoviePhysicalJoint";
import type { IAutoMoviePhysicalMaterial } from "./IAutoMoviePhysicalMaterial";
import type { IAutoMoviePhysicalSegment } from "./IAutoMoviePhysicalSegment";

/**
 * A solver-neutral articulated body in SI units, with +Y up.
 *
 * Segment neutral transforms place bone origins in the body frame; inertia and colliders use bone-local frames. Equipment contributes shapes and mass to a segment. validatePhysicalProfile checks finite native-representable physical quantities, unit rotations, positive principal moments satisfying the triangle inequalities, total mass/centre consistency, known materials and a connected acyclic joint tree. It returns diagnostic paths without repairing the input. Providers own the mutable data and its provenance; simulation admission consumes the same description for every body.
 *
 * @evidence contracts/development/design.md#principled-representation Mass, centre of mass, principal inertia and explicit joint/collider frames specify a rigid articulation in kilograms, metres, seconds and radians; the validator checks numerical and cross-record invariants.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Providers, physical simulation and auditing share this canonical description; optical materials and authored anatomical degrees remain separate contracts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Bone names are unrestricted identities rather than a humanoid catalogue, and equipment changes physical mass instead of adding a second overlapping body.
 * @evidence contracts/development/common.md#meaningful-documentation Defines frame ownership, SI units, provider provenance and the validation path and its refusal-only behavior.
 */
export interface IAutoMoviePhysicalProfile {
  /** Stable provider/content identity, never used to select physical behavior. */
  id: string;

  /** Total kilograms, including equipment; must equal segment masses. */
  mass: number;

  /** Neutral body-frame centre, metres; checked against the segment sum. */
  centerOfMass: IAutoMovieVector3;

  /** Nonempty unique bones, in any order; joints define a connected tree. */
  segments: IAutoMoviePhysicalSegment[];

  /** Exactly one parent for every nonroot segment. */
  joints: IAutoMoviePhysicalJoint[];

  /** Explicit overlapping pivot neighbours; other self collisions remain enabled. */
  collisionExclusions?: {
    /** First segment. */ a: string;

    /** Second segment. */ b: string;

    /** Geometric reason for this exclusion. */ reason: string;
  }[];

  /** Contact parameters addressed by shapes, independently of optical materials. */
  materials: IAutoMoviePhysicalMaterial[];

  /** Provider's source, population limits and approximation uncertainty. */
  provenance: string;
}
