/**
 * What a {@link IAutoMovieNode} is. Every node is a transform with an optional
 * payload; the kind tags which payload, if any, it carries.
 *
 * `group` is the load-bearing one: a group is just a node with children, so
 * moving or rotating the group moves the whole subtree, its local frame is the
 * pivot, and a limit on its rotation channel is a group-level range of motion.
 * Grouping needs no separate concept; it is the node graph itself.
 *
 * The tag is descriptive: no engine reader branches on it, and nothing checks
 * it against the node's `mesh`, `camera` and `light` id fields.
 *
 * @evidence contracts/common.md#principled-implementation Follows the glTF node model, where a node is a transform that may reference one payload, and `sceneToNodes` and `lowerSkeletonNodes` write the kind that matches the payload they lower.
 * @evidence contracts/common.md#clear-and-simple-design A closed literal union labels the node for readers while the payload id fields carry the actual reference, so grouping and hierarchy need no type beyond the node itself.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No reader infers behaviour from the tag in place of the payload field; the remaining gap is that a tag contradicting its payload ids is not refused, which the documentation states.
 * @evidence contracts/common.md#meaningful-documentation States that every node is a transform, how a group expresses hierarchy and range of motion, and that the tag is descriptive and unchecked against the payload fields.
 * @author Samchon
 */
export type AutoMovieNodeKind = "group" | "bone" | "mesh" | "camera" | "light";
