import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The angle about an axis through a contact's footprint as a join curve's parameter: the curve's point at angle `t` lies in the half plane through the axis at that angle from the reference.
 *
 * Engine admission: `normal` not zero and `reference` not along it.
 *
 * @evidence contracts/development/design.md#principled-representation The fourth equation is `(P - c) . m(t) = 0`, `m(t)` square to the half plane of direction `cos t e1 + sin t e2`, `e1` the reference square to the normal and `e2 = n x e1`; every half plane meets a star-shaped footprint's curve once.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A centre, a normal and a reference fix the axis and the zero angle.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The reference's part along the normal is removed, a zero or parallel pair refused; nothing is guessed from the surfaces.
 * @evidence contracts/development/common.md#meaningful-documentation States the equation, each field's frame and the admission.
 */
export interface IAutoMovieConstructionAngleParameter {
  /** Discriminator. */
  type: "angle";

  /** The footprint's centre, metres in the construction's frame. */
  centre: IAutoMovieVector3;

  /** The axis's direction, the host's outward normal at the centre; any length but zero. */
  normal: IAutoMovieVector3;

  /** The direction of angle 0; its part along `normal` is removed. */
  reference: IAutoMovieVector3;
}
