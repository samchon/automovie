import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieCapsuleProxy } from "../validation/IAutoMovieCapsuleProxy";

/**
 * One volume the panel is kept out of.
 *
 * Colliders are stated in world space beside the rest mesh rather than pulled from the building graph, so the same rug drapes over the same step whether or not a building owns the frame. A binding may of course place both.
 *
 * @evidence contracts/common.md#principled-implementation simulateSoftBody projects predicted particles out of static half-spaces, spheres and boxes; boundary-aware wearable evaluation resolves actor capsules before capsule projection.
 * @evidence contracts/common.md#clear-and-simple-design The union distinguishes authored static geometry from actor-local moving capsule references without importing building geometry into the solver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Projection occurs once per collider in authored order and has no friction or continuous sweep; overlapping volumes can leave an earlier collider unsatisfied after a later projection.
 * @evidence contracts/common.md#meaningful-documentation Each arm states its frame and geometry parameters; body capsules require evaluated actor boundaries rather than static solver inference.
 * @author Samchon
 */
export type IAutoMovieSoftCollider =
  | IAutoMovieSoftCollider.IPlane
  | IAutoMovieSoftCollider.ISphere
  | IAutoMovieSoftCollider.IBox
  | IAutoMovieSoftCollider.IBodyCapsule;
export namespace IAutoMovieSoftCollider {
  /**
   * Half-space with an allowed outward side.
   *
   * @evidence contracts/common.md#principled-implementation The solver normalizes the nonzero normal, tests signed distance against offset and translates penetrating particles along that normal to the boundary.
   * @evidence contracts/common.md#clear-and-simple-design Normal and offset describe one infinite plane without a mesh or redundant point representation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The plane is infinite and frictionless; its projection does not pretend to model a finite tabletop edge.
   * @evidence contracts/common.md#meaningful-documentation The inequality identifies the allowed side, normalization convention and world-space metre offset.
   * @author Samchon
   */
  export interface IPlane {
    /** Discriminator. */
    kind: "plane";

    /** Stable collider identity within the domain. */
    id: string;

    /** Outward normal of the allowed side; non-zero and need not be unit. */
    normal: IAutoMovieVector3;

    /** Particles are kept where `dot(normalize(normal), p) >= offset`. */
    offset: number;
  }

  /**
   * Static spherical exclusion volume.
   *
   * @evidence contracts/common.md#principled-implementation Sphere projection compares squared centre distance and moves an interior particle radially to the positive radius; an exact-centre point uses a deterministic axis because its radial direction is undefined.
   * @evidence contracts/common.md#clear-and-simple-design Centre and radius are sufficient for the sphere contact calculation; id preserves the authored collider identity.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The exact-centre tie-break is a geometric degeneracy rule, not a fixture path; discrete projection does not detect passage through the ball between steps.
   * @evidence contracts/common.md#meaningful-documentation Fields state world centre, positive metre radius and domain-local identity.
   * @author Samchon
   */
  export interface ISphere {
    /** Discriminator. */
    kind: "sphere";

    /** Stable collider identity within the domain. */
    id: string;

    /** World centre. */
    center: IAutoMovieVector3;

    /** Strictly positive radius in metres. */
    radius: number;
  }

  /**
   * Static axis-aligned world exclusion box.
   *
   * @evidence contracts/common.md#principled-implementation An interior particle is projected through its nearest face, comparing distances to all six authored bounds; equal opposing distances choose the maximum side deterministically.
   * @evidence contracts/common.md#clear-and-simple-design Two corners express the supported unrotated box, leaving oriented geometry outside this arm.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Mid-plane ties can break mirror symmetry and ordered collider projections need not satisfy every overlapping box; no relaxation certificate is claimed.
   * @evidence contracts/common.md#meaningful-documentation Members identify world coordinates and strictly ordered corners, while the evidence states the tie and discrete-contact limits.
   * @author Samchon
   */
  export interface IBox {
    /** Discriminator. */
    kind: "box";

    /** Stable collider identity within the domain. */
    id: string;

    /** Minimum corner. */
    min: IAutoMovieVector3;

    /** Maximum corner, strictly greater on every axis. */
    max: IAutoMovieVector3;
  }

  /**
   * Shared capsule following one actor's evaluated humanoid pose.
   *
   * @evidence contracts/common.md#principled-implementation The wearable boundary sampler transforms the shared actor-local capsule using the evaluated pose at each fixed-step boundary; the solver projects against the resulting segment and radius.
   * @evidence contracts/common.md#clear-and-simple-design This arm references an actor and the existing capsule proxy instead of maintaining a second body-collision shape schema.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts simulateSoftBody refuses body capsules without resolved moving boundaries; an actor name is not replaced by a static origin capsule.
   * @evidence contracts/common.md#meaningful-documentation Fields separate domain collider identity, actor participant identity and the actor-local capsule from the resolved world contact shape.
   * @author Samchon
   */
  export interface IBodyCapsule {
    /** Body-following capsule discriminator. */
    kind: "body-capsule";

    /** Stable collider identity within the domain. */
    id: string;

    /** Stable actor participant whose pose places the capsule. */
    actor: string;

    /** Actor-local capsule shared with body validation and contact systems. */
    capsule: IAutoMovieCapsuleProxy;
  }
}
