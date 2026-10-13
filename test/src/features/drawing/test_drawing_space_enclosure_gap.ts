import { deriveAutoMovieDrawingSchedule } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { drawingEnvironment } from "../internal/drawingFixtures";
import { namedFacts } from "../internal/predicates";

/**
 *
 * A room schedule says out loud that it states nothing about what encloses a
 * room.
 *
 * `space-fit-out` already declares the half that stands **in** a room — finish,
 * furniture, fixture, equipment, light, service terminal — and says not to read
 * an absent finish row as an unfinished room. The half that **encloses** it was
 * declared nowhere. So a row stated identity, extent, contents and relations,
 * and a reader holding that list had no way to learn that the boundaries around
 * the room were not among them.
 *
 * Two `#1954` productions turned that into a measured failure. Both assigned
 * every floor slab to a storey rather than to the rooms it covers, which is
 * what the record asks for — a slab between two storeys belongs to neither room
 * alone, and {@link IAutoMovieBuiltPopulation.space} states that a room's
 * contents are what stands in it and not what covers it. Every rule behaved as
 * designed. `building:report` exited 0 with thirty-odd declared gaps naming
 * none of it while the reflected ceiling plan drew over a thousand lines, and a
 * room whose ceiling was owned elsewhere on purpose was indistinguishable from
 * a room with no ceiling at all.
 *
 * The remedy names a query rather than a check, and that is the load-bearing
 * decision. `IAutoMovieBuiltBoundary.kind` is documented as an **open** label:
 * a third production spells its separations `interior-partition` and
 * `floor-opening` without being wrong, so a derivation scanning for `"ceiling"`
 * would find none and report confidently. The product already has a precedent
 * for exactly this — it declares an occlusion ratio unmeasured and names the
 * inspection that answers it — and this follows it: state what is not derived,
 * and name what the reader can ask instead.
 *
 * Scenarios:
 *
 * 1. A room schedule declares the enclosure gap, as `unsupported` rather than
 *    `not-run`: no author can supply a derivation that does not exist, which is
 *    the pairing `#2032` had to correct once already on this same function.
 * 2. An opening and a connector owe no enclosure gap. They are not enclosed by
 *    boundaries, they *are* the separation or the passage, and widening the gap
 *    to every subject would file a gap nothing could ever close.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `deriveAutoMovieDrawingSchedule` once per subject (`space`, `opening`, `connector`) and looks up the `space-enclosure` entry in each returned `gaps` list, asserting it exists with status `unsupported` for rooms and is absent for the other two; it catches the gap being dropped from room schedules, filed as `not-run` as if an author could close it, or spread onto subjects that are the separation themselves.
 * @evidence contracts/testing.md#independent-expectations Presence follows from the subject rule in scenario 2 and the status from the gap vocabulary's meaning, `unsupported` for a derivation the product does not have against `not-run` for input an author has not supplied, which is the `#2032` correction; the reason and remedy sentences are fixed text in the engine, so their wording is deliberately not compared.
 * @evidence contracts/testing.md#distinguishing-cases One positive subject (rooms) and two negatives (openings, connectors) over the same fixture, so only the subject decides the outcome; the gap's position among all room gaps is owned by test_drawing_space_schedule, and `builtEnvironmentSpaceBoundaries`, the query the remedy points readers to, is not called here.
 */
export const test_drawing_space_enclosure_gap = (): void => {
  const gapOf = (subject: "space" | "opening" | "connector") =>
    deriveAutoMovieDrawingSchedule({
      environment: drawingEnvironment(),
      subject,
    }).gaps.find((gap) => gap.subject === "space-enclosure") ?? null;

  const enclosure = gapOf("space");

  TestValidator.equals(
    "a room schedule declares what it says about the boundaries around a room",
    namedFacts([
      ["a room owes the gap", () => enclosure !== null],
      // `not-run` would say an author could supply something and has not. The
      // same file had that exact pairing corrected on its location gaps.
      ["as unsupported", () => enclosure?.status === "unsupported"],
      ["an opening owes none", () => gapOf("opening") === null],
      ["a connector owes none", () => gapOf("connector") === null],
    ]),
    {
      "a room owes the gap": true,
      "as unsupported": true,
      "an opening owes none": true,
      "a connector owes none": true,
    },
  );
};
