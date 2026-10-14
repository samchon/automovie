import type { IAutoMovieBuiltBoundary, IAutoMovieBuiltEnvironment, IAutoMovieDrawingGap, IAutoMovieDrawingSchedule, IAutoMovieDrawingScheduleRow } from "@automovie/interface";
import { deriveAutoMovieDrawingSchedule } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { drawingEnvironment } from "../internal/drawingFixtures";
import { namedFacts, throwsError } from "../internal/predicates";

/**
 * Schedule subjects retain their distinct declared graph locations.
 *
 * Opening places name their host boundary and spaces; connector places name
 * stops; space places retain their own discriminant and content/relation fields.
 * The fixture has distinct opening/connector types, so each tested row represents
 * one occurrence rather than the first place of a grouped multi-member row.
 *
 * Scenarios:
 *
 * 1. An opening states its host boundary and the regions that boundary joins,
 *    under `kind: "opening"`, and the building those regions belong to.
 * 2. Each authored two-ended connector states both declared endpoint spaces.
 * 3. Neither subject owes a location gap any more. Asserted as an absence,
 *    because relabelling a gap and retiring it look identical to a reader who
 *    only checks that the status is no longer wrong.
 * 4. Room places carry the `space` discriminant and their building and
 *    content/adjacency/connector collection fields.
 * 5. A boundary citing no region is still refused by validation, which is why
 *    `separates` is never empty and the derivation needs no case for it. The
 *    refusal is asserted here rather than assumed, because the JSDoc on the
 *    field rests on it.
 *
 * @evidence contracts/testing.md#behavioral-verification Derives actual schedules for all three subjects, guards their 3/2/3 row populations, checks opening boundary/space/building identity, connector endpoint/building identity, removal of obsolete location gaps and space-place shape, then requires validation refusal for an empty boundary space list.
 * @evidence contracts/testing.md#independent-expectations The authored north boundary names hall in unit-a, and both existing connectors declare hall/roof-deck endpoints. Literal location discriminants, identities and absent-gap subjects anchor the expected records; room shape checks do not claim independent values for every room field.
 * @evidence contracts/testing.md#distinguishing-cases Opening/connector/space variants retain separate location fields, location gaps must disappear rather than change status, and the otherwise unchanged boundary with zero spaces must fail at its own path/cause. These two-ended fixtures do not test intermediate landings, multiple buildings or grouped rows with differing places.
 * @evidence contracts/testing.md#execution-ownership Uses existing local atelier declarations and synchronous validation/scheduling with portable predicates, without publication, rendering, resources, clocks, global replacement or another host. Graph location is not a geometric placement or traversal certificate, and historical production behavior is not replayed here.
 */
