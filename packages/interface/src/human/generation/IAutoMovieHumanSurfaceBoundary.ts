/** Shared vertex addresses resolving one end of a generated loft chain. */
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
