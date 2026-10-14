import {
  autoMovieDrawingRange,
  autoMovieDrawingToSvg,
  deriveAutoMovieDrawing,
  deriveAutoMovieDrawingSchedule,
  measureAutoMovieQuantities,
} from "@automovie/engine";
import {
  type IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieDrawing,
  type IAutoMovieDrawingGap,
  type IAutoMovieDrawingLine,
  type IAutoMovieDrawingOpeningMark,
  type IAutoMovieDrawingRegion,
  type IAutoMovieDrawingSchedule,
  type IAutoMovieDrawingScheduleRow,
  IAutoMovieDrawingView,
  type IAutoMovieQuantityFinding,
  type IAutoMovieQuantityReport,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  drawingEnvironment,
  drawingPlace,
  drawingView,
} from "../internal/drawingFixtures";
import { namedFacts, nclose } from "../internal/predicates";
import { test02DrawingSheetOperation } from "../internal/test02DrawingSheetOperation";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * One design, one revision, and every sheet and every count the building needs.
 *
 * The other drawing cases each prove one derivation against hand arithmetic.
 * This one checks that a floor plan, a
 * reflected ceiling plan, a finish plan, an elevation, a section, a services
 * plan, a door schedule and a take-off are eight readings of one graph rather
 * than independently authored documents. Selected metadata, counts, areas,
 * digests and spans are checked; these observations do not establish equality
 * of every artifact field or prohibit callers from editing returned records.
 *
 * The numbers are the fixture's own. The hall is 10 x 6 on plan, so its
 * cross-section is 60 m2; the door void is 0.9 x 2.1 = 1.89 m2 and the oculus
 * is a circle of radius 0.3, so the design's openings remove 1.89 + 0.09 pi
 * square metres from their host; the side door added below is 1 x 2.1, so it
 * adds exactly 2.1 more.
 *
 * Scenarios:
 *
 * 1. Six views of one environment answer for that environment and for the cut,
 *    projection and discipline each of them declared.
 * 2. The design, every sheet, the schedule and the take-off report one opening
 *    count, and the schedule's rows sum to it.
 * 3. Adding one door to the design adds it to the plan, the schedule and the
 *    take-off at once, at the void's own area.
 * 4. Moving one wall changes every sheet that draws it and no sheet that the cut
 *    already removed it from, and the leaf hung on that wall moves with it on
 *    the elevation, by the wall's own half metre.
 * 5. The finish plan fills the room its boundaries agree on and the ceiling plan
 *    names none, and each artifact declares the derivation it cannot perform
 *    rather than drawing a building that does not need it.
 * 6. Every sheet serializes to a sidecar carrying its own digest and the one
 *    environment they all came from.
 * 7. A leaf slid open by its opening's current operating state is drawn where
 *    the staged scene puts it, by exactly its travel, and a leaf at rest is
 *    drawn where it was.
 * 8. Two elements whose owner and layer differ only in where a `|` falls are
 *    two owners of their strokes, not one stroke drafted once.
 *
 * @evidence contracts/testing.md#behavioral-verification Derives six views, an opening schedule and quantities from the atelier graph; checks declared view metadata, shared opening ids/counts, one added door's schedule and area, changed/unchanged sheet digests, leaf spans, region/gap summaries and SVG root markers. Original operating-state/owner scenarios 7/8 run sequentially through test02DrawingSheetOperation.
 * @evidence contracts/testing.md#independent-expectations The authored hall gives 60 square metres, the front void gives 0.9 times 2.1 and the circular oculus gives pi times 0.09; the new side door adds 2.1. Literal six-view/count tables and elevation spans -1.95..-1.05 with -0.5 wall/-0.3 slide displacement anchor selected outputs independently of product-derived expectations.
 * @evidence contracts/testing.md#distinguishing-cases Baseline versus one added door, one moved parent wall, rest versus slide travel, finish versus ceiling regions and conflicting separator-bearing owner/layer names distinguish shared graph reads, selection and stroke identity. Digest equality/inequality is observed without claiming complete output equality, collision impossibility or independent runtime-scene parity.
 * @evidence contracts/testing.md#execution-ownership Uses existing local drawing declarations, synchronous public derivation/measurement/serialization and scalar arithmetic without a renderer, filesystem publication, clocks, global replacement or alternate runner. SVG checks cover selected marker strings and closure, not an XML parser or visual appearance; operating-state checks observe drawing spans against authored travel rather than independently rendering the scene.
 */
