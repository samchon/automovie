import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieBodyContact } from "./IAutoMovieBodyContact";
import type { IAutoMovieBodyDrag } from "./IAutoMovieBodyDrag";

/**
 * Authored model mass and contact properties available to physical-analysis
 * helpers.
 *
 * Null means no authored body, not a universal feedback exemption.
 * detectFreeFall skips it, while detectBodyCollision still observes proxy
 * contacts but refuses a requested physical response without authored bodies,
 * mass and restitution; bodyCenterOfMass can still derive a primitive geometry
 * estimate. The detectors currently have no maintained product caller.
 * HumanPropOutcome consumes declared restitution with kinetic or static
 * friction for a flying prop; the collision adviser interprets body restitution
 * through its existing material heuristic and does not reproduce an arbitrary
 * measured pair directly.
 *
 * Rough numbers, as everywhere in `interface`: units and ranges live here in
 * the JSDoc and are enforced at runtime by `@automovie/engine`, not by the
 * type.
 */
export interface IAutoMovieBody {
  /**
   * Mass in kilograms. Strictly positive. Drives momentum in a collision: a
   * heavier body deflects a lighter one more than the reverse.
   */
  mass: number;

  /**
   * Center of mass in the model's local frame (meters), or `null` to let the
   * engine derive it from the geometry (the volume-weighted centroid of the
   * primitive parts, assuming uniform density). Declare it explicitly when the
   * mass is unevenly distributed: a weighted base, a hollow shell.
   */
  centerOfMass: IAutoMovieVector3 | null;

  /**
   * Static Coulomb friction coefficient, `0` (frictionless) to `1` (high grip),
   * dimensionless. A hint for how much a contact resists sliding. Absent when
   * nothing measured it: what the body rests on is undeclared, or no source
   * measured that pair.
   */
  friction?: number;

  /**
   * Kinetic (sliding) Coulomb friction coefficient, `0` to `1`, dimensionless,
   * no greater than `friction`, the static one, and present only with it: how
   * much a contact already sliding resists. Absent when no measured pair gives
   * it.
   */
  kineticFriction?: number;

  /**
   * Declared normal coefficient of restitution, `0` (perfectly inelastic: no
   * bounce) to `1` (perfectly elastic). Absent when no coefficient was measured
   * or explicitly authored. Absence is unknown, not zero; requesting a
   * collision response or rebound requires a declaration for the contacting
   * materials and conditions.
   */
  restitution?: number;

  /**
   * The air's drag on the body in flight, its coefficient and the reference
   * area it is stated against. Absent when no source measured it; a flight then
   * reads no drag from the body.
   */
  drag?: IAutoMovieBodyDrag;

  /**
   * How the body ends a flight against what it strikes: how deep it sticks, how
   * it rolls on, how much speed it loses passing through. Absent when the body
   * declares none of these.
   */
  contact?: IAutoMovieBodyContact;
}
