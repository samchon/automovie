import { IAutoMovieActionBase } from "./IAutoMovieActionBase";

/**
 * Play a clip the caller authored itself: the escape for expressive motion no
 * thin verb covers (a sword kata, a stumble-and-recover, a character-specific
 * idiom). Where every other verb is expanded by a synthesizer, `enact` inverts
 * the direction: the caller computes the dense {@link IAutoMovieMotion} with
 * parametric curves, phase composition, or sampled solvers, and hands it in by
 * `clip` id for the host's synthesizer to resolve.
 *
 * The engine masks the clip to its region, fullBody by default, arranges nonoverlapping placements into lanes and layers concurrent lanes. performShot checks actual masked-content overlaps and gates the compiled composite's range of motion like synthesized content; direct compilePerformance alone does not perform those shot gates. Prefer a thin verb whenever one fits.
 *
 * `performShot` refuses a blank `clip`. The production builder resolves the id
 * from the shot program's `clips` and refuses one that is absent, while the
 * engine's reference synthesizer answers `enact` with no motion.
 *
 * @evidence contracts/common.md#principled-implementation The clip is resolved by exact id from a table the host supplies, then flows through `compilePerformance`'s region masking and lane arrangement and `performShot`'s range-of-motion gate like any synthesized clip.
 * @evidence contracts/common.md#clear-and-simple-design One id field references motion that lives in the shot program's clip table, so the action list stays thin and a clip used by several actions is stored once.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An authored clip gets no exemption from masking or the motion gate, and an unknown id is refused by the production builder rather than skipped as silence.
 * @evidence contracts/common.md#meaningful-documentation States when to use it, who computes the motion and who resolves the id, every enforcement step it still passes, the default region, the blank and absent-clip refusals, and the reference synthesizer's empty answer.
 */
export interface IAutoMovieEnactAction extends IAutoMovieActionBase {
  /** Selects caller-authored motion playback as the action family. */
  verb: "enact";

  /** Id of the caller-authored clip, resolved by the host's synthesizer. */
  clip: string;
}
