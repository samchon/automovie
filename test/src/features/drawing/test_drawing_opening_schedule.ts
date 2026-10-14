import {
  deriveAutoMovieDrawing,
  deriveAutoMovieDrawingSchedule,
} from "@automovie/engine";
import {
  IAutoMovieBuiltEnvironment,
  type IAutoMovieBuiltOpening,
  type IAutoMovieDrawingGap,
  type IAutoMovieDrawingOpeningMark,
  type IAutoMovieDrawingSchedule,
  type IAutoMovieDrawingScheduleRow,
  type IAutoMovieModel,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { drawingEnvironment, drawingView } from "../internal/drawingFixtures";
import { throwsError } from "../internal/predicates";
import { test02DrawingOpeningGeometry } from "../internal/test02DrawingOpeningGeometry";
import { test02DrawingOpeningTypes } from "../internal/test02DrawingOpeningTypes";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * A door schedule is the plan counted, so the two cannot disagree about how
 * many doors the building has.
 *
 * Every size below is hand arithmetic over the fixture's own voids: the front
 * door's outline is 0.9 x 2.1 and its area is 1.89 m2; the oculus is two
 * half-turn arcs of chord 0.6, so it is a circle of radius 0.3 whose extent is
 * 0.6 either way and whose area is 0.09 pi. The oculus is also the case that
 * distinguishes a measurement from a drawing: its drafted outline is chords,
 * and its separately measured area uses the circle formula on the drawing grid.
 *
 * Scenarios:
 *
 * 1. The schedule's total is the design's own opening count, and the row counts
 *    sum to it; the same openings appear on the plan by the same ids.
 * 2. A void authored on a boundary face is scheduled as `profile`; a filling
 *    element standing in for one is `fill` and is labelled as the leaf it is;
 *    neither present is `unmeasured` with `null` sizes and a declared gap.
 * 3. Type marks are assigned from the canonical order, per kind, and are stable
 *    across runs of the same design; a type row whose members stand on
 *    different boundaries is placed by its first member by id, whatever order
 *    the design listed them in.
 * 4. A type with more occurrences than the bound names the bound's worth and
 *    counts the rest.
 * 5. Connectors are scheduled by the section that governs them: the stated
 *    constant pair, or the narrowest and lowest sampled section.
 * 6. An opening's exact area and its drafted chord outline are different
 *    computations, and the drawing says the arcs are chorded.
 * 7. Clockwise and counter-clockwise square faces yield twelve triangles;
 *    selected face points, polygon triangle counts and the concave L's area
 *    are checked without proving manifold closure or full triangle placement.
 * 8. An invalid design is refused before anything is scheduled.
 *
 * @evidence contracts/testing.md#behavioral-verification Schedules the atelier openings and compares full literal type rows, counts, membership bounds, canonical marks and representative locations; observes profile/fill/unmeasured fallbacks, connector rows and gaps, public opening geometry and face triangulation. Original scenarios 5/6/7 run sequentially through test02DrawingOpeningGeometry before the units refusal.
 * @evidence contracts/testing.md#independent-expectations Authored front-door dimensions give 0.9 by 2.1 and 1.89 area; the oculus's two half turns give diameter 0.6 and pi times 0.09. Literal mark/order tables, 11 ports with eight retained/three omitted, sampled connector minima, translated face points and L area five anchor selected results without product-generated expected values.
 * @evidence contracts/testing.md#distinguishing-cases Profile versus fill, external/triangle-empty/absent geometry, measured versus unmeasured ordering, reversed declaration order and type members on different boundaries distinguish schedule branches. Constant versus sampled connector sections, straight/shallow/half-turn/zero-length/negative-sweep behavior and convex/concave/short polygons distinguish geometry branches; triangle counts and summed areas do not certify coverage or winding.
 * @evidence contracts/testing.md#execution-ownership Uses existing local declarations and synchronous schedule/drawing/geometry APIs without a renderer, filesystem publication, clocks, global replacement or another host. Drawing and schedule share sizing logic, so their id agreement is supplemented by literal rows, not treated as independent arithmetic; repeated digests do not independently compare serialized bytes. Connector nominal sizes do not prove traversal performance.
 */
export function test_drawing_opening_schedule(): void {
  const environment: IAutoMovieBuiltEnvironment = drawingEnvironment();
  const schedule: IAutoMovieDrawingSchedule = deriveAutoMovieDrawingSchedule({
    environment,
    subject: "opening",
  });

  // 1. The schedule and the model count the same things.
  TestValidator.equals(
    "the schedule totals the design's own openings and its rows sum to that",
    [
      schedule.version,
      schedule.protocol,
      schedule.environment,
      schedule.subject,
      schedule.total,
      schedule.rows.reduce(
        (sum: number, row: IAutoMovieDrawingScheduleRow): number =>
          sum + row.count,
        0,
      ),
      environment.openings.length,
    ],
    [1, "automovie.drawing-schedule.v1", "atelier", "opening", 3, 3, 3],
  );
  TestValidator.equals(
    "the plan marks exactly the openings the schedule lists",
    deriveAutoMovieDrawing({ environment, view: drawingView() })
      .openings.map(
        (mark: IAutoMovieDrawingOpeningMark): string => mark.opening,
      )
      .sort(byText),
    schedule.rows
      .flatMap((row: IAutoMovieDrawingScheduleRow): string[] => row.members)
      .sort(byText),
  );

  // 2-3. Basis, sizes and marks.
  TestValidator.predicate(
    "each type is scheduled at the size the design proves, and says which",
    test12ValuesClose(schedule.rows, [
      {
        mark: "door-01",
        kind: "door",
        model: "leaf",
        width: 0.9,
        height: 2.1,
        count: 1,
        members: ["front-door"],
        omittedMembers: 0,
        basis: "profile",
        place: {
          kind: "opening",
          building: "unit-a",
          boundary: "north",
          separates: ["hall"],
        },
      },
      {
        mark: "vent-01",
        kind: "vent",
        model: null,
        width: null,
        height: null,
        count: 1,
        members: ["vent"],
        omittedMembers: 0,
        basis: "unmeasured",
        place: {
          kind: "opening",
          building: "unit-a",
          boundary: "north",
          separates: ["hall"],
        },
      },
      {
        mark: "window-01",
        kind: "window",
        model: null,
        width: 0.6,
        height: 0.6,
        count: 1,
        members: ["oculus"],
        omittedMembers: 0,
        basis: "profile",
        place: {
          kind: "opening",
          building: "unit-a",
          boundary: "north",
          separates: ["hall"],
        },
      },
    ]),
  );
  TestValidator.predicate(
    "an opening with no void is scheduled from its leaf, and labelled as the leaf",
    test12ValuesClose(
      deriveAutoMovieDrawingSchedule({
        environment: withoutDoorProfile(environment),
        subject: "opening",
      }).rows.find(
        (row: IAutoMovieDrawingScheduleRow): boolean => row.kind === "door",
      ),
      {
        mark: "door-01",
        kind: "door",
        model: "leaf",
        // The leaf is 0.9 x 2.1 x 0.05, so its widest horizontal extent is its
        // own 0.9 and its height is its own 2.1 — the leaf, not the hole.
        width: 0.9,
        height: 2.1,
        count: 1,
        members: ["front-door"],
        omittedMembers: 0,
        basis: "fill",
        place: {
          kind: "opening",
          building: "unit-a",
          boundary: "north",
          separates: ["hall"],
        },
      },
    ),
  );
  TestValidator.equals(
    "the schedule declares what it could not measure and what it never models",
    schedule.gaps.map((gap: IAutoMovieDrawingGap): string[] => [
      gap.subject,
      gap.status,
    ]),
    [
      ["opening-geometry", "not-run"],
      // `opening-location` used to sit here, saying the place had to be read
      // from the design. The row reads it from the design now, so the gap is
      // gone rather than relabelled.
      ["opening-performance", "unsupported"],
    ],
  );
  TestValidator.predicate(
    "a leaf whose model the design does not carry leaves its type unmeasured",
    test12ValuesClose(
      deriveAutoMovieDrawingSchedule({
        environment: withoutDoorProfile(externalLeaf(environment)),
        subject: "opening",
      }).rows.find(
        (row: IAutoMovieDrawingScheduleRow): boolean => row.kind === "door",
      ),
      {
        mark: "door-01",
        kind: "door",
        model: "leaf",
        width: null,
        height: null,
        count: 1,
        members: ["front-door"],
        omittedMembers: 0,
        basis: "unmeasured",
        place: {
          kind: "opening",
          building: "unit-a",
          boundary: "north",
          separates: ["hall"],
        },
      },
    ),
  );
  TestValidator.equals(
    "a leaf that draws nothing leaves its type unmeasured rather than zero-sized",
    deriveAutoMovieDrawingSchedule({
      environment: withoutDoorProfile(emptyLeaf(environment)),
      subject: "opening",
    }).rows.find(
      (row: IAutoMovieDrawingScheduleRow): boolean => row.kind === "door",
    )?.basis,
    "unmeasured",
  );

  // 4. The bound.
  const many: IAutoMovieBuiltEnvironment = manyPorts(environment, 11);
  const bounded: IAutoMovieDrawingScheduleRow = deriveAutoMovieDrawingSchedule({
    environment: many,
    subject: "opening",
  }).rows.find(
    (row: IAutoMovieDrawingScheduleRow): boolean => row.kind === "port",
  )!;
  TestValidator.equals(
    "a type with more occurrences than the bound names some and counts the rest",
    [
      bounded.count,
      bounded.members.length,
      bounded.omittedMembers,
      bounded.members[0],
    ],
    [11, 8, 3, "port-00"],
  );
  const varied: IAutoMovieDrawingSchedule = deriveAutoMovieDrawingSchedule({
    environment: test02DrawingOpeningTypes(environment),
    subject: "opening",
  });
  TestValidator.predicate(
    "types of one kind are marked in the canonical order the schedule declares",
    test12ValuesClose(
      varied.rows
        .filter(
          (row: IAutoMovieDrawingScheduleRow): boolean => row.kind === "door",
        )
        .map(
          (row: IAutoMovieDrawingScheduleRow): (string | number | null)[] => [
            row.mark,
            row.model,
            row.width,
            row.height,
            row.basis,
          ],
        ),
      // Ordered by model, then width, then height, then basis: the leaf-backed
      // pair first because "leaf" precedes an absent model, the measured pair
      // split by where each size came from, then the model-less voids by size.
      [
        ["door-01", "leaf", 0.9, 2.1, "fill"],
        ["door-02", "leaf", 0.9, 2.1, "profile"],
        ["door-03", null, 0.8, 2.1, "profile"],
        ["door-04", null, 1, 2.1, "profile"],
        ["door-05", null, 1, 2.4, "profile"],
      ],
    ),
  );
  TestValidator.predicate(
    "an unmeasured type is ordered before a measured one of the same kind",
    test12ValuesClose(
      varied.rows
        .filter(
          (row: IAutoMovieDrawingScheduleRow): boolean => row.kind === "vent",
        )
        .map(
          (row: IAutoMovieDrawingScheduleRow): (string | number | null)[] => [
            row.mark,
            row.width,
            row.basis,
          ],
        ),
      [
        ["vent-01", null, "unmeasured"],
        ["vent-02", 0.5, "profile"],
      ],
    ),
  );
  TestValidator.equals(
    "the total still counts every opening the design declares",
    [
      varied.total,
      varied.rows.reduce(
        (sum: number, row: IAutoMovieDrawingScheduleRow): number =>
          sum + row.count,
        0,
      ),
    ],
    [8, 8],
  );
  const reversed: IAutoMovieBuiltEnvironment =
    test02DrawingOpeningTypes(environment);
  TestValidator.equals(
    "the order the design authored its openings in does not reach the schedule",
    deriveAutoMovieDrawingSchedule({
      environment: { ...reversed, openings: [...reversed.openings].reverse() },
      subject: "opening",
    }).digest,
    varied.digest,
  );
  // Two unmeasured vents are one type row whose members stand on different
  // boundaries, so the row's place must come from its first member by id and
  // not from whichever member the design happened to list first.
  const spread: IAutoMovieBuiltEnvironment = {
    ...environment,
    openings: [
      ...environment.openings,
      { id: "vent-b", kind: "vent", boundary: "parapet", fill: null },
    ],
  };
  const spreadVents: (
    openings: IAutoMovieBuiltEnvironment["openings"],
  ) => IAutoMovieDrawingSchedule = (
    openings: IAutoMovieBuiltEnvironment["openings"],
  ): IAutoMovieDrawingSchedule =>
    deriveAutoMovieDrawingSchedule({
      environment: { ...spread, openings },
      subject: "opening",
    });
  TestValidator.equals(
    "a type row stands where its first member by id stands, in any authored order",
    [spread.openings, [...spread.openings].reverse()].map(
      (
        openings: IAutoMovieBuiltOpening[],
      ): (string | boolean | string[] | null)[] => {
        const scheduled: IAutoMovieDrawingSchedule = spreadVents(openings);
        const vents: IAutoMovieDrawingScheduleRow = scheduled.rows.find(
          (row: IAutoMovieDrawingScheduleRow): boolean => row.kind === "vent",
        )!;
        return [
          vents.members,
          vents.place?.kind === "opening" ? vents.place.boundary : null,
          scheduled.digest === spreadVents(spread.openings).digest,
        ];
      },
    ),
    [
      [["vent", "vent-b"], "north", true],
      [["vent", "vent-b"], "north", true],
    ],
  );
  TestValidator.equals(
    "the same design schedules the same digest twice",
    deriveAutoMovieDrawingSchedule({
      environment: drawingEnvironment(),
      subject: "opening",
    }).digest,
    schedule.digest,
  );

  // 5-7. Existing connector and geometry cases retain their original order.
  test02DrawingOpeningGeometry(environment);

  // 8. Refusal.
  TestValidator.predicate(
    "an invalid design is refused before anything is scheduled",
    throwsError(
      (): IAutoMovieDrawingSchedule =>
        deriveAutoMovieDrawingSchedule({
          environment: { ...environment, units: "foot" as unknown as "meter" },
          subject: "opening",
        }),
      ["is invalid at", 'building units must be "meter"'],
    ),
  );
}

const byText: (left: string, right: string) => number = (
  left: string,
  right: string,
): number => (left < right ? -1 : left > right ? 1 : 0);

/** The same design with the front door's own void removed. */
const withoutDoorProfile: (
  environment: IAutoMovieBuiltEnvironment,
) => IAutoMovieBuiltEnvironment = (
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieBuiltEnvironment => ({
  ...environment,
  openings: environment.openings.map(
    (opening: IAutoMovieBuiltOpening): IAutoMovieBuiltOpening =>
      opening.id === "front-door"
        ? {
            id: opening.id,
            kind: opening.kind,
            boundary: opening.boundary,
            fill: opening.fill,
          }
        : opening,
  ),
});

/** The same design with the leaf's geometry owned by the builder. */
const externalLeaf: (
  environment: IAutoMovieBuiltEnvironment,
) => IAutoMovieBuiltEnvironment = (
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieBuiltEnvironment => ({
  ...environment,
  models: environment.models.filter(
    (model: IAutoMovieModel): boolean => model.id !== "leaf",
  ),
  modelReferences: ["leaf"],
});

/** The same design with the leaf carrying vertices and no triangle. */
const emptyLeaf: (
  environment: IAutoMovieBuiltEnvironment,
) => IAutoMovieBuiltEnvironment = (
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieBuiltEnvironment => ({
  ...environment,
  models: environment.models.map(
    (model: IAutoMovieModel): IAutoMovieModel =>
      model.id === "leaf"
        ? {
            ...model,
            parts: [
              {
                ...model.parts[0]!,
                geometry: {
                  type: "mesh" as const,
                  mesh: {
                    positions: [0, 0, 0, 1, 0, 0, 0, 0, 1],
                    normals: null,
                    uvs: null,
                    indices: [],
                    skin: null,
                  },
                },
              },
            ],
          }
        : model,
  ),
});

/** The same design plus `count` identical openings of one new kind. */
const manyPorts: (
  environment: IAutoMovieBuiltEnvironment,
  count: number,
) => IAutoMovieBuiltEnvironment = (
  environment: IAutoMovieBuiltEnvironment,
  count: number,
): IAutoMovieBuiltEnvironment => ({
  ...environment,
  openings: [
    ...environment.openings,
    ...Array.from(
      { length: count },
      (
        _: unknown,
        index: number,
      ): { id: string; kind: string; boundary: string; fill: null } => ({
        id: `port-${String(index).padStart(2, "0")}`,
        kind: "port",
        boundary: "north",
        fill: null,
      }),
    ),
  ],
});
