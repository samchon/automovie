import { deriveAutoMovieDrawingSchedule } from "@automovie/engine";
import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  type IAutoMovieDrawingGap,
  type IAutoMovieDrawingSchedule,
  type IAutoMovieDrawingScheduleRow,
  IAutoMovieDrawingSpacePlace,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { drawingCell, drawingEnvironment } from "../internal/drawingFixtures";
import { test02DrawingSpaceVolumes } from "../internal/test02DrawingSpaceVolumes";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * A room schedule is the index a reviewer works a building from.
 *
 * Every number below is hand arithmetic over the fixture's own declarations.
 * The hall is declared 0..10 x 0..3 x 0..6, and its contents run from the
 * footing's underside at y -0.7 to the wall head at y 3, so the declared cell
 * and the content box are not the same box. The roof deck is the opposite
 * case: it is declared over the whole 10 x 6
 * plan while the only thing standing on it is a beam over x 0..6, z 2.85..3.15,
 * demonstrating that declared and content boxes answer different questions.
 *
 * Scenarios:
 *
 * 1. Every declared space is one row, the total is the design's own space
 *    count, and the row counts sum to it.
 * 2. A room is located: building, parent, declared cell, content box, volume
 *    fidelity, membership, adjacency and connections all come from the
 *    environment's own declarations rather than from id shape.
 * 3. A space that states no volume is `unmeasured` with null dimensions and a
 *    declared gap, and its contents are still measured.
 * 4. Membership is bounded like any schedule sample, and the omitted count
 *    reconciles the observed full population count.
 * 5. A shell-stated space is measured from its own vertices, including a shell
 *    with a large pre-existing interior vertex list; a chamfered
 *    cell and an unclosed cell are refused rather than approximated.
 * 6. Two identical rooms are two rows, marked in an order the authoring order
 *    cannot reach, and the same design schedules the same digest twice.
 * 7. Opening and connector rows carry their own place discriminants and no
 *    obsolete location gap.
 *
 * @evidence contracts/testing.md#behavioral-verification Schedules the existing atelier spaces and checks one row per space, row-count reconciliation, literal hall/deck/site declared and content boxes, membership/adjacency/connector summaries, empty-volume gaps, bounded content counts, alternate volume spellings and ordering/digest behavior. Original scenario 5 delegates to test02DrawingSpaceVolumes without changing its probes or order.
 * @evidence contracts/testing.md#independent-expectations Authored hall planes give 0..10 by 0..3 by 0..6, the footing lowers content to -0.7 and the beam gives deck content x=0..6/y=3..3.4/z=2.85..3.15. Literal ids/counts, tetrahedron coordinates, twin-cell bounds and 11 added leaves supply expectations independently of scheduling calculations; copied interior shell vertices leave 0..1 bounds unchanged.
 * @evidence contracts/testing.md#distinguishing-cases Declared volume versus content, semantic container versus bounded room, eight retained versus seven omitted content ids, shell versus two-cell/oblique/open/empty/faceted spaces and equal room shapes with distinct ids distinguish branches. Reversed input order and repeated digest are selected stability observations, not an independent byte comparison; the mixed stair/ramp fixture does not isolate one-way reachability.
 * @evidence contracts/testing.md#execution-ownership Uses existing local declarations and synchronous public scheduling without processes, rendering, filesystem publication, global replacement or a new driver. The pre-existing 130000 interior-vertex probe remains solely a finite large-input bounding case, without a timing claim. Selected coordinates do not certify arbitrary solid geometry or rendered enclosure; opening/connector checks cover place kinds and gap absence, not their complete locations.
 */
