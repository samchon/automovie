import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";

/**
 * Expand numerical identity and tape values on the exact current person using paired body support and complete-person rest-skin readings. Effective shape resolves the document's canonical body anatomy before expansion. Returned weights are a numerical candidate; editor admission and history are separate.
 *
 * @evidence contracts/common.md#principled-implementation Complete serialized person context and authored simple inputs route deterministic expansion against paired support and that person's own rest-skin stature/volume.
 * @evidence contracts/common.md#clear-and-simple-design Request transport remains separate from worker numerical expansion and the panel's complete-person candidate transaction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A standard replacement head does not supply the person's measurements, source reach is not extrapolated and returned weights alone do not establish admission.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies paired support, anatomy-resolved effective shape, complete-person rest provenance and numerical candidate scope.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The request type selects no anatomy resolution, simple inverse or skin-reading algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Correlation and document context declare no cached inverse equivalence across different inputs.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Pending numerical requests and resident evaluation remain worker/transport-owned rather than acquired by this schema.
 *
 * @author Samchon
 */
export interface IConnectedPersonSimpleExpandMessage {
  /** Transport request identity. */
  id: number;

  /** Expansion operation. */
  kind: "expandPersonSimple";

  /** Current whole-person document text, admitted by the same parser as preview. */
  document: string;

  /** Owner-defined measurements and legacy appearance coordinates. */
  simple: IAutoMovieHumanBodySimpleShape;
}
