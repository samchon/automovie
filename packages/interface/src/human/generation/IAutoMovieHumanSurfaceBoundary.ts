/** Shared vertex addresses resolving one end of a generated loft chain.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Shared vertex addresses resolving one end of a generated loft chain.
 * @evidence contracts/development/design.md#principled-representation Shared vertex addresses resolving one end of a generated loft chain. Alternatives are a record with kind, ring; a record with kind, ring; a record with kind; a record with kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBodySurfacePoles.boundary. Also types AutoMovieHumanBodySurfaceLoft.bottom, AutoMovieHumanBodySurfaceLoft.top.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanBodySurfaceLoft.bottom, AutoMovieHumanBodySurfaceLoft.top, AutoMovieHumanBodySurfaceLoft.end, AutoMovieHumanBodySurfacePoles.boundary for shared vertex addresses resolving one end of a generated loft chain.
 */
export type IAutoMovieHumanSurfaceBoundary =
  | {
      /** The chain owns the complete contact ring in its phase order. */
      kind: "own";
      /** Shared skin vertex indices. */
      ring: number[];
    }
  | {
      /** The chain inherits directed arcs of its parent's contact ring. */
      kind: "inherited";
      /** Shared skin vertex indices in inherited ring order. */
      ring: number[];
    }
  | {
      /** The chain end closes at its calibrated or inferred pole. */
      kind: "pole";
    }
  | {
      /**
       * The chain end is an appendage's root: generated in the chain's own
       * phases and joined to its base by a transition strip afterwards.
       */
      kind: "root";
    };
