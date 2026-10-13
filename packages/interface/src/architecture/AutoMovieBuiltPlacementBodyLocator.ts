/**
 * An addressable placed body whose current world bounds a building query can
 * derive without expanding authored repetition.
 *
 * An id that names nothing, or an element that is a transform-only group with
 * no model, resolves to no extent, and every query reports such a locator as
 * unresolved rather than throwing.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union on `kind`; `builtEnvironmentPlacementBounds` resolves an element through its tessellated model and full hierarchy transform and a population by `set.id` through its placement-bounds fold, returning null for an unknown id or a model-less element.
 * @evidence contracts/common.md#clear-and-simple-design Two arms holding only a kind and an id, so the overlap and support queries and their sweeps share one addressing type instead of passing raw element or population records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A population is never expanded into members to answer a query, and an unresolvable locator is listed as unresolved by the overlap and support queries instead of being skipped or thrown.
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