export function test_drawing_subject_location(): void {
  const environment: IAutoMovieBuiltEnvironment = drawingEnvironment();
  const scheduleOf: (subject: "space" | "opening" | "connector") => IAutoMovieDrawingSchedule = (subject: "space" | "opening" | "connector") : IAutoMovieDrawingSchedule =>
    deriveAutoMovieDrawingSchedule({ environment, subject });

  const openings: IAutoMovieDrawingSchedule = scheduleOf("opening");
  const connectors: IAutoMovieDrawingSchedule = scheduleOf("connector");
  TestValidator.equals("authored subject populations cannot vanish", [openings.rows.length, connectors.rows.length, scheduleOf("space").rows.length], [3, 2, 3]);

  TestValidator.equals(
    "an opening is located by the separation it is cut into",
    namedFacts([
      [
        "every row states an opening place",
        () : boolean => openings.rows.every((row: IAutoMovieDrawingScheduleRow) : boolean => row.place?.kind === "opening"),
      ],
      [
        "naming its host boundary",
        () : boolean =>
          openings.rows.every(
            (row: IAutoMovieDrawingScheduleRow) : boolean =>
              row.place?.kind === "opening" && row.place.boundary === "north",
          ),
      ],
      [
        "and the regions that boundary joins",
        () : boolean =>
          openings.rows.every(
            (row: IAutoMovieDrawingScheduleRow) : boolean =>
              row.place?.kind === "opening" &&
              row.place.separates.join() === "hall",
          ),
      ],
      [
        "and the building unit those regions belong to",
        () : boolean =>
          openings.rows.every(
            (row: IAutoMovieDrawingScheduleRow) : boolean =>
              row.place?.kind === "opening" && row.place.building === "unit-a",
          ),
      ],
      // The gap this replaced. Retiring it and relabelling it read the same to
      // anyone who only checks that the status stopped being wrong.
      [
        "and owes no location gap",
        () : boolean =>
          openings.gaps.some((gap: IAutoMovieDrawingGap) : boolean => gap.subject === "opening-location") ===
          false,
      ],
    ]),
    {
      "every row states an opening place": true,
      "naming its host boundary": true,
      "and the regions that boundary joins": true,
      "and the building unit those regions belong to": true,
      "and owes no location gap": true,
    },
  );

  TestValidator.equals(
    "a connector is located by the regions its declared stops stand in",
    namedFacts([
      [
        "every row states a connector place",
        () : boolean => connectors.rows.every((row: IAutoMovieDrawingScheduleRow) : boolean => row.place?.kind === "connector"),
      ],
      // Both ends, ascending. The fixture's runs are two-ended, so this states
      // the pair; the derivation reads landings the same way, which is what
      // makes a lift serving four floors report four rather than two.
      [
        "naming both of its stops",
        () : boolean =>
          connectors.rows.every(
            (row: IAutoMovieDrawingScheduleRow) : boolean =>
              row.place?.kind === "connector" &&
              row.place.stops.join() === "hall,roof-deck",
          ),
      ],
      [
        "and the building unit they belong to",
        () : boolean =>
          connectors.rows.every(
            (row: IAutoMovieDrawingScheduleRow) : boolean =>
              row.place?.kind === "connector" &&
              row.place.building === "unit-a",
          ),
      ],
      [
        "and owes no location gap",
        () : boolean =>
          connectors.gaps.some(
            (gap: IAutoMovieDrawingGap) : boolean => gap.subject === "connector-location",
          ) === false,
      ],
    ]),
    {
      "every row states a connector place": true,
      "naming both of its stops": true,
      "and the building unit they belong to": true,
      "and owes no location gap": true,
    },
  );

  TestValidator.equals(
    "room places retain their discriminant and content/relation fields",
    namedFacts([
      [
        "every room row is discriminated as a space",
        () : boolean =>
          scheduleOf("space").rows.every((row: IAutoMovieDrawingScheduleRow) : boolean => row.place?.kind === "space"),
      ],
      // The union's cost, if it had one, would land here: a variant that lost a
      // field would still satisfy every assertion above.
      [
        "and still carries what a room answers with",
        () : boolean =>
          scheduleOf("space").rows.every(
            (row: IAutoMovieDrawingScheduleRow) : boolean =>
              row.place?.kind === "space" &&
              typeof row.place.building === "string" &&
              Array.isArray(row.place.contents) &&
              Array.isArray(row.place.adjacent) &&
              Array.isArray(row.place.connectors),
          ),
      ],
    ]),
    {
      "every room row is discriminated as a space": true,
      "and still carries what a room answers with": true,
    },
  );

  // The precondition the opening derivation rests on, asserted rather than
  // assumed: `separates` needs no empty case because a boundary citing no
  // region never reaches the schedule.
  TestValidator.predicate(
    "a boundary that cites no region is refused before a schedule sees it",
    throwsError(
      () : IAutoMovieDrawingSchedule =>
        deriveAutoMovieDrawingSchedule({
          environment: {
            ...environment,
            boundaries: environment.boundaries.map((boundary: IAutoMovieBuiltBoundary) : IAutoMovieBuiltBoundary =>
              boundary.id === "north" ? { ...boundary, spaces: [] } : boundary,
            ),
          },
          subject: "opening",
        }),
      ["boundaries[0].spaces", "enclose one space or separate two"],
    ),
  );
}
