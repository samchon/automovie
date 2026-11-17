import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMoviePhysicalJointAxis } from "./IAutoMoviePhysicalJointAxis";

/**
 * A fixed or angularly limited connection between two rigid segments.
 *
 * Parent and child frames describe the same neutral anchor in their respective bone frames. validatePhysicalProfile checks that anchors coincide within 1e-8 metres and that joints form one connected acyclic tree with one parent per nonroot segment. An empty axes list is fixed; translations and all unlisted angular axes are locked.
 *
 * @evidence contracts/development/design.md#principled-representation Explicit frames preserve a common anchor while a list of unique angular axes identifies the only permitted relative freedoms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Articulation creation and joint-limit audits share the frame pair and axis list without a separate fixed-joint schema.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The joint graph does not infer parentage from names, and an empty axis list never means unconstrained motion.
 * @evidence contracts/development/common.md#meaningful-documentation Defines anchor frames, graph constraints, metre tolerance and locked-axis/empty-list semantics.
 */
export interface IAutoMoviePhysicalJoint {
  /** Unique profile-local id. */
  id: string;

  /** Parent segment bone. */
  parent: string;

  /** Child segment bone. */
  child: string;

  /** Joint frame in the parent bone's local frame. */
  parentFrame: IAutoMovieRigidTransform;

  /** Same joint frame in the child bone's local frame. */
  childFrame: IAutoMovieRigidTransform;

  /** Distinct free angular axes; all translations and unlisted axes are locked. */
  axes: IAutoMoviePhysicalJointAxis[];
}
