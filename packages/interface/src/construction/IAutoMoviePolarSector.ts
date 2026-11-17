

/** Data and callback contracts shared by the PolarSector operations. */
export namespace IAutoMoviePolarSector {
  /**
     * A guide: a fixed angle owning the radius and its two angle derivatives.
     *
     * @evidence contracts/development/design.md#principled-representation Value, first derivative and second derivative at one polar angle supply the endpoint data of a quintic sector.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Four scalar fields keep the interpolation boundary independent of the source conic or seam that produced it.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts The record does not prove positive radius, ordered angles or conic origin; those are producer premises.
     * @evidence contracts/development/common.md#meaningful-documentation Names radians and both angular derivative orders; radius units follow the owning section, normally mm.
     */
    export interface IGuide {
      /** Polar angle, radians. */
      angle: number;
  
      /** Radius. */
      value: number;
  
      /** First derivative of the radius in the angle. */
      slope: number;
  
      /** Second derivative of the radius in the angle. */
      curvature: number;
    }

  /**
     * Radius and its first/second angular derivatives, in radius units per radian order.
     *
     * @evidence contracts/development/design.md#principled-representation The three-tuple carries rho, rho-prime and rho-double-prime for analytic polar-to-Cartesian differentiation.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Positional derivative order matches the radius and point readers without another stateful object.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts The tuple itself performs no finite-value, positivity or curvature validation.
     * @evidence contracts/development/common.md#meaningful-documentation States derivative order and units relative to the section radius.
     */
    export type Jet = [number, number, number];
}