export function test_drawing_sheet_set(): void {
  const environment: IAutoMovieBuiltEnvironment = drawingEnvironment();
  const views: [string, IAutoMovieDrawingView][] = sheetViews();
  const sheets: Record<string, IAutoMovieDrawing> = derive(environment, views);
  const schedule: IAutoMovieDrawingSchedule = deriveAutoMovieDrawingSchedule({
    environment,
    subject: "opening",
  });
  const quantities: IAutoMovieQuantityReport = measureAutoMovieQuantities({
    environment,
  });
  const total: (report: IAutoMovieQuantityReport, subject: string) => number = (
    report: typeof quantities,
    subject: string,
  ): number =>
    report.findings.find(
      (finding: IAutoMovieQuantityFinding): boolean =>
        finding.subject === subject,
    )!.total;

  // 1. Six questions asked of one design.
  TestValidator.predicate(
    "every sheet answers for the one environment and the convention it declared",
    test12ValuesClose(
      views.map(
        ([name, view]: [string, IAutoMovieDrawingView]): (
          | string
          | number
        )[] => [
          name,
          sheets[name]!.environment,
          sheets[name]!.view,
          sheets[name]!.projection,
          sheets[name]!.discipline,
          sheets[name]!.scale,
          view.scale,
        ],
      ),
      [
        [
          "floor-plan",
          "atelier",
          "floor-plan",
          "plan",
          "architectural",
          50,
          50,
        ],
        [
          "ceiling-plan",
          "atelier",
          "ceiling-plan",
          "reflected-ceiling-plan",
          "ceiling",
          50,
          50,
        ],
        ["finish-plan", "atelier", "finish-plan", "plan", "finish", 50, 50],
        [
          "north-elevation",
          "atelier",
          "north-elevation",
          "elevation",
          "architectural",
          50,
          50,
        ],
        [
          "section-a",
          "atelier",
          "section-a",
          "section",
          "architectural",
          50,
          50,
        ],
        [
          "services-plan",
          "atelier",
          "services-plan",
          "plan",
          "mechanical",
          50,
          50,
        ],
      ],
    ),
  );
  // 2. One opening count, eight artifacts.
  TestValidator.equals(
    "the design, every sheet, the schedule and the take-off count one set of openings",
    [
      environment.openings.length,
      schedule.total,
      schedule.rows.reduce(
        (sum: number, row: IAutoMovieDrawingScheduleRow): number =>
          sum + row.count,
        0,
      ),
      total(quantities, "opening-count"),
      ...views.map(
        ([name]: [string, IAutoMovieDrawingView]): number =>
          sheets[name]!.openings.length,
      ),
    ],
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  );
  TestValidator.equals(
    "every sheet marks the openings the schedule lists, by the schedule's own ids",
    views.map(([name]: [string, IAutoMovieDrawingView]): string[] =>
      sheets[name]!.openings.map(
        (mark: IAutoMovieDrawingOpeningMark): string => mark.opening,
      ),
    ),
    views.map((): string[] => ["front-door", "oculus", "vent"]),
  );

  // 3. One added door reaches every artifact at once.
  const extended: IAutoMovieBuiltEnvironment = withSideDoor(environment);
  const extendedSheets: Record<string, IAutoMovieDrawing> = derive(
    extended,
    views,
  );
  const extendedSchedule: IAutoMovieDrawingSchedule =
    deriveAutoMovieDrawingSchedule({
      environment: extended,
      subject: "opening",
    });
  const extendedQuantities: IAutoMovieQuantityReport =
    measureAutoMovieQuantities({
      environment: extended,
    });
  TestValidator.predicate(
    "authoring one door adds one door to the plan, the schedule and the take-off",
    test12ValuesClose(
      [
        extendedSheets["floor-plan"]!.openings.map(
          (mark: IAutoMovieDrawingOpeningMark): string => mark.opening,
        ),
        extendedSchedule.total,
        extendedSchedule.rows
          .filter(
            (row: IAutoMovieDrawingScheduleRow): boolean => row.kind === "door",
          )
          .map(
            (row: IAutoMovieDrawingScheduleRow): (string | number | null)[] => [
              row.mark,
              row.width,
              row.height,
              row.count,
            ],
          ),
        total(extendedQuantities, "opening-count"),
      ],
      [
        ["front-door", "oculus", "side-door", "vent"],
        4,
        // Two door types now, ordered by the model backing them: the leaf-backed
        // front door first, then the model-less void beside it.
        [
          ["door-01", 0.9, 2.1, 1],
          ["door-02", 1, 2.1, 1],
        ],
        4,
      ],
    ),
  );
  TestValidator.equals(
    "the take-off grows by the new void's own area and by nothing else",
    namedFacts([
      [
        "before",
        (): boolean =>
          nclose(total(quantities, "opening-area"), 1.89 + Math.PI * 0.09),
      ],
      [
        "after",
        (): boolean =>
          nclose(
            total(extendedQuantities, "opening-area"),
            1.89 + Math.PI * 0.09 + 2.1,
          ),
      ],
    ]),
    { before: true, after: true },
  );

  // 4. One moved wall, and only the sheets that draw it.
  const movedSheets: Record<string, IAutoMovieDrawing> = derive(
    movedWall(environment),
    views,
  );
  TestValidator.equals(
    "moving one wall moves every sheet that draws it and no sheet that does not",
    views.map(
      ([name]: [string, IAutoMovieDrawingView]): (string | boolean)[] => [
        name,
        movedSheets[name]!.digest !== sheets[name]!.digest,
      ],
    ),
    [
      ["floor-plan", true],
      // The ceiling plan looks up from 3.05 m and the section keeps what lies
      // beyond z = 3: both cuts removed the wall before it could be drafted, so
      // a wall that moves within the plan changes neither sheet. The voids they
      // still mark sit on the boundary's own face, which the element's
      // transform does not move.
      ["ceiling-plan", false],
      ["finish-plan", true],
      ["north-elevation", true],
      ["section-a", false],
      // A services plan draws footings, and the wall is not one.
      ["services-plan", false],
    ],
  );

  const facadeSpan: (
    drawing: IAutoMovieDrawing,
    owner: string,
  ) => { min: number; max: number } = (
    drawing: IAutoMovieDrawing,
    owner: string,
  ): { min: number; max: number } =>
    autoMovieDrawingRange(
      drawing.lines
        .filter((line: IAutoMovieDrawingLine): boolean => line.owner === owner)
        .flatMap((line: IAutoMovieDrawingLine): number[] => [
          line.from.x,
          line.to.x,
        ]),
    );
  TestValidator.predicate(
    "the leaf hung on the facade moves on the elevation exactly as its wall does",
    ((): boolean => {
      // The leaf is the wall's child, so the wall's half metre is the leaf's;
      // the elevation's page right axis runs against world x, so both ends of
      // its span move by -0.5. The void the leaf fills does not move with it,
      // because a boundary's face is its own record and not the element's.
      const before: { min: number; max: number } = facadeSpan(
        sheets["north-elevation"]!,
        "door-leaf",
      );
      const after: { min: number; max: number } = facadeSpan(
        movedSheets["north-elevation"]!,
        "door-leaf",
      );
      return (
        nclose(before.min, -1.95) &&
        nclose(before.max, -1.05) &&
        nclose(after.min - before.min, -0.5) &&
        nclose(after.max - before.max, -0.5)
      );
    })(),
  );

  // 5. What each sheet fills in, and what it refuses to.
  TestValidator.predicate(
    "the finish plan fills the room its boundaries agree on and the ceiling names none",
    test12ValuesClose(
      [
        sheets["finish-plan"]!.regions.map(
          (region: IAutoMovieDrawingRegion): (string | number | null)[] => [
            region.space,
            region.finish,
            region.area,
          ],
        ),
        sheets["ceiling-plan"]!.regions.map(
          (region: IAutoMovieDrawingRegion): (string | number | null)[] => [
            region.space,
            region.finish,
            region.area,
          ],
        ),
        sheets["north-elevation"]!.regions.length,
      ],
      [[["hall", "plaster", 60]], [["roof-deck", null, 60]], 0],
    ),
  );
  TestValidator.equals(
    "each artifact names the derivation it cannot perform on this design",
    namedFacts([
      [
        "a finish plan says it cannot hatch a build-up it was never handed",
        (): boolean =>
          sheets["finish-plan"]!.gaps.find(
            (gap: IAutoMovieDrawingGap): boolean =>
              gap.subject === "material-build-up",
          )?.status === "unsupported",
      ],
      [
        "a services plan says it draws no network, only the elements it filtered",
        (): boolean =>
          sheets["services-plan"]!.gaps.find(
            (gap: IAutoMovieDrawingGap): boolean =>
              gap.subject === "service-network",
          )?.status === "unsupported",
      ],
      [
        "the schedule says it knows a door's size and not its performance",
        (): boolean =>
          schedule.gaps.find(
            (gap: IAutoMovieDrawingGap): boolean =>
              gap.subject === "opening-performance",
          )?.status === "unsupported",
      ],
      [
        "the take-off says no material and no cut waste can be taken off yet",
        (): boolean =>
          ["material-quantity", "pattern-cut-waste"].every(
            (subject: string): boolean =>
              quantities.gaps.find(
                (gap: IAutoMovieDrawingGap): boolean => gap.subject === subject,
              )?.status === "unsupported",
          ),
      ],
      [
        "every sheet declares that it classifies depth rather than occlusion",
        (): boolean =>
          views.every(
            ([name]: [string, IAutoMovieDrawingView]): boolean =>
              sheets[name]!.gaps.find(
                (gap: IAutoMovieDrawingGap): boolean =>
                  gap.subject === "hidden-line-removal",
              )?.status === "unsupported",
          ),
      ],
    ]),
    {
      "a finish plan says it cannot hatch a build-up it was never handed": true,
      "a services plan says it draws no network, only the elements it filtered": true,
      "the schedule says it knows a door's size and not its performance": true,
      "the take-off says no material and no cut waste can be taken off yet": true,
      "every sheet declares that it classifies depth rather than occlusion": true,
    },
  );

  // 6. The sidecar of each sheet.
  TestValidator.predicate(
    "every sheet serializes as a sidecar of its own digest and one environment",
    views.every(([name, view]: [string, IAutoMovieDrawingView]): boolean => {
      const svg: string = autoMovieDrawingToSvg({
        drawing: sheets[name]!,
        view,
      });
      return (
        svg.includes('data-automovie-environment="atelier"') &&
        svg.includes(`data-automovie-view="${name}"`) &&
        svg.includes(`data-automovie-digest="${sheets[name]!.digest}"`) &&
        svg.endsWith("\n</svg>")
      );
    }),
  );

  // 7-8. Operating-state and owner-identity cases retain their original order.
  test02DrawingSheetOperation(environment, views, facadeSpan);
}

