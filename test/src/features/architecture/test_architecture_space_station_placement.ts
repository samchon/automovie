import {
  type IAutoMovieSpaceObservationStation,
  builtSpaceObservationStations,
} from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltOpening,
  IAutoMovieBuiltSpace,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  FACE_ROTATION,
  boxCell,
  originTransform,
} from "../internal/envelopeFixtures";
import { namedFacts, vclose } from "../internal/predicates";

/**
 * Where an interior station stands is settled against the room, not assumed.
 *
 * Extent centres, reading-height positions and corners can lie outside non-box spaces. These cases distinguish a missing extent, a shell whose centre is outside, a height fallback and a convex-cell anchor fallback.
 *
 * Stations that cannot acquire a valid eye/target retain identity with a null pose. The point-volume case separates centre direction from coincident corner/target refusal; faceless and distant thresholds retain membership without a pose.
 *
 * Scenarios:
 *
 * 1. A space whose cells close no volume keeps eight interior stations and one
 *    threshold, placing none because there is no extent to lay them out in.
 * 2. A shelled space whose bounding-box centre falls outside its own solid
 *    places none either, since a shell carries no cell to take a point from.
 * 3. A space narrowing toward its floor keeps the box centre when the reading height
 *    would leave it, instead of standing the camera in the wall.
 * 4. A space with two bounded cells after an unbounded cell takes its anchor
 *    from the first bounded cell when the box centre falls in its notch.
 * 5. A space whose stated volume is a single point places its centre stations,
 *    which look one millimetre outward, and leaves its corner stations unaimed,
 *    because a corner and the centre are the same point there.
 * 6. An opening on a separation carrying no face keeps its threshold station
 *    and reports no place to stand, and so does an opening whose face stands so
 *    far off the room that no step toward the centre reaches inside it.
 * 7. An opening in a space with no extent at all keeps its threshold station
 *    without the opening ever being placed, because there is no anchor to walk
 *    toward.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual station derivation on unbounded cells, a tetrahedral shell, a wedge, a notched cell union, a point volume and unreachable thresholds, observing retained counts, null poses and hand-authored anchor/target coordinates. It catches unplaced stations disappearing or bounding-box assumptions placing an invalid eye.
 * @evidence contracts/testing.md#independent-expectations The unit tetrahedron excludes its box centre because x + y + z = 1.5 exceeds one; x <= y excludes the wedge eye at x=2,y=1.6 while admitting its centre at y=2. The notch's first bounded cell has centre (2, 1.5, 0.5). Coincident point-volume corners cannot aim at themselves, while the declared one-millimetre probe fixes the positive-X centre target; these are analytic inputs rather than saved station output.
 * @evidence contracts/testing.md#distinguishing-cases Retains extent absence, shell fallback absence, reading-height fallback, skipping an unbounded cell before the first bounded cell, zero-volume coincident corners, missing/distant boundary faces and a threshold without an anchor. The companion station test owns the ordinary box, ordering, semantic empty space and unknown-id refusal; these cases do not prove rendered visibility.
 * @evidence contracts/testing.md#execution-ownership The synchronous discoverable test_architecture_space_station_placement entry owns all local cases and invokes portable geometry with authored fixture records; it registers no dynamic case, installs no consumer, builds no artifact and starts no process, browser or GPU.
 */