export function test_drawing_space_schedule(): void {
  const environment: IAutoMovieBuiltEnvironment = drawingEnvironment();
  const schedule: IAutoMovieDrawingSchedule = deriveAutoMovieDrawingSchedule({
    environment,
    subject: "space",
  });

  // 1. One row per zone, reconciled with the design.
  TestValidator.equals(
    "a room schedule lists rooms rather than room types",
    [
      schedule.subject,
      schedule.total,
      schedule.rows.length,
      schedule.rows.reduce(
        (sum: number, row: IAutoMovieDrawingScheduleRow): number =>
          sum + row.count,
        0,
      ),
      environment.spaces.length,
    ],
    ["space", 3, 3, 3, 3],
  );
  TestValidator.equals(
    "every declared zone is named once, by the id the design gave it",
    schedule.rows
      .flatMap((row: IAutoMovieDrawingScheduleRow): string[] => row.members)
      .sort(byText),
    ["hall", "roof-deck", "site"],
  );

  // 2. A room is located.
  const hall: {
    place: IAutoMovieDrawingSpacePlace | null;
    mark: string;
    kind: string;
    model: string | null;
    width: number | null;
    height: number | null;
    count: number;
    members: string[];
    omittedMembers: number;
    basis: "profile" | "fill" | "unmeasured";
  } = row(schedule, "hall");
  TestValidator.predicate(
    "a room is scheduled at the size of its own declared volume",
    test12ValuesClose(
      [hall.mark, hall.kind, hall.model, hall.width, hall.height, hall.basis],
      // Widest horizontal extent against clear height: the cell is 10 by 6 on
      // plan and 3 tall.
      ["room-01", "room", null, 10, 3, "profile"],
    ),
  );
  TestValidator.predicate(
    "a room states where it is, what is in it, and what reaches it",
    test12ValuesClose(hall.place, {
      kind: "space",
      building: "unit-a",
      parent: "site",
      declared: {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 10, y: 3, z: 6 },
      },
      // The footing hangs 0.7 below the floor the cell starts at, so the
      // contents leave the cell downwards. The cell says how far the room
      // reaches; this says where its content is.
      content: {
        min: { x: 0, y: -0.7, z: 0 },
        max: { x: 10, y: 3, z: 6 },
      },
      fidelity: "exact",
      contents: [
        "atelier/door-leaf",
        "atelier/floor-slab",
        "atelier/footing",
        "atelier/north-wall",
      ],
      omittedContents: 0,
      adjacent: ["roof-deck"],
      connectors: ["roof-stair", "service-ramp"],
    }),
  );
  const deck: {
    place: IAutoMovieDrawingSpacePlace | null;
    mark: string;
    kind: string;
    model: string | null;
    width: number | null;
    height: number | null;
    count: number;
    members: string[];
    omittedMembers: number;
    basis: "profile" | "fill" | "unmeasured";
  } = row(schedule, "roof-deck");
  TestValidator.predicate(
    "the deck reports its cell and its contents separately",
    test12ValuesClose(
      [deck.place?.declared, deck.place?.content],
      [
        { min: { x: 0, y: 3, z: 0 }, max: { x: 10, y: 3.5, z: 6 } },
        // One beam, nowhere near three of the cell's four plan corners.
        { min: { x: 0, y: 3, z: 2.85 }, max: { x: 6, y: 3.4, z: 3.15 } },
      ],
    ),
  );
  TestValidator.equals(
    "the deck reports its adjacent hall, parent and building",
    [deck.place?.adjacent, deck.place?.parent, deck.place?.building],
    [["hall"], "site", "unit-a"],
  );

  // 3. A zone that states no volume.
  const site: {
    place: IAutoMovieDrawingSpacePlace | null;
    mark: string;
    kind: string;
    model: string | null;
    width: number | null;
    height: number | null;
    count: number;
    members: string[];
    omittedMembers: number;
    basis: "profile" | "fill" | "unmeasured";
  } = row(schedule, "site");
  TestValidator.equals(
    "a purely semantic container is unmeasured rather than zero-sized",
    [
      site.width,
      site.height,
      site.basis,
      site.place?.declared,
      site.place?.parent,
    ],
    [null, null, "unmeasured", null, null],
  );
  TestValidator.predicate(
    "a container with no volume of its own still measures what stands under it",
    test12ValuesClose(
      [site.place?.content, site.place?.contents.length, site.place?.fidelity],
      [
        { min: { x: 0, y: -0.7, z: 0 }, max: { x: 10, y: 3.4, z: 6 } },
        5,
        "exact",
      ],
    ),
  );
  TestValidator.equals(
    "the schedule says which zones it could not bound, and never prints a zero",
    schedule.gaps.map((gap: IAutoMovieDrawingGap): string[] => [
      gap.subject,
      gap.status,
    ]),
    [
      // `space-enclosure` states the other half of what a room row omits: the
      // fit-out gap covers what stands IN a room, this covers what encloses it.
      // Its content is asserted in `test_drawing_space_enclosure_gap`.
      ["space-enclosure", "unsupported"],
      ["space-fit-out", "unsupported"],
      ["space-geometry", "not-run"],
    ],
  );
  TestValidator.predicate(
    "the unbounded zone is counted in the gap rather than described as empty",
    schedule.gaps
      .find(
        (gap: IAutoMovieDrawingGap): boolean =>
          gap.subject === "space-geometry",
      )!
      .reason.startsWith("1 space(s) state no volume"),
  );

  // 4. Bounded membership.
  const crowded: IAutoMovieDrawingSchedule = deriveAutoMovieDrawingSchedule({
    environment: withExtraLeaves(environment, 11),
    subject: "space",
  });
  const crowdedHall: {
    place: IAutoMovieDrawingSpacePlace | null;
    mark: string;
    kind: string;
    model: string | null;
    width: number | null;
    height: number | null;
    count: number;
    members: string[];
    omittedMembers: number;
    basis: "profile" | "fill" | "unmeasured";
  } = row(crowded, "hall")!;
  TestValidator.equals(
    "a crowded zone names the bound's worth and counts the rest",
    [
      crowdedHall.place?.contents.length,
      crowdedHall.place?.omittedContents,
      (crowdedHall.place?.contents.length ?? 0) +
        (crowdedHall.place?.omittedContents ?? 0),
    ],
    [8, 7, 15],
  );

  // 5. Existing alternate-volume cases run before the original ordering cases.
  test02DrawingSpaceVolumes(environment, row, withSpace);

  // 6. Two rooms that are alike are still two rooms.
  const twins: IAutoMovieBuiltEnvironment = twinRooms(environment);
  const twinned: IAutoMovieDrawingSchedule = deriveAutoMovieDrawingSchedule({
    environment: twins,
    subject: "space",
  });
  TestValidator.equals(
    "identical rooms are separate rows, marked in an order the design cannot set",
    twinned.rows
      .filter(
        (candidate: IAutoMovieDrawingScheduleRow): boolean =>
          candidate.kind === "cell",
      )
      .map((candidate: IAutoMovieDrawingScheduleRow): (string | string[])[] => [
        candidate.mark,
        candidate.members,
      ]),
    [
      ["cell-01", ["cell-east"]],
      ["cell-02", ["cell-west"]],
    ],
  );
  TestValidator.equals(
    "the order the design listed its spaces in does not reach the schedule",
    deriveAutoMovieDrawingSchedule({
      environment: { ...twins, spaces: [...twins.spaces].reverse() },
      subject: "space",
    }).digest,
    twinned.digest,
  );
  TestValidator.equals(
    "the same design schedules the same digest twice",
    deriveAutoMovieDrawingSchedule({
      environment: drawingEnvironment(),
      subject: "space",
    }).digest,
    schedule.digest,
  );
  TestValidator.notEquals(
    "adding a cellar changes the schedule digest",
    deriveAutoMovieDrawingSchedule({
      environment: withSpace(environment, {
        id: "cellar",
        kind: "room",
        parent: "site",
        cells: [
          drawingCell(
            "cellar-cell",
            { x: 0, y: -3, z: 0 },
            { x: 2, y: -1, z: 2 },
          ),
        ],
      }),
      subject: "space",
    }).digest,
    schedule.digest,
  );

  // 7. Opening and connector place kinds have no obsolete location gap.
  TestValidator.equals(
    "an opening and a connector now state a place, and owe no gap for it",
    (["opening", "connector"] as const).map(
      (subject: "opening" | "connector"): boolean[] => {
        const other: IAutoMovieDrawingSchedule = deriveAutoMovieDrawingSchedule(
          { environment, subject },
        );
        return [
          other.rows.every(
            (candidate: IAutoMovieDrawingScheduleRow): boolean =>
              candidate.place?.kind === subject,
          ),
          // The gap this replaced. It said the location had to be read from the
          // design; the design is where the derivation now reads it from.
          other.gaps.some(
            (gap: IAutoMovieDrawingGap): boolean =>
              gap.subject === `${subject}-location`,
          ),
        ];
      },
    ),
    [
      [true, false],
      [true, false],
    ],
  );
}

