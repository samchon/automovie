import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The physical body of a model: the mass properties the engine reasons about when it gives physical-plausibility feedback (collision recoil, stacking and support, free-fall).
 *
 * This is deliberately opt-in. A model with `body: null` has no declared physics (a static set piece, or a purely visual prop) and the engine raises no physical feedback for it. When a body IS declared, `mass` weighs momentum exchange in a collision, `centerOfMass` decides whether a stacked body is supported or topples, and `restitution` / `friction` shape a suggested response. None of this is a hard rejection: a film may be deliberately unphysical, so physical implausibility is advisory. The body is simply what gives that advice something to compute from.
 *
 * Rough numbers, as everywhere in `interface`: units and ranges live here in the JSDoc and are enforced at runtime by `@automovie/engine`, not by the type.
 *
 * @evidence contracts/common.md#principled-implementation Mass, local centre of mass, Coulomb friction and restitution supply the inputs to momentum and support judgments; validation requires positive finite mass and bounded dimensionless contact coefficients before advisory physical analysis.
 * @evidence contracts/common.md#clear-and-simple-design Four physical properties sit on the model independently of optical materials and skeleton geometry; a null body opts out, while a null centre requests geometry-derived mass placement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No named object selects mass or grip presets; an authored centre overrides uniform-density geometric estimation, and physical advice remains distinct from rejecting malformed numeric inputs.
 * @evidence contracts/common.md#meaningful-documentation Describes opt-in physics, advisory plausibility, kilograms, local metre centre and uniform-density estimation, and the unit intervals and physical meanings of friction and restitution.
 * @author Samchon
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
   * Coulomb friction coefficient, `0` (frictionless) to `1` (high grip), dimensionless. A hint for how much a contact resists sliding.
   */
  friction: number;

  /**
   * Coefficient of restitution, `0` (perfectly inelastic: no bounce) to `1` (perfectly elastic). Shapes the rebound the engine suggests on impact.
   */
  restitution: number;
}
