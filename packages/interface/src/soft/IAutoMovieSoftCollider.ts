import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieCapsuleProxy } from "../validation/IAutoMovieCapsuleProxy";

/**
 * One volume the panel is kept out of.
 *
 * Static colliders are stated in world space beside the rest mesh rather than
 * pulled from the building graph. The body-capsule arm instead names
 * actor-local bone endpoints that the wearable resolver places from supplied
 * world poses.
 */
export type IAutoMovieSoftCollider =
  | IAutoMovieSoftCollider.IPlane
  | IAutoMovieSoftCollider.ISphere
  | IAutoMovieSoftCollider.IBox
  | IAutoMovieSoftCollider.IBodyCapsule;
/** Static world exclusions and actor-following capsule references. */
export namespace IAutoMovieSoftCollider {
  /** Half-space with an allowed outward side. */
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

  /** Static spherical exclusion volume. */
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

  /** Static axis-aligned world exclusion box. */
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

  /** Shared capsule following one actor's evaluated humanoid pose. */
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
