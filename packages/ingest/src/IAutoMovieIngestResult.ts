import type { IAutoMovieClip, IAutoMovieNode } from "@automovie/interface";

/**
 * The core node graph and clips one parsed glTF/GLB document maps to.
 *
 * Ids are positional: node `node_{i}` is the document's `i`-th node, clip `clip_{i}` its `i`-th animation, and mesh, camera and skin references are the decimal index of that resource in its root list. The ids are therefore stable for one document revision and never collide when names repeat, but they do not survive a re-export that reorders the lists.
 *
 * @evidence contracts/common.md#principled-implementation Positional ids follow glTF's own index-based references, so a node, clip, mesh, camera or skin id equals its index in the document's lists and cross-references resolve without name lookup.
 * @evidence contracts/common.md#clear-and-simple-design The result is the two lists the engine already consumes, nodes and clips, with no wrapper around either.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The documentation states that positional ids do not survive a re-export that reorders the lists rather than presenting them as content identity.
 * @evidence contracts/common.md#meaningful-documentation The comments give the id scheme for every referenced resource, the parent meaning of each node, and the order, looping and duration meaning of each clip.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface types the mapper's return value and runs no code.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A result type has no work of its own that could be shared.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type allocates nothing; the arrays it names are created by `ingestDocument` and owned by its caller.
 */
export interface IAutoMovieIngestResult {
  /** Every glTF node in document order as a core node whose `parent` names the node that lists it as a child, or `null` for a root. */
  nodes: IAutoMovieNode[];

  /** One non-looping clip per glTF animation in document order, its tracks in channel order and its duration the latest keyframe time in seconds. */
  clips: IAutoMovieClip[];
}
