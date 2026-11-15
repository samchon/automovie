import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Authored model mass and contact properties available to physical-analysis helpers.
 *
 * Null means no authored body, not a universal feedback exemption. detectFreeFall skips it, while detectBodyCollision uses its documented 70kg mass and 0.2 restitution defaults; bodyCenterOfMass can still derive a primitive geometry estimate. These helpers currently have no maintained product caller. Friction is validated as a declaration but has no current contact-response reader.
 *
 * Rough numbers, as everywhere in `interface`: units and ranges live here in the JSDoc and are enforced at runtime by `@automovie/engine`, not by the type.
 *
 * @evidence contracts/development/design.md#principled-representation validateBody admits positive finite mass, nullable finite local centre and bounded contact coefficients. Available collision and centre helpers consume mass/restitution or centre; friction remains declared metadata and the detectors are not automatically wired into product execution.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three required model-owned properties, an optional static friction absent when nothing measured it, and the optional kinetic friction a sliding prop reads (#3433), remain independent of optical materials and skeletons. Null body omits authored quantities, and null centre selects the centre helper's uniform-density primitive estimate without defining every detector's behavior.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No named object selects mass or grip presets, and an unmeasured friction is absent rather than a placeholder coefficient; an authored centre overrides uniform-density geometric estimation, and physical advice remains distinct from rejecting malformed numeric inputs.
 * @evidence contracts/development/common.md#meaningful-documentation Defines authored kilograms, local metre centre and contact coefficients, distinct null-body helper behavior, friction's unread status and current detector wiring limits.
 */
export interface IAutoMovieBody {
  /**
   * Mass in kilograms. Strictly positive. Drives momentum in a collision: a heavier body deflects a lighter one more than the reverse.
   */
  mass: number;

  /**
   * Center of mass in the model's local frame (meters), or `null` to let the engine derive it from the geometry (the volume-weighted centroid of the primitive parts, assuming uniform density). Declare it explicitly when the mass is unevenly distributed: a weighted base, a hollow shell.
   */
  centerOfMass: IAutoMovieVector3 | null;

  /**
   * Static Coulomb friction coefficient, `0` (frictionless) to `1` (high grip), dimensionless. A hint for how much a contact resists sliding. Absent when nothing measured it: what the body rests on is undeclared, or no source measured that pair.
   */
  friction?: number;

  /**
   * Kinetic (sliding) Coulomb friction coefficient, `0` to `1`, dimensionless, no greater than `friction`, the static one, and present only with it: how much a contact already sliding resists. Absent when no measured pair gives it.
   */
  kineticFriction?: number;

  /**
   * Coefficient of restitution, `0` (perfectly inelastic: no bounce) to `1` (perfectly elastic). Shapes the rebound the engine suggests on impact.
   */
  restitution: number;
}