export function test_architecture_space_station_placement(): void {
  TestValidator.equals(
    "a space that closes no volume keeps its stations and places none",
    unplaced(
      builtSpaceObservationStations(
        room(
          {
            id: "hall",
            kind: "room",
            parent: null,
            cells: [
              {
                id: "sky",
                planes: [{ normal: { x: 0, y: 1, z: 0 }, offset: 3 }],
              },
            ],
          },
          [{ id: "gap", kind: "passage", boundary: "located", fill: null }],
          [locatedWall()],
        ),
        "hall",
      ),
    ),
    { count: 9, placed: 0 },
  );

  TestValidator.equals(
    "a shell whose box centre is outside itself places nothing",
    unplaced(builtSpaceObservationStations(room(tetrahedron()), "hall")),
    { count: 8, placed: 0 },
  );

  TestValidator.equals(
    "an anchor is taken from the room rather than from its box",
    namedFacts([
      [
        "a space narrowing toward its floor keeps its box centre",
        (): boolean =>
          vclose(
            builtSpaceObservationStations(room(wedge()), "hall")[0]!.pose!
              .position,
            { x: 2, y: 2, z: 1 },
          ),
      ],
      [
        "a space whose box centre is in its own notch uses its first cell",
        (): boolean =>
          vclose(
            builtSpaceObservationStations(room(notched()), "hall")[0]!.pose!
              .position,
            { x: 2, y: 1.5, z: 0.5 },
          ),
      ],
    ]),
    {
      "a space narrowing toward its floor keeps its box centre": true,
      "a space whose box centre is in its own notch uses its first cell": true,
    },
  );

  const point: IAutoMovieSpaceObservationStation[] =
    builtSpaceObservationStations(room(pointVolume()), "hall");
  TestValidator.equals(
    "a point volume retains four centres and four corners",
    [
      point.length,
      point.filter(
        (station: IAutoMovieSpaceObservationStation): boolean =>
          station.role === "center",
      ).length,
      point.filter(
        (station: IAutoMovieSpaceObservationStation): boolean =>
          station.role === "corner",
      ).length,
    ],
    [8, 4, 4],
  );

  TestValidator.equals(
    "a point-sized volume looks outward from itself and never at itself",
    namedFacts([
      [
        "its centre stations have poses and the positive-X target is one millimetre away",
        (): boolean =>
          point
            .filter(
              (station: IAutoMovieSpaceObservationStation): boolean =>
                station.role === "center",
            )
            .every(
              (station: IAutoMovieSpaceObservationStation): boolean =>
                station.pose !== null,
            ) && vclose(point[1]!.pose!.target, { x: 0.001, y: 0, z: 0 }),
      ],
      [
        "and its corner stations have nothing to aim at",
        (): boolean =>
          point
            .filter(
              (station: IAutoMovieSpaceObservationStation): boolean =>
                station.role === "corner",
            )
            .every(
              (station: IAutoMovieSpaceObservationStation): boolean =>
                station.pose === null,
            ),
      ],
    ]),
    {
      "its centre stations have poses and the positive-X target is one millimetre away": true,
      "and its corner stations have nothing to aim at": true,
    },
  );

  const faceless: IAutoMovieSpaceObservationStation[] =
    builtSpaceObservationStations(withFacelessOpening(), "hall");

  TestValidator.equals(
    "an unreachable opening keeps its threshold station, unplaced",
    faceless
      .filter(
        (station: IAutoMovieSpaceObservationStation): boolean =>
          station.role === "threshold",
      )
      .map(
        (
          station: IAutoMovieSpaceObservationStation,
        ): (
          | string
          | {
              position: IAutoMovieVector3;
              direction: IAutoMovieVector3;
              target: IAutoMovieVector3;
            }
          | null
        )[] => [station.id, station.pose],
      ),
    [
      ["threshold-distant-gap", null],
      ["threshold-gap", null],
    ],
  );
}

/** One located separation on the north side of the four-by-six hall. */
const locatedWall: () => IAutoMovieBuiltEnvironment["boundaries"][number] =
  (): IAutoMovieBuiltEnvironment["boundaries"][number] => ({
    id: "located",
    kind: "wall",
    spaces: ["hall"],
    elements: [],
    face: {
      origin: { x: 0, y: 0, z: 6 },
      rotation: FACE_ROTATION.keepZ,
      outline: [
        { x: 0, y: 0 },
        { x: 4, y: 0 },
        { x: 4, y: 3 },
        { x: 0, y: 3 },
      ],
      thickness: 0.2,
    },
  });

/** How many stations came back and how many of them found a place to stand. */
const unplaced: (stations: ReadonlyArray<{ pose: unknown }>) => {
  count: number;
  placed: number;
} = (
  stations: ReadonlyArray<{ pose: unknown }>,
): { count: number; placed: number } => ({
  count: stations.length,
  placed: stations.filter(
    (station: { pose: unknown }): boolean => station.pose !== null,
  ).length,
});

/** One building unit wrapped around one hand-written logical space. */
const room: (
  space: IAutoMovieBuiltSpace,
  openings?: IAutoMovieBuiltOpening[],
  boundaries?: IAutoMovieBuiltEnvironment["boundaries"],
) => IAutoMovieBuiltEnvironment = (
  space: IAutoMovieBuiltSpace,
  openings: IAutoMovieBuiltOpening[] = [],
  boundaries: IAutoMovieBuiltEnvironment["boundaries"] = [],
): IAutoMovieBuiltEnvironment => ({
  version: 1,
  id: "placement",
  units: "meter",
  buildings: [{ id: "house", element: "house-root", space: space.id }],
  models: [],
  modelReferences: [],
  elements: [
    {
      id: "house-root",
      kind: "building",
      parent: null,
      transform: originTransform(),
      model: null,
      space: space.id,
    },
  ],
  spaces: [space],
  boundaries,
  openings,
  connectors: [],
  surfaces: [],
  walkable: [],
});

