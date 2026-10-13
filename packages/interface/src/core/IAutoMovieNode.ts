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
