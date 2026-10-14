import type { AutoMovieHumanBodyBoneId } from "../anatomy/identity/AutoMovieHumanBodyBoneId";
import type { IAutoMovieHumanBodyBoneTransform } from "../structures/rig/IAutoMovieHumanBodyBoneTransform";

/**
 * An original anatomical graph key and its returned rest/posed world frames.
 * Positions remain metres in the body basis; the origin is the graph's placement frame rather than a measured joint centre or bone surface.
 *
 * @evidence contracts/common.md#principled-implementation An actual anatomical graph identity accompanies the existing paired rest/posed bone-world transform schema returned by that source evaluation.
 * @evidence contracts/common.md#clear-and-simple-design Extending the shared transform carrier adds only the anatomical key instead of inventing another bone-frame representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Graph placement origins and identity cannot certify measured joint centres, personal bone surfaces or clinical motion capacity.
 * @evidence contracts/common.md#meaningful-documentation The prose gives body metre frame and graph-placement meaning; the inherited transform owner states rest/posed rotation semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The reading type performs no source FK or frame conversion.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The schema implements no pose-result or anatomical-graph cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration acquires no graph evaluation, geometry buffer or worker task.
 *
 * @author Samchon
 */
export interface IConnectedBodyAnatomicalBoneReading extends IAutoMovieHumanBodyBoneTransform {
  /** Actual anatomical identity from the evaluated graph. */
  bone: AutoMovieHumanBodyBoneId;
}
