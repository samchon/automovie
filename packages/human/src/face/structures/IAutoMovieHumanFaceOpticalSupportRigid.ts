import type { IAutoMovieHumanFaceOpticalSupportGaze } from "./IAutoMovieHumanFaceOpticalSupportGaze";

/**
 * Exact witness of the existing rigid owner configuration of one eye, as the
 * optical source producer saw it.
 *
 * The articulation's centre landmark remains the rotation pivot; this record
 * lets the consumer refuse a support produced against another configuration.
 *
 * @evidence contracts/common.md#principled-implementation The centre identity and ordered gaze witnesses qualify optical support against the existing resident rigid owner, whose shaped landmark remains the actual rotation pivot.
 * @evidence contracts/common.md#clear-and-simple-design One centre plus a canonical gaze list records source qualification without another optical motion law.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The frame resolver rejects a different centre, gaze count/order or numerical endpoint; correspondence does not infer a measured biological pivot.
 * @evidence contracts/common.md#meaningful-documentation Existing landmark identity and composition order explain the exact witness relationship to articulation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no rigid composition or correspondence scan.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Source configuration identity supplies a premise, not runtime pose caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The producer owns its gaze array; this declaration acquires no rig state.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOpticalSupportRigid {
  /** Existing eye centre landmark identity. */
  center: string;

  /** Existing gaze list in composition order, with its authored units unchanged. */
  gaze: IAutoMovieHumanFaceOpticalSupportGaze[];
}
