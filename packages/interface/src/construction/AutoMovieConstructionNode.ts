import type { IAutoMovieConstructionContinuation } from "./IAutoMovieConstructionContinuation";
import type { IAutoMovieConstructionJoin } from "./IAutoMovieConstructionJoin";
import type { IAutoMovieConstructionPort } from "./IAutoMovieConstructionPort";
import type { IAutoMovieConstructionProfile } from "./IAutoMovieConstructionProfile";
import type { IAutoMovieConstructionSource } from "./IAutoMovieConstructionSource";
import type { IAutoMovieConstructionSplit } from "./IAutoMovieConstructionSplit";
import type { IAutoMovieConstructionTrim } from "./IAutoMovieConstructionTrim";
import type { IAutoMovieConstructionView } from "./IAutoMovieConstructionView";

/**
 * One node of a construction tree, discriminated on `type`: a declared view part (`view`), an invocation-supplied complete view source (`source`), an invocation-owned original piecewise family (`profile`), a merge or diff (`join`), an end continuation (`continue`), an open end split into two children (`split`), a part attached at a known port (`port`), or a through-cut (`trim`).
 *
 * A join's, a continuation's and a port's host and part, a split's host and both children's parts, and a trim's host, are nodes themselves, so groups nest to any depth: a join's host is everything built before it, which lets a later part meet an earlier blend (the second breast against the first, a malleolus on the shank-to-foot blend) and a part merge at both ends (a leg onto the trunk, then a foot onto the leg).
 *
 * @evidence contracts/development/design.md#principled-representation View/source leaves undergo native lofting; profile leaves retain their actual piece fields through the existing atlas and mesh; joins, continuation, splits, ports and trims compose their solids through the tree's containment order.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One closed union over declared views, complete native sources, original profiles and five operation records keeps explicit source references separate from declarative views without per-form variants.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Operator children remain contained nodes; a source key binds generating input in the current invocation, never an already realized solid or a global geometry registry. Shared runtime input does not create a second parent in the tree.
 * @evidence contracts/development/common.md#meaningful-documentation States each discriminant, containment and the distinction between a source input reference and solid-tree topology.
 */
export type AutoMovieConstructionNode =
  | (IAutoMovieConstructionProfile & {
      /** Original profile functions resolve from this invocation by the family name. */
      type: "profile";
    })
  | IAutoMovieConstructionView
  | IAutoMovieConstructionSource
  | IAutoMovieConstructionJoin
  | IAutoMovieConstructionContinuation
  | IAutoMovieConstructionSplit
  | IAutoMovieConstructionPort
  | IAutoMovieConstructionTrim;