/** The six views one revision is asked for, in the order the case reads them. */
const sheetViews: () => Array<[string, IAutoMovieDrawingView]> = (): Array<
  [string, IAutoMovieDrawingView]
> => [
  ["floor-plan", drawingView({ id: "floor-plan" })],
  [
    "ceiling-plan",
    drawingView({
      id: "ceiling-plan",
      projection: "reflected-ceiling-plan",
      discipline: "ceiling",
      origin: { x: 0, y: 3.05, z: 0 },
      direction: { x: 0, y: 1, z: 0 },
      up: { x: 0, y: 0, z: -1 },
    }),
  ],
  ["finish-plan", drawingView({ id: "finish-plan", discipline: "finish" })],
  [
    "north-elevation",
    drawingView({
      id: "north-elevation",
      projection: "elevation",
      origin: { x: 0, y: 0, z: 0 },
      direction: { x: 0, y: 0, z: 1 },
      up: { x: 0, y: 1, z: 0 },
    }),
  ],
  [
    "section-a",
    drawingView({
      id: "section-a",
      projection: "section",
      origin: { x: 0, y: 0, z: 3 },
      direction: { x: 0, y: 0, z: 1 },
      up: { x: 0, y: 1, z: 0 },
    }),
  ],
  [
    "services-plan",
    drawingView({
      id: "services-plan",
      discipline: "mechanical",
      elementKinds: ["footing"],
    }),
  ],
];

