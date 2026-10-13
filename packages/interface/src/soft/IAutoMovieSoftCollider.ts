import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieCapsuleProxy } from "../validation/IAutoMovieCapsuleProxy";

/**
 * One volume the panel is kept out of.
 *
 * Colliders are stated in world space beside the rest mesh rather than pulled
 * from the building graph, so the same rug drapes over the same step whether or
 * not a building owns the frame. A binding may of course place both.
 */
export type IAutoMovieSoftCollider =
  | IAutoMovieSoftCollider.IPlane
  | IAutoMovieSoftCollider.ISphere
  | IAutoMovieSoftCollider.IBox
  | IAutoMovieSoftCollider.IBodyCapsule;
export namespace IAutoMovieSoftCollider {
  /** A half-space: the floor, a wall, a table top extended to infinity. */
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

  /** A ball: a cushion's stuffing, a finial, a bolster. */
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

  /** An axis-aligned world box: a sill, a shelf, a sofa arm, a crate. */
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
