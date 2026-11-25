import type { IAutoMovieConstructionContinuation } from "./IAutoMovieConstructionContinuation";
import type { IAutoMovieConstructionJoin } from "./IAutoMovieConstructionJoin";
import type { IAutoMovieConstructionPort } from "./IAutoMovieConstructionPort";
import type { IAutoMovieConstructionProfile } from "./IAutoMovieConstructionProfile";
import type { IAutoMovieConstructionSource } from "./IAutoMovieConstructionSource";
import type { IAutoMovieConstructionSplit } from "./IAutoMovieConstructionSplit";
import type { IAutoMovieConstructionTrim } from "./IAutoMovieConstructionTrim";
import type { IAutoMovieConstructionView } from "./IAutoMovieConstructionView";

/**
 * One node of a construction tree, discriminated on `type`: a declared view
 * part (`view`), an invocation-supplied complete view source (`source`), an
 * invocation-owned original piecewise family (`profile`), a merge or diff
 * (`join`), an end continuation (`continue`), an open end split into two
 * children (`split`), a part attached at a known port (`port`), or a
 * through-cut (`trim`).
 *
 * A join's, a continuation's and a port's host and part, a split's host and
 * both children's parts, and a trim's host, are nodes themselves, so groups
 * nest to any depth: a join's host is everything built before it, which lets a
 * later part meet an earlier blend (the second breast against the first, a
 * malleolus on the shank-to-foot blend) and a part merge at both ends (a leg
 * onto the trunk, then a foot onto the leg).
 */
export type IAutoMovieConstructionNode =
  | (IAutoMovieConstructionProfile & {
      /**
       * Original profile functions resolve from this invocation by the family
       * name.
       */
      type: "profile";
    })
  | IAutoMovieConstructionView
  | IAutoMovieConstructionSource
  | IAutoMovieConstructionJoin
  | IAutoMovieConstructionContinuation
  | IAutoMovieConstructionSplit
  | IAutoMovieConstructionPort
  | IAutoMovieConstructionTrim;
