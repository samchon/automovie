import {
  AUTOMOVIE_PRIMITIVE_ARCHETYPES,
  AutoMovieModelArchetypeRegistry,
  IAutoMovieModelArchetype,
  STICKMAN_ARCHETYPE,
  createAutoMovieArchetypeRegistry,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, throwsError } from "../internal/predicates";

/** A registrable definition that differs from the stickman only by its id. */
const named = (id: string): IAutoMovieModelArchetype => ({
  ...STICKMAN_ARCHETYPE,
  id,
});

/**
 * Registration keys each definition by its own exact id and refuses a blank or
 * repeated one at the first fault.
 *
 * The registry is the only place a duplicate id can still be told apart from
 * its twin, so a registration that kept the last definition, normalized an id,
 * or skipped a blank one would let a recipe reach a builder nobody chose.
 *
 * Scenarios:
 *
 * 1. The shipped catalogue registers in iteration order under each
 *    definition's own id, mapping to that same definition object, and an empty
 *    catalogue registers as an empty map; two calls return distinct maps.
 * 2. An empty id and a whitespace-only id are refused with the correction, and
 *    an id carrying surrounding whitespace is stored exactly as written beside
 *    its trimmed spelling, which is a different id.
 * 3. A repeated id is refused by name, while two ids that differ only in case
 *    are both registered.
 * 4. The iterable is consumed once and in order: the first fault throws, and
 *    no later definition is pulled from the source.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `createAutoMovieArchetypeRegistry` with arrays and a generator and asserts the returned map's keys, values and identity and the thrown messages, catching a normalized key, a last-wins duplicate, a silently skipped blank id and a source read past its first fault, while allowing any message wording that keeps the asserted fragments.
 * @evidence contracts/testing.md#independent-expectations Expected keys and refusals come from the factory's documented contract (exact case-sensitive ids, blank and repeated ids refused at the first fault, surrounding whitespace preserved) and from the catalogue's own `id` fields, not from the function's output; the oracle checks message fragments, not full sentences.
 * @evidence contracts/testing.md#distinguishing-cases Covers the empty catalogue, the two-member shipped catalogue, the empty and whitespace-only refusals beside the adjacent padded id that must be kept, the duplicate refusal beside the adjacent case-only difference that must be kept, and the stop-at-first-fault boundary; how the design gate and materializer react to an unregistered archetype belongs to the production tests.
 * @evidence contracts/testing.md#execution-ownership A unit test discovered by the `test_` prefix that runs the factory in-process on in-memory definitions, starting no process, browser or GPU and registering no dynamic cases.
 */
export function test_archetypes_registry(): void {
  const shipped: AutoMovieModelArchetypeRegistry =
    createAutoMovieArchetypeRegistry(AUTOMOVIE_PRIMITIVE_ARCHETYPES);
  TestValidator.equals(
    "the shipped catalogue registers under its own ids in order",
    [...shipped.keys()],
    AUTOMOVIE_PRIMITIVE_ARCHETYPES.map(
      (archetype: IAutoMovieModelArchetype): string => archetype.id,
    ),
  );
  TestValidator.equals(
    "each key maps to that same definition, and each call builds a new map",
    namedFacts([
      [
        "identical",
        (): boolean =>
          AUTOMOVIE_PRIMITIVE_ARCHETYPES.every(
            (archetype: IAutoMovieModelArchetype): boolean =>
              shipped.get(archetype.id) === archetype,
          ),
      ],
      [
        "fresh",
        (): boolean =>
          createAutoMovieArchetypeRegistry(AUTOMOVIE_PRIMITIVE_ARCHETYPES) !==
          shipped,
      ],
      ["empty", (): boolean => createAutoMovieArchetypeRegistry([]).size === 0],
    ]),
    { identical: true, fresh: true, empty: true },
  );

  const padded: AutoMovieModelArchetypeRegistry =
    createAutoMovieArchetypeRegistry([named(" figure "), named("figure")]);
  TestValidator.equals(
    "a blank id is refused while a padded id is kept as written",
    namedFacts([
      [
        "empty",
        (): boolean =>
          throwsError(
            (): AutoMovieModelArchetypeRegistry =>
              createAutoMovieArchetypeRegistry([named("")]),
            "non-whitespace text",
          ),
      ],
      [
        "whitespace",
        (): boolean =>
          throwsError(
            (): AutoMovieModelArchetypeRegistry =>
              createAutoMovieArchetypeRegistry([named(" \t\n")]),
            "non-whitespace text",
          ),
      ],
      [
        "padded",
        (): boolean =>
          padded.size === 2 && padded.has(" figure ") && padded.has("figure"),
      ],
    ]),
    { empty: true, whitespace: true, padded: true },
  );

  const cased: AutoMovieModelArchetypeRegistry =
    createAutoMovieArchetypeRegistry([named("figure"), named("Figure")]);
  TestValidator.equals(
    "a repeated id is refused by name while a case difference is two ids",
    namedFacts([
      [
        "repeated",
        (): boolean =>
          throwsError(
            (): AutoMovieModelArchetypeRegistry =>
              createAutoMovieArchetypeRegistry([
                named("figure"),
                named("prop"),
                named("figure"),
              ]),
            ['"figure"', "registered twice"],
          ),
      ],
      [
        "cased",
        (): boolean =>
          cased.size === 2 && cased.get("Figure")?.id === "Figure",
      ],
    ]),
    { repeated: true, cased: true },
  );

  const pulled: string[] = [];
  const source: () => Generator<IAutoMovieModelArchetype> =
    function* (): Generator<IAutoMovieModelArchetype> {
      for (const id of ["figure", "figure", ""]) {
        pulled.push(id);
        yield named(id);
      }
    };
  TestValidator.equals(
    "the first fault throws and the source is read no further",
    namedFacts([
      [
        "firstFault",
        (): boolean =>
          throwsError(
            (): AutoMovieModelArchetypeRegistry =>
              createAutoMovieArchetypeRegistry(source()),
            "registered twice",
          ),
      ],
      ["stopped", (): boolean => pulled.length === 2],
    ]),
    { firstFault: true, stopped: true },
  );
}
