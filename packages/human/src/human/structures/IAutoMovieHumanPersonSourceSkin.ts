import type { IAutoMovieHumanPersonHeadTransform } from "./IAutoMovieHumanPersonHeadTransform";

/**
 * One final skin of a performed person in its body frame: the posed face skin, the cut body skin after collar conformance and before it, and the head transform that placed the face. Positions are owned flat triples in metres, Y up, +Z forward.
 *
 * @evidence contracts/common.md#principled-implementation Flat face and cut-body coordinates use one performed body frame; the pre-collar copy preserves the displacement provenance needed by boundary diagnostics.
 * @evidence contracts/common.md#clear-and-simple-design The result keeps placed face, conformed body, pre-collar body and head placement together because they describe one evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coordinates come from evaluated caller geometry and collar conformance, without a fixture-specific final skin.
 * @evidence contracts/common.md#meaningful-documentation Documentation states owned flat metre triples, Y-up/Z-forward orientation and the distinction between body positions before and after collar conformance.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Final skin arrays describe output storage only; skinning, cut evaluation and collar traversal are selected by the evaluator.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The result contains one performed skin rather than a request cache; shape and pose equivalence is decided upstream.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owned coordinate arrays have no release method or external handle; the caller retaining this result controls their lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceSkin {
  /** Posed face skin positions, metres. */
  face: number[];

  /** Cut body skin positions after collar conformance, metres. */
  body: number[];

  /** Cut body skin positions before collar conformance, metres. */
  bodyBeforeCollar: number[];

  /** The head transform that placed the face. */
  head: IAutoMovieHumanPersonHeadTransform;
}
