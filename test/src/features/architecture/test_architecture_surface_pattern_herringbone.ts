import { type AutoMovieSurfacePatternGenerator, type IAutoMoviePatternCandidate, type IAutoMoviePatternFinding, type IAutoMoviePatternInstancing, type IAutoMoviePatternPlacement, type IAutoMoviePatternPoint, type IAutoMovieSurfacePattern, type IAutoMovieSurfacePatternResult, Quaternion, autoMoviePatternInstanceTransforms, generateAutoMovieSurfacePattern, compareCodeUnits } from "@automovie/engine";
import type { IAutoMovieExplicitInstanceTransform } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";


import { pattern, rectangle, zone } from "../internal/patternFixtures";
import { namedFacts, nclose, vclose } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/** Board width in metres; a board is twice as long as it is wide. */
const WIDTH: number = 0.15;

/** The floor face: local U runs north, local V runs east, the normal is up. */
const FLOOR: {
  origin: { x: number; y: number; z: number };
  u: { x: number; y: number; z: number };
  v: { x: number; y: number; z: number };
} = {
  origin: { x: 0, y: 0, z: 0 },
  u: { x: 0, y: 0, z: 1 },
  v: { x: 1, y: 0, z: 0 },
};

/**
 * A herringbone: two boards per staircase step, four steps to the cell.
 *
 * Step `n` lays one board flat with its lower-left corner at `(n, n)` board
 * widths and one board on end at `(n, n + 1)`, and four steps carry the
 * staircase exactly one cell along both axes, so the cell repeats on a square
 * lattice four board widths wide. Nothing here is engine knowledge: this is one
 * production's own bond written as the generator the engine calls.
 */
const herringbone: AutoMovieSurfacePatternGenerator = ({
  column,
  row,
  origin,
}: {
  column: number;
  row: number;
  origin: IAutoMoviePatternPoint;
  period: { u: number; v: number };
}): IAutoMoviePatternCandidate[] => {
  const boards: IAutoMoviePatternCandidate[] = [];
  for (let step: number = 0; step < 4; ++step) {
    boards.push({
      id: `h${step}@${column},${row}`,
      center: {
        u: origin.u + (step + 1) * WIDTH,
        v: origin.v + (step + 0.5) * WIDTH,
      },
      size: { u: 2 * WIDTH, v: WIDTH },
      rotationDeg: 0,
      grainDeg: 0,
      mirror: false,
    });
    boards.push({
      id: `v${step}@${column},${row}`,
      center: {
        u: origin.u + (step + 0.5) * WIDTH,
        v: origin.v + (step + 2) * WIDTH,
      },
      size: { u: 2 * WIDTH, v: WIDTH },
      rotationDeg: 90,
      grainDeg: 90,
      mirror: false,
    });
  }
  return boards;
};

const floor: (
  overrides?: Partial<IAutoMovieSurfacePattern>,
) => IAutoMovieSurfacePattern = (
  overrides: Partial<IAutoMovieSurfacePattern> = {},
): IAutoMovieSurfacePattern =>
  pattern({
    id: "herringbone",
    zones: [
      zone({
        id: "wood",
        region: rectangle(0, 0, 4 * WIDTH, 4 * WIDTH),
        origin: { u: 0, v: 0 },
        period: { u: 4 * WIDTH, v: 4 * WIDTH },
        reach: { u: 5.5 * WIDTH, v: 6.5 * WIDTH },
        material: "oak",
        generate: herringbone,
      }),
    ],
    minimumPiece: 0.5,
    ...overrides,
  });

