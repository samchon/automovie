import { AutoMovieBuiltPlacementBodyLocator } from "./AutoMovieBuiltPlacementBodyLocator";

/**
 * A named target against which a building body's support can be checked.
 *
 * A body support bears through the top face of its resolved box, or, for a
 * multi-part element, of the drawn part nearest the subject's underside among
 * the parts the subject stands over. A surface support resolves through
 * `surfaces[].surface.id` to its footprint and height rule, and is unresolved
 * when that id is unknown or the footprint has no convex piece.
 *
 * @author Samchon
 */
export type AutoMovieBuiltPlacementSupportLocator =
  | AutoMovieBuiltPlacementBodyLocator
  | {
      /** Address an authored support surface and its height rule. */
      kind: "surface";

      /** Stable surface identity inside the queried built environment. */
      id: string;
    };
