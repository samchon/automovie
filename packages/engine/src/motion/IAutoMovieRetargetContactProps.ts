import { IAutoMovieRetargetHandContact } from "./IAutoMovieRetargetHandContact";

/**
 * Configure source-contact preservation during humanoid retargeting; omitted fields enable the pass with source-rest-floor stance detection and no declared hand contacts.
 *
 * @evidence contracts/common.md#principled-implementation Distinguishes geometric foot stance against a scalar or sampled source ground from declared hand windows; tolerance is in source model units and scales with rootScale for target residual warnings.
 * @evidence contracts/common.md#clear-and-simple-design One optional policy input groups pass enablement, ground, tolerance and hand contacts; required source/target rigs and motion stay in the retarget operation's own input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Default ground comes from the source rig's resolved rest floor rather than an assumed zero plane; hand contact is declared rather than guessed from hand position.
 * @evidence contracts/common.md#meaningful-documentation Gives enabled and tolerance defaults, source-ground units, residual-budget scaling and the empty hand-contact meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural policy does not run stance detection; preserveRetargetContacts owns keyframe FK and per-chain contact work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The ground callback and hand records are borrowed policy inputs, not cached results; the pass samples ground at current source effector positions.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The policy holds at most the caller's callback and declared hand list and acquires no resource; the retarget call retains neither after completion.
 *
 * @author Samchon
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
