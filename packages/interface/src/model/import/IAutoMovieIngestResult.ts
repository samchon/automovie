import type { IAutoMovieClip } from "../../core/IAutoMovieClip";
import type { IAutoMovieNode } from "../../core/IAutoMovieNode";

/**
 * The core node graph and clips one parsed glTF/GLB document maps to.
 *
 * Ids are positional: node `node_{i}` is the document's `i`-th node, clip `clip_{i}` its `i`-th animation, and mesh, camera and skin references are the decimal index of that resource in its root list. The ids are therefore stable for one document revision and never collide when names repeat, but they do not survive a re-export that reorders the lists.
 *
 * `ingestDocument` owns sampler admission and allocates every returned record
 * and array. The caller may mutate them without changing the SDK document.
 * Node TRS and graph membership remain mapper premises; this result is not a
 * complete model-validity certificate. Current parsed-document callers are tests.
 *
 * @evidence contracts/development/design.md#principled-representation Positional ids follow glTF's own index-based references, so a node, clip, mesh, camera or skin id derives from its index in the document's lists and cross-references resolve without name lookup under the mapper's graph-membership premise.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The parsed-document mapper exposes only core nodes and clips, consumed by its import tests; production resident-byte inspection uses its separate report.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The documentation states that positional ids do not survive a re-export that reorders the lists rather than presenting them as content identity.
 * @evidence contracts/development/common.md#meaningful-documentation The comments give the id scheme for every referenced resource, the parent meaning of each node, and the order, looping and duration meaning of each clip.
 */
export interface IAutoMovieIngestResult {
  /** Every glTF node in document order as a core node whose `parent` names the node that lists it as a child, or `null` for a root. */
  nodes: IAutoMovieNode[];

  /** One non-looping clip per glTF animation in document order, its tracks in channel order and its duration the latest keyframe time in seconds. */
  clips: IAutoMovieClip[];
}
