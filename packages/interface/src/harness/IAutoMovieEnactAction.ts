import { IAutoMovieActionBase } from "./IAutoMovieActionBase";

/**
 * Play a clip the caller **authored itself**: the escape for the expressive
 * motion no thin verb covers (a sword kata, a stumble-and-recover, a
 * character-specific idiom). Where every other verb is fattened by a
 * synthesizer, `enact` inverts the direction: the caller **computes** the dense
 * {@link IAutoMovieMotion} (motion authoring is, at the limit, a coding
 * activity: parametric curves, phase composition, sampled solvers) and hands it
 * in by `clip` id; the host's synthesizer resolves the id against the clips it
 * was given.
 *
 * Enforcement is NOT bypassed: the engine masks the clip to its region (default
 * `fullBody`; narrow via `region`), layers it with disjoint-region actions,
 * sequences same-region overlaps, and ROM-gates the compiled composite exactly
 * like synthesized content: "engine enforces, model creates", with the model
 * creating at code bandwidth. Prefer a thin verb whenever one fits; reach for
 * `enact` when you can compute the keyframes.
 *
 * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary Exposes `IAutoMovieEnactAction` as the portable data boundary for the motion object authored vocabulary requirement.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff Types `IAutoMovieEnactAction` for the performance interaction attachment object handoff system contract.
 */
export interface IAutoMovieEnactAction extends IAutoMovieActionBase {
  /**
   * Selects caller-authored motion playback as the action family.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring This action member carries the cited authoring intent in the typed action contract.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-agent-input-output This action member carries the cited authoring intent in the typed action contract.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary Exposes `verb` as the portable data boundary for the motion object authored vocabulary requirement.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff Types `verb` for the performance interaction attachment object handoff system contract.
   */
  verb: "enact";

  /**
   * Id of the caller-authored clip, resolved by the host's synthesizer.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary Exposes `clip` as the portable data boundary for the motion object authored vocabulary requirement.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff Types `clip` for the performance interaction attachment object handoff system contract.
   */
  clip: string;
}
