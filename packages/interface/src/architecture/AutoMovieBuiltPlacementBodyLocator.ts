/**
 * An addressable placed body whose current world bounds a building query can
 * derive without expanding authored repetition.
 *
 * An id that names nothing, or an element that is a transform-only group with
 * no model, resolves to no extent, and every query reports such a locator as
 * unresolved rather than throwing.
 *
 * @evidence contracts/common.md#principled-implementation A two-arm union discriminated by `kind` addresses an element by its id or a population by its instance set's `set.id`; `builtEnvironmentPlacementBounds` resolves either one and answers null for a missing id or a model-less element.
 * @evidence contracts/common.md#clear-and-simple-design Locators carry ids instead of geometry, so overlap, support and sweep results cite a body without copying its extent or its basis twice.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A population is addressed and measured as one compact envelope and never expanded into members, and no element kind gets an arm of its own.
 * @evidence contracts/common.md#meaningful-documentation States which identity each arm cites, that populations stay unexpanded, and when a locator resolves to no extent and is reported as unresolved.
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
