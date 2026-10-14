import {
  type IAutoMovieSpaceObservationStation,
  builtSpaceContainsPoint,
  builtSpaceObservationStations,
} from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  lFootprintBuilding,
  rectangularBuilding,
} from "../internal/envelopeFixtures";
import { namedFacts, throwsError, vclose } from "../internal/predicates";

/**
 * Derive the ordered interior-station population from a room's volume and openings.
 *
 * The contract supplies four outward centre stations, four inward corner stations and one threshold per opening. Extra openings add membership; an unplaceable station remains in the population with a null pose.
 *
 * Literal box coordinates independently check eye/target placement. The additional product containment call checks consistency with the shared volume reader rather than serving as an independent oracle for that reader.
 *
 * Scenarios:
 *
 * 1. The rectangular hall owes exactly nine stations, in one deterministic
 *    order: four from its centre, four from its corners, one at its door.
 * 2. Every one of those positions equals the metres typed by hand from the
 *    room's own extent, and each is inside the room's own stated volume.
 * 3. Selected centre stations look along horizontal axes, and selected corner
 *    and threshold directions point back toward the centre.
 * 4. A second opening on the same room adds a tenth station, so the population
 *    follows the topology rather than a fixed count. An uncut opening is placed
 *    from its host face, since a passage with no void still has an arrival.
 * 5. The L-shaped wing owes eight stations and no threshold, and the corner of
 *    its bounding box that falls in the notch is present with no pose, because
 *    no point on the ladder toward the centre is inside the room.
 * 6. A space that states no volume is a name rather than a room and owes
 *    nothing.
 * 7. A space the record does not hold is refused by name.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual station derivation and observes ordered identities, literal metre positions, outward/inward aim, added threshold membership, a retained unplaced notch corner, empty semantic population and unknown-space Error. It catches fixed counts, wrong role order and off-shape extent assumptions.
 * @evidence contracts/testing.md#independent-expectations A 4 by 3 by 6 metre box has midpoint (2, 1.5, 3); the declared five-percent inward observation step gives corner/door offsets 0.1 and 0.15, and normalized diagonal offsets give the expected aim. Authored opening ids and L-cell inequalities determine added membership and the absent notch pose. Product containment is only a consistency observation and rendered visibility is unobserved.
 * @evidence contracts/testing.md#distinguishing-cases Retains one/two threshold populations, a boundary-face passage without a cut profile, inward/outward directions, a concave notch with null pose, a volume-less child and unknown id. The placement companion owns unbounded, shelled, narrowing and point-volume fallbacks; arbitrary camera visibility and obstruction are outside this entry.
 * @evidence contracts/testing.md#execution-ownership The synchronous discoverable test_architecture_space_stations entry owns its cases and local placedAt observations over portable engine functions and authored fixture inputs; no dynamic registration, consumer installation, native build, process, browser or GPU is required.
 */