/** Every view of one revision, keyed by the name the case calls it. */
const derive: (
  environment: IAutoMovieBuiltEnvironment,
  views: ReadonlyArray<[string, IAutoMovieDrawingView]>,
) => Record<string, IAutoMovieDrawing> = (
  environment: IAutoMovieBuiltEnvironment,
  views: ReadonlyArray<[string, IAutoMovieDrawingView]>,
): Record<string, IAutoMovieDrawing> => {
  const output: Record<string, IAutoMovieDrawing> = {};
  for (const [name, view] of views)
    output[name] = deriveAutoMovieDrawing({ environment, view });
  return output;
};

/**
 * The same design with one more door, as a void of its own on the same face.
 *
 * Placed at x 4.5..5.5 so it clears the front door and the oculus: two voids
 * that touch are one void authored twice, and the design refuses that.
 */
const withSideDoor: (
  environment: IAutoMovieBuiltEnvironment,
) => IAutoMovieBuiltEnvironment = (
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieBuiltEnvironment => ({
  ...environment,
  openings: [
    ...environment.openings,
    {
      id: "side-door",
      kind: "door",
      boundary: "north",
      fill: null,
      profile: {
        outline: [
          { x: 4.5, y: 0 },
          { x: 5.5, y: 0 },
          { x: 5.5, y: 2.1 },
          { x: 4.5, y: 2.1 },
        ],
      },
    },
  ],
});

/** The same design with the wall moved half a metre along the plan. */
const movedWall: (
  environment: IAutoMovieBuiltEnvironment,
) => IAutoMovieBuiltEnvironment = (
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieBuiltEnvironment => ({
  ...environment,
  elements: environment.elements.map(
    (element: IAutoMovieBuiltElement): IAutoMovieBuiltElement =>
      element.id === "north-wall"
        ? { ...element, transform: drawingPlace(3.5, 1.5, 0.1) }
        : element,
  ),
});
