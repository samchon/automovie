import { IAutoMovieRetargetHandContact } from "./IAutoMovieRetargetHandContact";

/**
 * Configure source-contact preservation during humanoid retargeting; omitted fields enable the pass with source-rest-floor stance detection and no declared hand contacts.
 *
 * @evidence contracts/development/design.md#principled-representation Distinguishes geometric foot stance against a scalar or sampled source ground from declared hand windows; tolerance is in source model units and scales with rootScale for target residual warnings.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One optional policy input groups pass enablement, ground, tolerance and hand contacts; required source/target rigs and motion stay in the retarget operation's own input.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Default ground comes from the source rig's resolved rest floor rather than an assumed zero plane; hand contact is declared rather than guessed from hand position.
 * @evidence contracts/development/common.md#meaningful-documentation Gives enabled and tolerance defaults, source-ground units, residual-budget scaling and the empty hand-contact meaning.
 */
export interface IAutoMovieRetargetContactProps {
  /**
   * Run contact correction. Defaults to true; false keeps copied clinical angles and scaled root motion.
   */
  enabled?: boolean;

  /**
   * Ground height for source stance detection: a plane scalar or an `(x, z) →
   * y` source. Defaults to the **source rig's own rest floor** (the lowest
   * world Y of its zero pose), so a rig authored with its feet above the origin
   * still detects stance instead of never touching down.
   */
  groundY?: number | ((x: number, z: number) => number);

  /**
   * Contact tolerance above the ground counted as stance, in source model
   * units. Defaults to `0.02`, the same band {@link plantStanceFeet} and
   * {@link validateGroundContact} use. It doubles as the residual budget: a
   * pinned effector that ends further than `tolerance * rootScale` from its
   * contact is reported as a plausibility warning.
   */
  tolerance?: number;

  /** Hand contacts to preserve. Defaults to none. */
  hands?: readonly IAutoMovieRetargetHandContact[];
}
