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
 * `performShot` refuses a blank `clip`. The production builder resolves the id
 * from the shot program's `clips` and refuses one that is absent; the engine's
 * reference synthesizer answers `enact` with no motion.
 *
 * @evidence contracts/common.md#principled-implementation Inverts synthesis: the caller computes a dense motion and the host synthesizer looks it up by id, after which the same region mask, layering and ROM gate apply as to synthesized clips.
 * @evidence contracts/common.md#clear-and-simple-design Adds a single clip id to the shared base, keeping the motion data in the host's clip table rather than inline in the action list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No clip is special-cased; the production builder's synthesizer branches on `enact` to read the program's clips, which is the documented host seam, and reports an unknown id as a located violation.
 * @evidence contracts/common.md#meaningful-documentation States when to prefer `enact`, who resolves the id, which enforcement still applies, the default region, and the blank-id and absent-clip refusals.
 * @author Samchon
 */
export interface IAutoMovieEnactAction extends IAutoMovieActionBase {
  /** Selects caller-authored motion playback as the action family. */
  verb: "enact";

  /** Id of the caller-authored clip, resolved by the host's synthesizer. */
  clip: string;
}
