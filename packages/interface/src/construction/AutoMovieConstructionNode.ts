import type { IAutoMovieConstructionJoin } from "./IAutoMovieConstructionJoin";
import type { IAutoMovieConstructionTrim } from "./IAutoMovieConstructionTrim";
import type { IAutoMovieConstructionView } from "./IAutoMovieConstructionView";

/**
 * One node of a construction tree, discriminated on `type`: a part drawn from its views (`view`), a join of a part onto a host (`join`, a merge or a diff), or a trim that opens a through-cut in a face of a solid (`trim`).
 *
 * A join's host and part, and a trim's host, are nodes themselves, so groups nest to any depth: a join's host is everything built before it, which lets a later part meet an earlier blend (the second breast against the first, a malleolus on the shank-to-foot blend) and a part merge at both ends (a leg onto the trunk, then a foot onto the leg).
 *
 * @evidence contracts/common.md#principled-implementation The three node kinds are the construction's three operators and its trim; each child is a whole solid, so the union describes a tree of solids and nothing else.
 * @evidence contracts/common.md#clear-and-simple-design One closed union over three records lets every consumer switch on `type`, and nesting replaces any per-depth or per-form variant.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A node names its children by containment, never by index into another list, so no node can point at a part outside its own subtree; a part shared by two hosts (a graph that is not a tree) cannot be written and is not supported.
 * @evidence contracts/common.md#meaningful-documentation States the discriminant, each kind's meaning, the recursion through hosts and parts, the cases it covers and the tree-only limit.
 */
export type AutoMovieConstructionNode = IAutoMovieConstructionView | IAutoMovieConstructionJoin | IAutoMovieConstructionTrim;
