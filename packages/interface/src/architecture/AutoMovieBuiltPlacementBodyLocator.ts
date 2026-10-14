/**
 * An addressable placed body whose current world bounds a building query can
 * derive without expanding authored repetition.
 *
 * An unknown id or transform-only element resolves to no extent and the pair/sweep queries report it unresolved. This does not suppress other failures: an existing population's `along-route` layout or invalid placement subset throws through its bounds fold, and malformed hierarchies or unusable numerical staging can throw. Queries require admitted records rather than performing full building validation themselves.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union on `kind`; `builtEnvironmentPlacementBounds` resolves an element through its tessellated model and full hierarchy transform and a population by `set.id` through its placement-bounds fold, returning null for an unknown id or a model-less element.
 * @evidence contracts/common.md#clear-and-simple-design Two arms holding only a kind and an id, so the overlap and support queries and their sweeps share one addressing type instead of passing raw element or population records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Compact layouts are bounded without expanding realized members; explicit layouts still inspect their stored transforms. A missing locator becomes unresolved, while errors deriving a present body's bounds propagate. Runtime-model references can resolve to a labelled origin point without proving any external mesh extent.
 * @evidence contracts/common.md#meaningful-documentation States what each arm addresses, which id a population arm uses, and how an unknown id or a transform-only group is reported.
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
