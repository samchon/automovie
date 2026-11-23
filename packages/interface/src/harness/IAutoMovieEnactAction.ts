import type { IAutoMovieActionBase } from "./IAutoMovieActionBase";

/**
 * Play a clip the caller authored itself: the escape for expressive motion no
 * thin verb covers (a sword kata, a stumble-and-recover, a character-specific
 * idiom). Where every other verb is expanded by a synthesizer, `enact` inverts
 * the direction: the caller computes the dense {@link IAutoMovieMotion} with
 * parametric curves, phase composition, or sampled solvers, and hands it in by
 * `clip` id for the host's synthesizer to resolve.
 *
 * The engine masks the clip to its region, fullBody by default, arranges
 * nonoverlapping placements into lanes and layers concurrent lanes. performShot
 * checks actual masked-content overlaps and gates the compiled composite's
 * range of motion like synthesized content; direct compilePerformance alone
 * does not perform those shot gates. Prefer a thin verb whenever one fits.
 *
 * `performShot` refuses a blank `clip`. The production builder resolves the id
 * from the shot program's `clips` and refuses one that is absent, while the
 * engine's reference synthesizer answers `enact` with no motion.
 */
export interface IAutoMovieEnactAction extends IAutoMovieActionBase {
  /** Selects caller-authored motion playback as the action family. */
  verb: "enact";

  /** Id of the caller-authored clip, resolved by the host's synthesizer. */
  clip: string;
}