/**
 * Herringbone boards, laid, measured, and instanced.
 *
 * The authored boards are 0.3 x 0.15 m pieces, with horizontal and quarter-turned
 * candidates. The test observes their interlocking layout, room-boundary cuts,
 * grain contacts, and numerical instance transforms.
 *
 * The room is one cell, 0.6 x 0.6 m, so its 0.36 m² is covered by the area of
 * exactly eight boards, and the ten pieces that reach into it are six whole and
 * four halved at the edge.
 *
 * Scenarios:
 *
 * 1. The ten pieces reaching the room are laid in lattice order under their own
 *    ids, six of them whole and four cut in half by the boundary.
 * 2. The lay is an exact tiling: the covered area is the room's own area, the
 *    joint area is zero, and 0.45 m² of board is consumed for a fifth of
 *    waste.
 * 3. Nothing overlaps and no joint deviates, at a zero nominal joint measured
 *    between the pieces as laid.
 * 4. The grain turns a right angle at every junction between a flat board and one
 *    on end, and at no junction between two of a kind. A tolerance of ninety
 *    degrees reports none of them, and so does no tolerance at all.
 * 5. A halved piece is exactly at the minimum, so raising the minimum turns all
 *    four into slivers and lowering it back reports none: the boundary of the
 *    minimum-piece rule.
 * 6. The six whole boards become six instance slots on the floor frame, each
 *    carrying its own board's long axis, and the four cut ones are named
 *    instead.
 * 7. The same declaration laid twice preserves record structure and exact
 *    numeric components.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls generateAutoMovieSurfacePattern and autoMoviePatternInstanceTransforms for authored herringbone boards, checking exact occurrence/cut identities, quantities, neighbour findings, minimum-piece boundaries, whole-piece slots, and replay.
 * @evidence contracts/testing.md#independent-expectations The 0.6-square room has area 0.36; six whole and four half boards consume 0.45 and waste 0.09 square metres. Twelve explicitly enumerated cross-grain contacts, fixed half-coverage thresholds, slot ids, positions, long axes, and dimensions independently anchor the layout and instancing results.
 * @evidence contracts/testing.md#distinguishing-cases Zero overlap/joint findings contrast with 90-degree grain findings, which disappear at 90-degree or null tolerance; half pieces switch to slivers above minimum 0.5, and whole versus cut pieces take distinct instancing paths. Repeated declarations retain their numerical records through existing test12ValuesClose.
 * @evidence contracts/testing.md#execution-ownership Uses existing local pattern/generator fixtures and synchronous numerical generation/instancing without rendering, resources, clocks, global replacement, or another test host. Quaternion-vector observations check selected axes; these assertions do not establish a rendered floor or universal herringbone coverage.
 */
