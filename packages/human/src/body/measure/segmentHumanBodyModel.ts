import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBuild } from "../structures/IAutoMovieHumanBodyBuild";
import { createHumanBodySegmenter } from "./createHumanBodySegmenter";

/**
 * Split one built body into dominant-bone contact segments on demand.
 *
 * createHumanBodySegmenter owns immutable skin-binding/UV-corner correspondence. This direct entry compiles it for one build; a worker or pose search retains the compiled function across documents of the same basis. Both paths copy actual posed metre positions/normals into fresh contact parts with source ordinals. The partition names rig-weight skin regions rather than internal bone surfaces and contact remains a separate measurement.
 *
 * @evidence contracts/common.md#principled-implementation The shared segmenter compiles admitted basis attachment/UV identity, checks the supplied build's matching source skin and emits its actual posed contact partition.
 * @evidence contracts/common.md#clear-and-simple-design A single-build entry delegates compilation and evaluation to the same reusable segmenter used by repeated-pose consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Partition correspondence must match the exact build and cannot identify physical bone surfaces or certify contact/crossing freedom.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes one-shot compilation, immutable-basis reuse, owned posed geometry/source ordinals and separate contact judgments.
 * @evidence contracts/performance.md#efficient-algorithms This convenience call pays complete segment-plan construction plus source correspondence checking/copying; repeated same-basis consumers avoid that compile cost through the retained owner.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing UV/skin partition semantics are shared rather than reconstructed by this wrapper, and pose searches retain the reusable compiler directly.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The transient plan closure expires after returning new model parts/source maps, with no previous posed geometry, external handle or task retained.
 */
export function segmentHumanBodyModel(
  basis: IAutoMovieHumanBodyBasis,
  built: IAutoMovieHumanBodyBuild,
): { model: IAutoMovieModel; sources: Map<string, number[]> } {
  return createHumanBodySegmenter(basis)(built);
}
