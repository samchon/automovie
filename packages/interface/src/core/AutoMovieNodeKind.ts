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
 * @author Samchon
 */
export type AutoMovieNodeKind = "group" | "bone" | "mesh" | "camera" | "light";