const byText: (left: string, right: string) => number = (
  left: string,
  right: string,
): number => (left < right ? -1 : left > right ? 1 : 0);

/** The one row a zone owns, since a room schedule gives each zone its own. */
const row: (
  schedule: ReturnType<typeof deriveAutoMovieDrawingSchedule>,
  space: string,
) => {
  place: IAutoMovieDrawingSpacePlace | null;
  mark: string;
  kind: string;
  model: string | null;
  width: number | null;
  height: number | null;
  count: number;
  members: string[];
  omittedMembers: number;
  basis: "profile" | "fill" | "unmeasured";
} = (
  schedule: ReturnType<typeof deriveAutoMovieDrawingSchedule>,
  space: string,
): {
  place: IAutoMovieDrawingSpacePlace | null;
  mark: string;
  kind: string;
  model: string | null;
  width: number | null;
  height: number | null;
  count: number;
  members: string[];
  omittedMembers: number;
  basis: "profile" | "fill" | "unmeasured";
} => {
  const found: IAutoMovieDrawingScheduleRow = schedule.rows.find(
    (candidate: IAutoMovieDrawingScheduleRow): boolean =>
      candidate.members.includes(space),
  )!;
  // Narrowed here rather than at every read. `place` is a discriminated union
  // since an opening and a connector gained their own locations, and a room row
  // is the only variant carrying declared volume, contents and fidelity.
  // Main hall.place expectations include kind="space"; this cast itself does
  // not check the discriminant for every alternate-volume probe.
  return {
    ...found,
    place: found.place as IAutoMovieDrawingSpacePlace | null,
  };
};

