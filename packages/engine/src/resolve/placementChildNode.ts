import { placementNodePrefix } from "./placementNodePrefix";

/**
 * Name one bone or articulation child by the shared placement prefix followed by its child id. Clips, bound profiles and viewer lookup use the same concrete string.
 *
 * @evidence contracts/common.md#principled-implementation Append a child id to the shared placement prefix so bones, prop joints, clips and profiles use the same concrete address.
 * @evidence contracts/common.md#clear-and-simple-design placementNodePrefix owns the delimiter and this helper owns child addressing, with no independent namespace service.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Literal slash concatenation is not an injective arbitrary-string tuple encoding; concrete graph uniqueness remains a gate premise and composeScene rejects collisions.
 * @evidence contracts/common.md#meaningful-documentation Docs give the naming law and consumers without promising automatic escaping or model lookup.
 * @evidence contracts/performance.md#efficient-algorithms Placement/child text length determines linear result-string work/storage; no graph is traversed.
 * @evidence contracts/performance.md#reuse-equivalent-work Consumers share the prefix law and recompute addresses for changed ids rather than keeping a global string cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a string returns, retaining no source placement, graph, host node or task.
 */
export const placementChildNode: (placement: string, child: string) => string = (placement: string, child: string): string =>
  `${placementNodePrefix(placement)}${child}`;
