/**
 * An addressable placed body whose current world bounds a building query can
 * derive without expanding authored repetition.
 *
 * An unknown id or transform-only element resolves to no extent and the
 * pair/sweep queries report it unresolved. This does not suppress other
 * failures: an existing population's `along-route` layout or invalid placement
 * subset throws through its bounds fold, and malformed hierarchies or unusable
 * numerical staging can throw. Queries require admitted records rather than
 * performing full building validation themselves.
 */
export type IAutoMovieBuiltPlacementBodyLocator =
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