/** The same design with one more logical space under the building root. */
const withSpace: (
  environment: IAutoMovieBuiltEnvironment,
  space: IAutoMovieBuiltSpace,
) => IAutoMovieBuiltEnvironment = (
  environment: IAutoMovieBuiltEnvironment,
  space: IAutoMovieBuiltSpace,
): IAutoMovieBuiltEnvironment => ({
  ...environment,
  spaces: [...environment.spaces, space],
});

/** The same design with two rooms alike in every scheduled column. */
const twinRooms: (
  environment: IAutoMovieBuiltEnvironment,
) => IAutoMovieBuiltEnvironment = (
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieBuiltEnvironment => ({
  ...environment,
  spaces: [
    ...environment.spaces,
    {
      id: "cell-west",
      kind: "cell",
      parent: "site",
      cells: [
        drawingCell("west-cell", { x: 0, y: 0, z: 0 }, { x: 2, y: 2, z: 2 }),
      ],
    },
    {
      id: "cell-east",
      kind: "cell",
      parent: "site",
      cells: [
        drawingCell("east-cell", { x: 8, y: 0, z: 0 }, { x: 10, y: 2, z: 2 }),
      ],
    },
  ],
});

/** The same design with `count` more staged leaves standing in the hall. */
const withExtraLeaves: (
  environment: IAutoMovieBuiltEnvironment,
  count: number,
) => IAutoMovieBuiltEnvironment = (
  environment: IAutoMovieBuiltEnvironment,
  count: number,
): IAutoMovieBuiltEnvironment => ({
  ...environment,
  elements: [
    ...environment.elements,
    ...Array.from(
      { length: count },
      (
        _: unknown,
        index: number,
      ): {
        id: string;
        kind: string;
        parent: string;
        transform: {
          translation: { x: number; y: number; z: number };
          rotation: { x: number; y: number; z: number; w: number };
          scale: { x: number; y: number; z: number };
        };
        model: string;
        space: string;
      } => ({
        id: `crate-${String(index).padStart(2, "0")}`,
        kind: "prop",
        parent: "shell",
        transform: {
          translation: { x: 1 + index * 0.1, y: 0.5, z: 1 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        model: "leaf",
        space: "hall",
      }),
    ),
  ],
});