export function test_architecture_space_stations(): void {
  const record: IAutoMovieBuiltEnvironment = rectangularBuilding();
  const hall: IAutoMovieBuiltSpace = record.spaces[0]!;
  const stations: IAutoMovieSpaceObservationStation[] =
    builtSpaceObservationStations(record, "hall");

  TestValidator.equals(
    "the hall owes its nine interior stations in a fixed order",
    stations.map(
      (station: IAutoMovieSpaceObservationStation): (string | null)[] => [
        station.id,
        station.role,
        station.opening,
      ],
    ),
    [
      ["center-x-minus", "center", null],
      ["center-x-plus", "center", null],
      ["center-z-minus", "center", null],
      ["center-z-plus", "center", null],
      ["corner-x-minus-z-minus", "corner", null],
      ["corner-x-minus-z-plus", "corner", null],
      ["corner-x-plus-z-minus", "corner", null],
      ["corner-x-plus-z-plus", "corner", null],
      ["threshold-door-main", "threshold", "door-main"],
    ],
  );

  TestValidator.equals(
    "every station stands at the metre it was derived to stand at",
    placedAt(stations, [
      { x: 2, y: 1.5, z: 3 },
      { x: 2, y: 1.5, z: 3 },
      { x: 2, y: 1.5, z: 3 },
      { x: 2, y: 1.5, z: 3 },
      { x: 0.1, y: 1.5, z: 0.15 },
      { x: 0.1, y: 1.5, z: 5.85 },
      { x: 3.9, y: 1.5, z: 0.15 },
      { x: 3.9, y: 1.5, z: 5.85 },
      { x: 2, y: 1.5, z: 0.15 },
    ]),
    {
      "center-x-minus": true,
      "center-x-plus": true,
      "center-z-minus": true,
      "center-z-plus": true,
      "corner-x-minus-z-minus": true,
      "corner-x-minus-z-plus": true,
      "corner-x-plus-z-minus": true,
      "corner-x-plus-z-plus": true,
      "threshold-door-main": true,
    },
  );

  TestValidator.equals(
    "and every one of them stands inside the hall itself",
    stations.every(
      (station: IAutoMovieSpaceObservationStation): boolean =>
        station.pose !== null &&
        builtSpaceContainsPoint(hall, station.pose.position),
    ),
    true,
  );

  TestValidator.equals(
    "the centre looks out along the axes and everything else looks back at it",
    namedFacts([
      [
        "the centre station aimed at decreasing x reaches past the west wall",
        (): boolean =>
          vclose(stations[0]!.pose!.direction, { x: -1, y: 0, z: 0 }) &&
          vclose(stations[0]!.pose!.target, { x: -4, y: 1.5, z: 3 }),
      ],
      [
        "the centre station aimed at increasing z reaches past the north wall",
        (): boolean =>
          vclose(stations[3]!.pose!.direction, { x: 0, y: 0, z: 1 }) &&
          vclose(stations[3]!.pose!.target, { x: 2, y: 1.5, z: 9 }),
      ],
      [
        "the south-west corner looks diagonally across the room",
        (): boolean =>
          vclose(stations[4]!.pose!.direction, {
            x: 2 / Math.hypot(2, 3),
            y: 0,
            z: 3 / Math.hypot(2, 3),
          }) && vclose(stations[4]!.pose!.target, { x: 2, y: 1.5, z: 3 }),
      ],
      [
        "and the doorway looks straight into it",
        (): boolean =>
          vclose(stations[8]!.pose!.direction, { x: 0, y: 0, z: 1 }),
      ],
    ]),
    {
      "the centre station aimed at decreasing x reaches past the west wall": true,
      "the centre station aimed at increasing z reaches past the north wall": true,
      "the south-west corner looks diagonally across the room": true,
      "and the doorway looks straight into it": true,
    },
  );

  const sideStations: IAutoMovieSpaceObservationStation[] =
    builtSpaceObservationStations(withSideHatch(), "hall");
  TestValidator.equals(
    "a second opening adds one station to the full population",
    sideStations.length,
    10,
  );
  TestValidator.equals(
    "a second opening adds its own threshold, placed from its host face",
    placedAt(
      sideStations.filter(
        (station: IAutoMovieSpaceObservationStation): boolean =>
          station.role === "threshold",
      ),
      [
        { x: 2, y: 1.5, z: 0.15 },
        { x: 3.9, y: 1.5, z: 3 },
      ],
    ),
    {
      "threshold-door-main": true,
      "threshold-hatch-east": true,
    },
  );

  const wing: IAutoMovieBuiltEnvironment = lFootprintBuilding();

  TestValidator.equals(
    "the notch corner keeps its identity and reports no place to stand",
    placedAt(builtSpaceObservationStations(wing, "hall"), [
      { x: 2, y: 1.5, z: 2 },
      { x: 2, y: 1.5, z: 2 },
      { x: 2, y: 1.5, z: 2 },
      { x: 2, y: 1.5, z: 2 },
      { x: 0.1, y: 1.5, z: 0.1 },
      { x: 0.1, y: 1.5, z: 3.9 },
      { x: 3.9, y: 1.5, z: 0.1 },
      null,
    ]),
    {
      "center-x-minus": true,
      "center-x-plus": true,
      "center-z-minus": true,
      "center-z-plus": true,
      "corner-x-minus-z-minus": true,
      "corner-x-minus-z-plus": true,
      "corner-x-plus-z-minus": true,
      "corner-x-plus-z-plus": true,
    },
  );

  TestValidator.equals(
    "a space that bounds nothing owes nothing, and an absent one is refused",
    namedFacts([
      [
        "a purely semantic container has no interior population",
        (): boolean =>
          builtSpaceObservationStations(withNamedWing(), "west-wing").length ===
          0,
      ],
      [
        "and a space the record does not hold is named in the refusal",
        (): boolean =>
          throwsError(
            (): IAutoMovieSpaceObservationStation[] =>
              builtSpaceObservationStations(record, "cellar"),
            ["hall-house", "cellar"],
          ),
      ],
    ]),
    {
      "a purely semantic container has no interior population": true,
      "and a space the record does not hold is named in the refusal": true,
    },
  );
}

/**
 * Whether each station in order stands at its expected metre, by station id.
 *
 * Positions are building metres and use the shared vector comparison. Null expects a station present with no pose; the owning entry separately requires the full named population, so a missing station cannot pass by an empty iteration.
 */
const placedAt: (
  stations: ReadonlyArray<{
    id: string;
    pose: { position: IAutoMovieVector3 } | null;
  }>,
  expected: ReadonlyArray<IAutoMovieVector3 | null>,
) => Record<string, boolean> = (
  stations: ReadonlyArray<{
    id: string;
    pose: { position: IAutoMovieVector3 } | null;
  }>,
  expected: ReadonlyArray<IAutoMovieVector3 | null>,
): Record<string, boolean> =>
  namedFacts(
    stations.map(
      (
        station: { id: string; pose: { position: IAutoMovieVector3 } | null },
        index: number,
      ): readonly [string, () => boolean] =>
        [
          station.id,
          (): boolean => {
            const want: IAutoMovieVector3 | null = expected[index] ?? null;
            return (
              stations.length === expected.length &&
              (want === null
                ? station.pose === null
                : station.pose !== null && vclose(station.pose.position, want))
            );
          },
        ] as const,
    ),
  );

/** The hall with one uncut passage added through its east wall. */
const withSideHatch: () => IAutoMovieBuiltEnvironment =
  (): IAutoMovieBuiltEnvironment => {
    const record: IAutoMovieBuiltEnvironment = rectangularBuilding();
    return {
      ...record,
      openings: [
        ...record.openings,
        {
          id: "hatch-east",
          kind: "passage",
          boundary: "wall-east",
          fill: null,
        },
      ],
    };
  };

/** The hall with one child space that carries a name and no volume. */
const withNamedWing: () => IAutoMovieBuiltEnvironment =
  (): IAutoMovieBuiltEnvironment => {
    const record: IAutoMovieBuiltEnvironment = rectangularBuilding();
    return {
      ...record,
      spaces: [
        ...record.spaces,
        { id: "west-wing", kind: "zone", parent: "hall", cells: [] },
      ],
    };
  };
