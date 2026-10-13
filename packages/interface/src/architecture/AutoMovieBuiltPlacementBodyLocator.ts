/**
 * An addressable placed body whose current world bounds a building query can
 * derive without expanding authored repetition.
 *
 * An id that names nothing, or an element that is a transform-only group with
 * no model, resolves to no extent, and every query reports such a locator as
 * unresolved rather than throwing.
 *
 * @author Samchon
 */
export type AutoMovieBuiltPlacementBodyLocator =
  | {
      /** Address an individual visible building element. */
      kind: "element";

      /** Stable element identity inside the queried built environment. */
      id: string;
    }
  | {
      /** Address one compact repeated population without expanding its members. */
      kind: "population";

      /**
       * Stable instance-set identity (`set.id`) inside the queried built
       * environment.
       */
      id: string;
    };