export function test_architecture_surface_pattern_herringbone(): void {
  const laid: IAutoMovieSurfacePatternResult = generateAutoMovieSurfacePattern({
    pattern: floor(),
  });

  TestValidator.equals(
    "every piece reaching the room is laid once, in lattice order",
    laid.placements.map((one: IAutoMoviePatternPlacement): string => one.id),
    [
      "wood/v2@0,-1",
      "wood/v3@0,-1",
      "wood/h3@-1,0",
      "wood/h0@0,0",
      "wood/v0@0,0",
      "wood/h1@0,0",
      "wood/v1@0,0",
      "wood/h2@0,0",
      "wood/v2@0,0",
      "wood/h3@0,0",
    ],
  );
  TestValidator.equals(
    "the room's own edge is what cuts, and it cuts exactly four boards",
    laid.placements
      .filter((one: IAutoMoviePatternPlacement): boolean => one.cut !== "none")
      .map((one: IAutoMoviePatternPlacement): string => one.id),
    ["wood/v2@0,-1", "wood/h3@-1,0", "wood/v2@0,0", "wood/h3@0,0"],
  );

  TestValidator.equals(
    "the lay is an exact tiling, so the take-off closes on the room area",
    namedFacts([
      ["modules", (): boolean => laid.quantities.modules === 10],
      ["whole", (): boolean => laid.quantities.whole === 6],
      ["cut", (): boolean => laid.quantities.cut === 4],
      [
        "covered",
        (): boolean => nclose(laid.quantities.coveredArea, 0.36, 1e-12),
      ],
      [
        "net",
        (): boolean => nclose(laid.quantities.netRegionArea, 0.36, 1e-12),
      ],
      ["jointArea", (): boolean => nclose(laid.quantities.jointArea, 0, 1e-12)],
      [
        "consumed",
        (): boolean => nclose(laid.quantities.consumedArea, 0.45, 1e-12),
      ],
      ["waste", (): boolean => nclose(laid.quantities.wasteArea, 0.09, 1e-12)],
      ["ratio", (): boolean => nclose(laid.quantities.wasteRatio, 0.2, 1e-12)],
      [
        "halves",
        (): boolean =>
          laid.placements
            .filter(
              (one: IAutoMoviePatternPlacement): boolean => one.cut !== "none",
            )
            .every((one: IAutoMoviePatternPlacement): boolean =>
              nclose(one.coverage, 0.5, 1e-9),
            ),
      ],
      [
        "boards",
        (): boolean =>
          laid.placements.every(
            (one: IAutoMoviePatternPlacement): boolean =>
              nclose(one.size.u, 0.3, 1e-12) && nclose(one.size.v, 0.15, 1e-12),
          ),
      ],
    ]),
    {
      modules: true,
      whole: true,
      cut: true,
      covered: true,
      net: true,
      jointArea: true,
      consumed: true,
      waste: true,
      ratio: true,
      halves: true,
      boards: true,
    },
  );

  TestValidator.equals(
    "an interlocking lay overlaps nothing and deviates from no joint",
    laid.findings.length,
    0,
  );

  const turning: IAutoMovieSurfacePatternResult =
    generateAutoMovieSurfacePattern({
      pattern: floor({ grainToleranceDeg: 5 }),
    });
  // Rectangle contacts independently enumerated from the ten authored pieces.
  TestValidator.equals(
    "every cross-grain rectangle contact is reported exactly once",
    turning.findings
      .map((finding: IAutoMoviePatternFinding): string =>
        [...finding.occurrences].sort(compareCodeUnits).join("|"),
      )
      .sort(compareCodeUnits),
    [
      ["wood/v2@0,-1", "wood/h0@0,0"],
      ["wood/v2@0,-1", "wood/h1@0,0"],
      ["wood/v3@0,-1", "wood/h1@0,0"],
      ["wood/v3@0,-1", "wood/h2@0,0"],
      ["wood/h3@-1,0", "wood/v0@0,0"],
      ["wood/h3@-1,0", "wood/v1@0,0"],
      ["wood/h0@0,0", "wood/v0@0,0"],
      ["wood/v0@0,0", "wood/h1@0,0"],
      ["wood/h1@0,0", "wood/v1@0,0"],
      ["wood/v1@0,0", "wood/h2@0,0"],
      ["wood/h2@0,0", "wood/v2@0,0"],
      ["wood/v2@0,0", "wood/h3@0,0"],
    ]
      .map((pair: string[]): string => pair.sort(compareCodeUnits).join("|"))
      .sort(compareCodeUnits),
  );
  TestValidator.equals(
    "the grain turns where a flat board meets one on end, and nowhere else",
    namedFacts([
      ["raised", (): boolean => turning.findings.length > 0],
      [
        "kinds",
        (): boolean =>
          turning.findings.every(
            (one: IAutoMoviePatternFinding): boolean =>
              one.kind === "grain-break",
          ),
      ],
      [
        "crossings",
        (): boolean =>
          turning.findings.every((one: IAutoMoviePatternFinding): boolean => {
            const kinds: string[] = one.occurrences.map((id: string): string =>
              id.slice(id.indexOf("/") + 1).charAt(0),
            );
            return kinds.length === 2 && kinds[0] !== kinds[1];
          }),
      ],
      [
        "rightAngle",
        (): boolean =>
          turning.findings.every((one: IAutoMoviePatternFinding): boolean =>
            nclose(one.measured, 90, 1e-9),
          ),
      ],
      [
        "tolerated",
        (): boolean =>
          generateAutoMovieSurfacePattern({
            pattern: floor({ grainToleranceDeg: 90 }),
          }).findings.length === 0,
      ],
      ["noTolerance", (): boolean => laid.findings.length === 0],
    ]),
    {
      raised: true,
      kinds: true,
      crossings: true,
      rightAngle: true,
      tolerated: true,
      noTolerance: true,
    },
  );

  TestValidator.equals(
    "a halved board sits exactly on the minimum piece, either side of it",
    namedFacts([
      ["atMinimum", (): boolean => laid.findings.length === 0],
      [
        "above",
        (): boolean =>
          generateAutoMovieSurfacePattern({
            pattern: floor({ minimumPiece: 0.6 }),
          })
            .findings.map(
              (one: IAutoMoviePatternFinding): string =>
                `${one.kind}:${one.occurrences.join()}`,
            )
            .join("|") ===
          [
            "sliver:wood/v2@0,-1",
            "sliver:wood/h3@-1,0",
            "sliver:wood/v2@0,0",
            "sliver:wood/h3@0,0",
          ].join("|"),
      ],
      [
        "below",
        (): boolean =>
          generateAutoMovieSurfacePattern({
            pattern: floor({ minimumPiece: 0.4 }),
          }).findings.length === 0,
      ],
    ]),
    { atMinimum: true, above: true, below: true },
  );

  const instanced: IAutoMoviePatternInstancing =
    autoMoviePatternInstanceTransforms({
      result: laid,
      frame: FLOOR,
      thickness: 0.018,
    });
  TestValidator.equals(
    "only whole boards become slots, and each carries its own long axis",
    namedFacts([
      [
        "slots",
        (): boolean =>
          instanced.transforms
            .map((one: IAutoMovieExplicitInstanceTransform): string => one.id)
            .join() ===
          [
            "wood/v3@0,-1",
            "wood/h0@0,0",
            "wood/v0@0,0",
            "wood/h1@0,0",
            "wood/v1@0,0",
            "wood/h2@0,0",
          ].join(),
      ],
      [
        "cut",
        (): boolean =>
          instanced.cut.join() ===
          ["wood/v2@0,-1", "wood/h3@-1,0", "wood/v2@0,0", "wood/h3@0,0"].join(),
      ],
      [
        "flat",
        (): boolean =>
          vclose(instanced.transforms[1]!.translation, {
            x: 0.075,
            y: 0,
            z: 0.15,
          }) &&
          vclose(
            Quaternion.rotateVector(instanced.transforms[1]!.rotation, {
              x: 1,
              y: 0,
              z: 0,
            }),
            { x: 0, y: 0, z: 1 },
          ),
      ],
      [
        "onEnd",
        (): boolean =>
          vclose(instanced.transforms[2]!.translation, {
            x: 0.3,
            y: 0,
            z: 0.075,
          }) &&
          vclose(
            Quaternion.rotateVector(instanced.transforms[2]!.rotation, {
              x: 1,
              y: 0,
              z: 0,
            }),
            { x: 1, y: 0, z: 0 },
          ),
      ],
      [
        "scale",
        (): boolean =>
          instanced.transforms.every(
            (one: IAutoMovieExplicitInstanceTransform): boolean =>
              nclose(one.scale.x, 0.3, 1e-12) &&
              nclose(one.scale.y, 0.15, 1e-12) &&
              nclose(one.scale.z, 0.018, 1e-12),
          ),
      ],
    ]),
    { slots: true, cut: true, flat: true, onEnd: true, scale: true },
  );

  TestValidator.predicate(
    "the same herringbone laid twice preserves structure and numeric components",
    test12ValuesClose(
      generateAutoMovieSurfacePattern({ pattern: floor() }),
      laid,
    ),
  );
}
