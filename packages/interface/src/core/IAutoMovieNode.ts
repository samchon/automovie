import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { AutoMovieNodeKind } from "./AutoMovieNodeKind";

/**
 * A node in the scene graph: the universal transformable element. Characters,
 * props, bones, cameras and lights are all nodes, and the whole core model
 * hangs from this record (a glTF node, a USD prim).
 *
 * A node is a parent-local TRS transform plus optional payload ids, mirroring
 * glTF's `node.mesh` and `node.camera` so it round-trips. The hierarchy is the
 * `parent` reference: a node has at most one parent, so the graph is a forest,
 * and a group is simply a node with children ({@link AutoMovieNodeKind} `group`)
 * whose TRS moves the subtree and whose local frame is the rotation pivot. A
 * relationship between nodes in different branches, such as a sword following a
 * hand, is an `IAutoMovieDriver` rather than a second parent.
 *
 * `composeScene` resolves parents on demand, so the node list may be in any
 * order, and it throws on a duplicate id, a missing parent or a parent cycle.
 * It does not check that the transform is finite or that the rotation is a unit
 * quaternion. The resolve pipeline reads only `id`, `parent` and `transform`;
 * `name`, `kind` and the payload ids are carried for renderers and
 * round-tripping.
 */
export interface IAutoMovieNode {
  /**
   * Id unique within the node list; channels, drivers, skins and scene
   * structure cite the node by it.
   */
  id: string;

  /** Display name for people and the LLM, or `null`; no resolver reads it. */
  name: string | null;

  /**
   * Parent node id, or `null` for a root. The parent's world frame is the space
   * `transform` is expressed in.
   */
  parent: string | null;

  /** Which payload, if any, this node carries; descriptive only. */
  kind: AutoMovieNodeKind;

  /**
   * Local TRS relative to `parent`; the rest pose when no channel animates it.
   * A sampled translation, rotation or scale channel replaces only its own
   * component for that frame.
   */
  transform: IAutoMovieTransform;

  /** Id of an attached mesh, or `null`. */
  mesh: string | null;

  /** Id of an attached camera, or `null`. */
  camera: string | null;

  /** Id of an attached light, or `null`. */
  light: string | null;

  /** Id of the skin that binds this node's mesh to a skeleton, or `null`. */
  skin: string | null;
}
