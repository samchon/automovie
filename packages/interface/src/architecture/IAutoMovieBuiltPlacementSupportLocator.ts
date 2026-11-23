import type { IAutoMovieBuiltPlacementBodyLocator } from "./IAutoMovieBuiltPlacementBodyLocator";

/**
 * A named target against which a building body's support can be checked.
 *
 * A body support uses its box top, or for a multi-part element the top nearest
 * the subject's underside among parts with positive XZ overlap. Without such a
 * part it uses the first part and still runs boundary-inclusive support probes;
 * absence of positive-area overlap alone does not force not-over-support for
 * degenerate or edge-contact cases. A surface resolves by
 * `surfaces[].surface.id` to footprint and height rule, or is unresolved when
 * missing or lacking a convex footprint piece.
 */
export type IAutoMovieBuiltPlacementSupportLocator =
  | IAutoMovieBuiltPlacementBodyLocator
  | {
      /** Address an authored support surface and its height rule. */
      kind: "surface";

      /** Stable surface identity inside the queried built environment. */
      id: string;
    };
