/**
 * What a {@link IAutoMovieNode} is. Every node is a transform with an optional
 * payload; the kind tags which payload (if any) it carries.
 *
 * `group` is the load-bearing one: a group is just a node with children, so
 * moving or rotating the group moves the whole subtree, its local frame is the
 * pivot, and a limit on its rotation channel is a group-level range of motion.
 * Grouping needs no separate concept; it is the node graph itself.
 *
 * The tag is descriptive: no engine reader branches on it, and nothing checks
 * it against the node's `mesh`, `camera` and `light` id fields.
 *
 * @evidence contracts/common.md#principled-implementation Tags the payload a node carries, mirroring glTF node payloads; `sceneToNodes` writes `group`, `camera` and `light`, `lowerSkeletonNodes` writes `group` and `bone`, and prop articulation nodes keep their authored kind.
 * @evidence contracts/common.md#clear-and-simple-design A group is any node with children, so grouping, pivots and group-level range of motion reuse the node tree instead of adding a container type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No engine reader branches on the kind and no validator compares it with the payload id fields, so a mislabeled node is neither refused nor treated differently.
 * @evidence contracts/common.md#meaningful-documentation Explains why `group` carries hierarchy, pivot and group-level range of motion, and states that the tag is descriptive and unchecked against the payload ids.
 * @author Samchon
 */
export type AutoMovieNodeKind = "group" | "bone" | "mesh" | "camera" | "light";