/**
 * The tetrahedron on the origin and the three unit axes.
 *
 * Its bounding box is the unit cube, whose centre sums to `1.5` against a
 * closing plane at `1`, so the box centre is outside the solid.
 */
const tetrahedron: () => IAutoMovieBuiltSpace = (): IAutoMovieBuiltSpace => ({
  id: "hall",
  kind: "room",
  parent: null,
  cells: [],
  shell: {
    vertices: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 0, z: 1 },
    ],
    // Every face wound counter-clockwise seen from outside the solid.
    triangles: [0, 2, 1, 0, 3, 2, 0, 1, 3, 1, 2, 3],
  },
});

/**
 * A room whose section narrows toward its floor, cut by `x <= y`.
 *
 * Its box centre lies exactly on that cut and is inside; the reading height one
 * point six metres up is not, so the anchor stays the centre.
 */
const wedge: () => IAutoMovieBuiltSpace = (): IAutoMovieBuiltSpace => ({
  id: "hall",
  kind: "room",
  parent: null,
  cells: [
    {
      id: "wedge-cell",
      planes: [
        ...boxCell("box", { x: 0, y: 0, z: 0 }, { x: 4, y: 4, z: 2 }).planes,
        { normal: { x: 1, y: -1, z: 0 }, offset: 0 },
      ],
    },
  ],
});

/**
 * An L whose bounding-box centre falls in its own notch.
 *
 * The long arm runs four metres in x and one in z; the short arm one metre in x
 * and three more in z. The box centre at `(2, ·, 2)` is in neither.
 */
const notched: () => IAutoMovieBuiltSpace = (): IAutoMovieBuiltSpace => ({
  id: "hall",
  kind: "room",
  parent: null,
  cells: [
    // A half-space five metres under the floor closes no volume and holds no
    // point of the room, so the anchor walk must pass over it to reach the arm.
    { id: "below", planes: [{ normal: { x: 0, y: 1, z: 0 }, offset: -5 }] },
    boxCell("long", { x: 0, y: 0, z: 0 }, { x: 4, y: 3, z: 1 }),
    boxCell("short", { x: 0, y: 0, z: 1 }, { x: 1, y: 3, z: 4 }),
  ],
});

/** A stated volume that is one point, closed by six planes through the origin. */
const pointVolume: () => IAutoMovieBuiltSpace = (): IAutoMovieBuiltSpace => ({
  id: "hall",
  kind: "room",
  parent: null,
  cells: [boxCell("point", { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 })],
});

/**
 * A room whose two openings are each unreachable for a different reason.
 *
 * `gap` is declared on a separation that states no face, so nothing says where
 * its mouth is. `distant-gap` has a face fifty metres east of the room, so its
 * mouth is real and every step of the ladder toward the room's centre is still
 * outside the room.
 */
const withFacelessOpening: () => IAutoMovieBuiltEnvironment =
  (): IAutoMovieBuiltEnvironment =>
    room(
      {
        id: "hall",
        kind: "room",
        parent: null,
        cells: [
          boxCell("hall-cell", { x: 0, y: 0, z: 0 }, { x: 4, y: 3, z: 6 }),
        ],
      },
      [
        { id: "gap", kind: "passage", boundary: "logical", fill: null },
        { id: "distant-gap", kind: "passage", boundary: "distant", fill: null },
      ],
      [
        { id: "logical", kind: "threshold", spaces: ["hall"], elements: [] },
        locatedWall(),
        {
          id: "distant",
          kind: "wall",
          spaces: ["hall"],
          elements: [],
          face: {
            origin: { x: 50, y: 0, z: 0 },
            rotation: FACE_ROTATION.keepZ,
            outline: [
              { x: 0, y: 0 },
              { x: 4, y: 0 },
              { x: 4, y: 3 },
              { x: 0, y: 3 },
            ],
            thickness: 0.2,
          },
        },
      ],
    );
