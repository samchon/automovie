import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Same-surface signed-distance lower-bound inputs in the current head-metre frame. Finite coordinates and a consistently oriented closed surface are caller premises; the record itself performs no admission.
 *
 * @evidence contracts/common.md#principled-implementation A measured signed distance and candidate in the same metre frame support the 1-Lipschitz lower bound without altering either geometry.
 * @evidence contracts/common.md#clear-and-simple-design Sample, candidate, required gap and existing allowance keep the proof inputs explicit instead of hiding another clearance policy in the predicate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The caller supplies its existing allowance; the schema contains no fixture tolerance or substituted candidate position.
 * @evidence contracts/common.md#meaningful-documentation Each member documents metre units, oriented exterior sign and the distinction between measured and unqueried points.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The lower-bound argument type selects no distance algorithm; the predicate performs one point separation and scale-relative guard.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A sample is reusable only against the same surface/frame; the type describes proof inputs rather than retaining the witness itself.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two borrowed point references and scalar proof inputs acquire no geometry index or background operation.
 *
 * @author Samchon
 */
export interface IHumanFaceHairFreeDistanceBoundProps {
  /** Point at which the same surface's signed distance was measured, in metres. */
  sampled: IAutoMovieVector3;

  /** Signed sample distance in metres, positive on the oriented exterior. */
  distance: number;

  /** Unqueried point in the sample's metre frame. */
  candidate: IAutoMovieVector3;

  /** Required free distance in metres from the caller's contact rule. */
  required: number;

  /** Nonnegative numerical allowance in metres already used by that rule. */
  allowance: number;
}
