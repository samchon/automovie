import { AutoMovieBuiltPlacementBodyLocator } from "./AutoMovieBuiltPlacementBodyLocator";

/**
 * A named target against which a building body's support can be checked.
 *
 * @evidence requirements/building-exterior/structure-and-envelope.md#building-structural-support Lets a declared support name an element, compact population, or authored support surface instead of guessing one from proximity.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-structural-support-input-output Types every support identity the bearing and suspension query is allowed to resolve.
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
