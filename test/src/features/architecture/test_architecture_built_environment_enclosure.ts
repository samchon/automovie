import type {
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltEnvironment,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { builtEnvironmentAdjacentSpaces, builtEnvironmentSpaceBoundaries } from "@automovie/engine";

import { drawingEnvironment } from "../internal/drawingFixtures";
import { namedFacts, throwsError } from "../internal/predicates";

/**
 * Read exact boundary membership and inspect ids, authored kind labels, realizing elements and face presence beside adjacency.
 *
 * Scenarios:
 * 1. A room answers with its boundary whole. `hall` is enclosed by `north`, and the row states the `wall` kind and the `north-wall` element realizing it — the two facts a reduction to ids would have dropped, and the two that separate a built wall from a declared one.
 * 2. A boundary nothing builds is still returned, and is still distinguishable. `roof-deck`'s parapet is declared with an empty `elements`, so "the design says a parapet is here" and "something realizes it" stay separate answers.
 * 3. Matched exactly, not through containment. `site` contains both rooms and therefore both boundaries, and is enclosed by neither — the rule `builtEnvironmentAdjacentSpaces` and `builtEnvironmentSpaceConnectors` already follow, so asking a storey does not return every partition inside its rooms.
 * 4. The question `#2035` was filed for is now answerable on this design too: `hall` is enclosed by a wall and by nothing of kind `ceiling`, while the same design renders a reflected ceiling plan. Adjacency is asserted beside it as the control — it names the space on the far side and never the boundary that joined them, which is why the question had no home before. That case reads `kind` to describe this fixture and not to prescribe a check. `kind` is typed `string` and documented as an **open** label, so a third benchmark production spells its separations `interior-partition` and `floor-opening` without violating anything, and a consumer scanning for `"ceiling"` would find none and conclude wrongly. Making enclosure readable is what this query settles; what a reader may key on is `#2035`'s to decide, and every candidate answer — a canonical vocabulary, the face normal, the spaces plus geometry — needs this reader first.
 * 5. An unknown space is refused by name rather than answered with an empty list, which is the difference between "nothing encloses this room" and "there is no such room".
 *
 * @evidence contracts/testing.md#behavioral-verification Calls builtEnvironmentSpaceBoundaries and adjacency on the drawing fixture, checking boundary counts/ids, selected kind/elements, face presence, parent exclusion and an unknown-space error fragment. Dropping the unbuilt parapet, returning descendant boundaries or substituting adjacency ids would change these observations; the face's numeric contents and object identity are not asserted.
 * @evidence contracts/testing.md#independent-expectations The drawing fixture explicitly binds north to hall and a realized wall, and parapet to roof-deck with no realizing element; its parent site owns neither boundary directly, so the expected rows come from authored membership.
 * @evidence contracts/testing.md#distinguishing-cases Realized and unbuilt boundaries, parent exclusion, absence of a ceiling label, adjacency controls and unknown-space refusal distinguish exact membership from descendant contents; open kind strings do not prove a canonical ceiling classification.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_architecture_built_environment_enclosure imports the actual engine/archetype operations and owns its locally enumerated cases; no dynamic registration, consumer installation, native artifact build, process, browser or GPU host is required.
 */
export function test_architecture_built_environment_enclosure(): void {
  const environment: IAutoMovieBuiltEnvironment = drawingEnvironment();
  const enclosureOf: (space: string) => IAutoMovieBuiltBoundary[] = (
    space: string,
  ): IAutoMovieBuiltBoundary[] =>
    builtEnvironmentSpaceBoundaries(environment, space);

  const hall: IAutoMovieBuiltBoundary[] = enclosureOf("hall");
  const deck: IAutoMovieBuiltBoundary[] = enclosureOf("roof-deck");

  TestValidator.equals(
    "a space answers with the boundaries it is named on, whole",
    namedFacts([
      ["a room is enclosed by one boundary", (): boolean => hall.length === 1],
      ["and it is the wall", (): boolean => hall[0]?.id === "north"],
      // This fixture calls its wall "wall"; kind remains an open authored label.
      // Realizing element ids distinguish its built wall from its unbuilt parapet.
      ["stating its kind", (): boolean => hall[0]?.kind === "wall"],
      [
        "and the element realizing it",
        (): boolean => hall[0]?.elements.join() === "north-wall",
      ],
      // Observe face presence, without claiming its numeric fields or identity.
      ["with its face intact", (): boolean => hall[0]?.face !== undefined],
      ["a roof deck is enclosed by one too", (): boolean => deck.length === 1],
      ["which is the parapet", (): boolean => deck[0]?.id === "parapet"],
      // Declared and unbuilt. The empty list is the answer, not a failure to
      // find one, so it must survive rather than be filtered out.
      ["that nothing realizes", (): boolean => deck[0]?.elements.length === 0],
    ]),
    {
      "a room is enclosed by one boundary": true,
      "and it is the wall": true,
      "stating its kind": true,
      "and the element realizing it": true,
      "with its face intact": true,
      "a roof deck is enclosed by one too": true,
      "which is the parapet": true,
      "that nothing realizes": true,
    },
  );

  TestValidator.equals(
    "enclosure is matched exactly, and a missing ceiling is finally askable",
    namedFacts([
      // `site` is the parent of both rooms, so a containment rule would hand it
      // both boundaries and report the building as enclosed by its own interior.
      [
        "the building it all stands in is enclosed by nothing",
        (): boolean => enclosureOf("site").length === 0,
      ],
      // #2035 in one line, on this repository's own fixture: the design draws a
      // reflected ceiling plan and the room's own enclosure names no ceiling.
      // Read as a description of this design; `kind` is an open label and a
      // production may spell the same separation differently without being
      // wrong.
      [
        "and the room can now say so itself",
        (): boolean =>
          hall.some(
            (boundary: IAutoMovieBuiltBoundary): boolean =>
              boundary.kind === "ceiling",
          ) === false,
      ],
      // The control. Adjacency is the only derivation that ever read a
      // boundary, and it reports the space on the far side; the boundary that
      // put the two spaces in the same sentence is not in its answer, so it
      // could never have been asked what stands around a room.
      [
        "adjacency answers with the far space",
        (): boolean =>
          builtEnvironmentAdjacentSpaces(environment, "hall").join() ===
          "roof-deck",
      ],
      [
        "and never with the boundary enclosing it",
        (): boolean =>
          builtEnvironmentAdjacentSpaces(environment, "hall").includes(
            "north",
          ) === false,
      ],
    ]),
    {
      "the building it all stands in is enclosed by nothing": true,
      "and the room can now say so itself": true,
      "adjacency answers with the far space": true,
      "and never with the boundary enclosing it": true,
    },
  );

  // Asserted through `throwsError` rather than `TestValidator.error`, which
  // cannot fail for a synchronous task: it raises its own "exception must be
  // thrown" inside the same `try` that then swallows it. The refusal is also
  // read for the space id, so an unrelated throw cannot stand in for it.
  TestValidator.predicate(
    "an unknown space is refused by name",
    throwsError(
      (): IAutoMovieBuiltBoundary[] =>
        builtEnvironmentSpaceBoundaries(environment, "cellar"),
      ["cellar", "no logical space"],
    ),
  );
}
