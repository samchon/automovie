import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import { AutoMovieNodeKind } from "./AutoMovieNodeKind";

/**
 * A node in the scene graph: the universal transformable element. Characters,
 * props, bones, cameras and lights are all nodes, and the whole core model
 * hangs from this record (a glTF node, a USD prim).
 *
 * A node is a parent-local TRS transform plus optional payload ids, mirroring
 * glTF's `node.mesh` and `node.camera` so it round-trips. The hierarchy is the
 * `parent` reference: a node has at most one parent, so the graph is a forest,
 * and a group is simply a node with children ({@link AutoMovieNodeKind}
 * `group`) whose TRS moves the subtree and whose local frame is the rotation
 * pivot. A relationship between nodes in different branches, such as a sword
 * following a hand, is an `IAutoMovieDriver` rather than a second parent.
 *
 * `composeScene` resolves parents on demand, so the node list may be in any
 * order, and it throws on a duplicate id, a missing parent or a parent cycle.
 * It does not check that the transform is finite or that the rotation is a
 * unit quaternion. The resolve pipeline reads only `id`, `parent` and
 * `transform`; `name`, `kind` and the payload ids are carried for renderers
 * and round-tripping.
 *
 * @evidence contracts/common.md#principled-implementation `composeScene` turns each node into `parent world × compose(translation, rotation, scale)` with a real 4x4 product, memoized per id and guarded by an in-progress set, so declaration order is free and a cycle, duplicate id or missing parent throws; the premise of finite TRS and a unit rotation is left to the producers of the list and is not rechecked there.
 * @evidence contracts/common.md#clear-and-simple-design One flat record per node with a single parent reference keeps the hierarchy a forest the engine can index in one pass, and payloads are ids rather than nested objects so meshes, cameras and lights stay owned by their own tables.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No node kind is special-cased by the resolver, which reads only id, parent and transform; multi-parent relationships are expressed as drivers rather than patched into the hierarchy. The descriptive `kind` and payload ids are not cross-checked, a gap stated here rather than hidden.
 * @evidence contracts/common.md#meaningful-documentation States the parent-local frame of the transform, the single-parent forest rule, what `composeScene` refuses and does not check, which fields the resolver reads, and that a transform is the rest pose when no channel animates it.
 * @author Samchon
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
