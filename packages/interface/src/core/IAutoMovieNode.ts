import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import { AutoMovieNodeKind } from "./AutoMovieNodeKind";

/**
 * A node in the scene graph: the universal transformable element. Characters,
 * props, bones, cameras, and lights are all nodes; this is the spine the whole
 * core model hangs from (glTF node = USD prim).
 *
 * A node is a local TRS transform plus an optional payload referenced by id
 * (mirroring glTF's `node.mesh` / `node.camera` etc., so it round-trips). The
 * hierarchy is by `parent` reference; the engine derives children and walks
 * parent-before-child. **A group is simply a node with children**
 * ({@link AutoMovieNodeKind} `group`): its TRS moves the subtree, its local
 * frame is the rotation pivot, and a {@link IAutoMovieChannelLimit} on its
 * rotation is a group-level ROM; no separate grouping concept exists.
 *
 * Transform is parent-local TRS (never a matrix, so it stays animatable and
 * decomposed). Cross-node relationships (a sword following a hand) are
 * expressed as {@link IAutoMovieDriver}s, not multi-parenting, since the graph
 * is a strict tree on export.
 *
 * `composeScene` resolves parents on demand, so the node list may be in any
 * order, and it throws on a duplicate id, a missing parent or a parent cycle.
 * The resolve pipeline reads only `id`, `parent` and `transform`; the payload
 * ids are carried for renderers and round-tripping.
 *
 * @evidence contracts/common.md#principled-implementation A parent-referenced tree of local TRS transforms that `composeScene` turns into world matrices by memoized parent-first recursion with real 4x4 products, so a non-uniformly scaled parent shears its children exactly.
 * @evidence contracts/common.md#clear-and-simple-design The hierarchy is one `parent` field and children are derived, so no node stores a child list that could disagree with its parent pointer, and grouping is a node kind rather than a separate concept.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Composition special-cases no node kind; duplicate ids, unknown parents and parent cycles throw instead of being skipped or re-rooted.
 * @evidence contracts/common.md#meaningful-documentation States the parent-local frame of `transform`, that groups are nodes, how cross-node links are expressed, which fields the resolve pipeline reads, and the composition failures.
 * @author Samchon
 */
export interface IAutoMovieNode {
  /**
   * Stable id; channels, drivers, skins, and scene structure cite the node by
   * this.
   */
  id: string;

  /** Human / LLM readable name. Null if unnamed. */
  name: string | null;

  /**
   * Parent node id, or `null` for a root. Defines the space `transform` is in.
   */
  parent: string | null;

  /** What payload (if any) this node carries. */
  kind: AutoMovieNodeKind;

  /**
   * Local TRS relative to `parent`; the rest pose when no channel animates it.
   */
  transform: IAutoMovieTransform;

  /** Id of an attached mesh, or `null`. */
  mesh: string | null;

  /** Id of an attached camera, or `null`. */
  camera: string | null;

  /** Id of an attached light, or `null`. */
  light: string | null;

  /** Id of the skin that binds this mesh to a skeleton, or `null`. */
  skin: string | null;
}
