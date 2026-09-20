import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieCapsuleProxy } from "../validation/IAutoMovieCapsuleProxy";

/**
 * One volume the panel is kept out of.
 *
 * Colliders are stated in world space beside the rest mesh rather than pulled
 * from the building graph, so the same rug drapes over the same step whether or
 * not a building owns the frame. A binding may of course place both.
 *
 * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-colliders Exposes `IAutoMovieSoftCollider` as the portable data boundary for the effects soft colliders requirement.
 * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `IAutoMovieSoftCollider` for the soft collider and solver transition system contract.
 */
export type IAutoMovieSoftCollider =
  | IAutoMovieSoftCollider.IPlane
  | IAutoMovieSoftCollider.ISphere
  | IAutoMovieSoftCollider.IBox
  | IAutoMovieSoftCollider.IBodyCapsule;
export namespace IAutoMovieSoftCollider {
  /**
   * A half-space: the floor, a wall, a table top extended to infinity.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `IPlane` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `IPlane` for the interior space soft furnishing planting system contract.
   */
  export interface IPlane {
    /**
     * Discriminator.
     *
     * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `kind` as the portable data boundary for the interior soft anchor host requirement.
     * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `kind` for the interior space soft furnishing planting system contract.
     */
    kind: "plane";

    /**
     * Stable collider identity within the domain.
     *
     * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `id` as the portable data boundary for the interior soft anchor host requirement.
     * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `id` for the interior space soft furnishing planting system contract.
     */
    id: string;

    /**
     * Outward normal of the allowed side; non-zero and need not be unit.
     *
     * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `normal` as the portable data boundary for the interior soft anchor host requirement.
     * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `normal` for the interior space soft furnishing planting system contract.
     */
    normal: IAutoMovieVector3;

    /**
     * Particles are kept where `dot(normalize(normal), p) >= offset`.
     *
     * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `offset` as the portable data boundary for the interior soft anchor host requirement.
     * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `offset` for the interior space soft furnishing planting system contract.
     */
    offset: number;
  }

  /**
   * A ball: a cushion's stuffing, a finial, a bolster.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `ISphere` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `ISphere` for the interior space soft furnishing planting system contract.
   */
  export interface ISphere {
    /**
     * Discriminator.
     *
     * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `kind` as the portable data boundary for the interior soft anchor host requirement.
     * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `kind` for the interior space soft furnishing planting system contract.
     */
    kind: "sphere";

    /**
     * Stable collider identity within the domain.
     *
     * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `id` as the portable data boundary for the interior soft anchor host requirement.
     * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `id` for the interior space soft furnishing planting system contract.
     */
    id: string;

    /**
     * World centre.
     *
     * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `center` as the portable data boundary for the interior soft anchor host requirement.
     * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `center` for the interior space soft furnishing planting system contract.
     */
    center: IAutoMovieVector3;

    /**
     * Strictly positive radius in metres.
     *
     * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `radius` as the portable data boundary for the interior soft anchor host requirement.
     * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `radius` for the interior space soft furnishing planting system contract.
     */
    radius: number;
  }

  /**
   * An axis-aligned world box: a sill, a shelf, a sofa arm, a crate.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `IBox` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `IBox` for the interior space soft furnishing planting system contract.
   */
  export interface IBox {
    /**
     * Discriminator.
     *
     * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `kind` as the portable data boundary for the interior soft anchor host requirement.
     * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `kind` for the interior space soft furnishing planting system contract.
     */
    kind: "box";

    /**
     * Stable collider identity within the domain.
     *
     * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `id` as the portable data boundary for the interior soft anchor host requirement.
     * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `id` for the interior space soft furnishing planting system contract.
     */
    id: string;

    /**
     * Minimum corner.
     *
     * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `min` as the portable data boundary for the interior soft anchor host requirement.
     * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `min` for the interior space soft furnishing planting system contract.
     */
    min: IAutoMovieVector3;

    /**
     * Maximum corner, strictly greater on every axis.
     *
     * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `max` as the portable data boundary for the interior soft anchor host requirement.
     * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `max` for the interior space soft furnishing planting system contract.
     */
    max: IAutoMovieVector3;
  }

  /**
   * Shared capsule following one actor's evaluated humanoid pose.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-colliders Reuses the body capsule representation for soft contact.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Resolves moving capsule geometry before ordered collision projection.
   * @author Samchon
   */
  export interface IBodyCapsule {
    /**
     * Body-following capsule discriminator.
     *
     * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-colliders Distinguishes a moving body proxy from static world primitives.
     * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Selects evaluated-pose capsule resolution.
     */
    kind: "body-capsule";

    /**
     * Stable collider identity within the domain.
     *
     * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-colliders Gives the shared collider a traceable identity.
     * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Preserves deterministic collider ordering.
     */
    id: string;

    /**
     * Stable actor participant whose pose places the capsule.
     *
     * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-colliders Refuses a missing body target instead of inventing an origin collider.
     * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Joins the shared proxy to one evaluated actor pose.
     */
    actor: string;

    /**
     * Actor-local capsule shared with body validation and contact systems.
     *
     * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-colliders Uses one representation across body and soft collision.
     * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Supplies the bounded segment and radius for projection.
     */
    capsule: IAutoMovieCapsuleProxy;
  }
}
