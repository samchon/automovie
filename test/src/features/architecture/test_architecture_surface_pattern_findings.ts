import {
  type AutoMovieSurfacePatternGenerator,
  type IAutoMoviePatternFinding,
  type IAutoMoviePatternPlacement,
  type IAutoMoviePatternPoint,
  type IAutoMovieSurfacePatternResult,
  type IAutoMovieSurfacePatternZone,
  generateAutoMovieSurfacePattern,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { pattern, rectangle, zone } from "../internal/patternFixtures";
import { namedFacts, nclose } from "../internal/predicates";

/** One course of modules, laid only on the lattice row through the region. */
const course: (
  size: number,
  grainDeg: number,
  height: number,
) => AutoMovieSurfacePatternGenerator =
  (
    size: number,
    grainDeg: number,
    height: number,
  ): AutoMovieSurfacePatternGenerator =>
  ({
    column,
    row,
    origin,
    period,
  }: {
    column: number;
    row: number;
    origin: IAutoMoviePatternPoint;
    period: { u: number; v: number };
  }): {
    id: string;
    center: { u: number; v: number };
    size: { u: number; v: number };
    rotationDeg: number;
    grainDeg: number;
    mirror: false;
  }[] =>
    row !== 0
      ? []
      : [
          {
            id: `c${column}`,
            center: { u: origin.u + period.u / 2, v: height / 2 },
            size: { u: size, v: height },
            rotationDeg: 0,
            grainDeg,
            mirror: false,
          },
        ];

/**
 * The three neighbour defects a laid pattern reports, and the transition where
 * one zone meets another.
 *
 * A joint is read perpendicular to the edges it separates, so two modules that
 * overlap, that sit further apart than the joint allows, or that run their
 * grain in different directions are all measured the same way and reported as
 * structured findings. Candidate neighbours use centre buckets and the narrow
 * phase measures edge-normal projection gaps, rather than Euclidean distance;
 * these aligned fixtures exercise that shared rule within and across zones.
 *
 * Scenarios:
 *
 * 1. Modules laid wider than their pitch overlap; every overlapping pair is
 *    reported with the metre penetration, and pairs beyond the adjacency gap
 *    are not reported at all.
 * 2. Two zones whose modules the shared border cuts butt against each other on the
 *    surface, so nothing is reported, even though the two modules as designed
 *    occupy exactly the same rectangle. This is why neighbours are measured
 *    between the pieces as laid rather than the modules as designed.
 * 3. A triangular region cutting a square module across two of its corners keeps
 *    each of those corners once. A repeated corner would leave a zero-length
 *    edge, and the joint measurement normalizes every edge, so the pair would
 *    be compared through a NaN that reads false against every limit and be
 *    silently exempted. The same two pieces are therefore also asserted to
 *    report their real zero-metre butt joint against a 20 mm nominal.
 * 4. A course whose middle module is 40 mm narrower opens both its joints to 40 mm
 *    against a 20 mm nominal, so both pairs are reported; a course laid to the
 *    nominal reports nothing.
 * 5. When the same neighbouring pair also turns its grain, the joint finding and
 *    the grain finding are both raised, in that order.
 * 6. Two zones meeting at a shared edge report the grain turn across the border
 *    and stay silent inside each zone.
 * 7. A null grain tolerance disables the grain scan entirely, even where the grain
 *    turns ninety degrees.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs generateAutoMovieSurfacePattern and inspects laid outlines plus ordered overlap/joint/grain findings for overlapping courses, shared borders, triangular clipping, narrowed modules, and zone transitions.
 * @evidence contracts/testing.md#independent-expectations Authored 0.6 widths on a 0.5 pitch imply 0.1 penetration; the 0.98/0.94 course widths imply 0.04 gaps around the narrowed middle piece. Explicit clipped triangles, zero butt joint, 20 mm nominal, 90-degree grain turn, and named occurrence pairs supply independent numerical and identity oracles.
 * @evidence contracts/testing.md#distinguishing-cases Clipped shared-border pieces must avoid the uncut rectangles' false overlap; exact clip corners remain distinct and still report a nonzero nominal joint deviation. Nominal/narrow courses, joint-plus-grain ordering, cross-zone grain only, and null tolerance distinguish each scan policy.
 * @evidence contracts/testing.md#execution-ownership Uses synchronous authored records/generator callbacks and numerical engine output without a renderer, resources, clocks, global replacement, or additional host. The aligned cases do not prove exhaustive Euclidean neighbourhood detection or rendered surface quality.
 */
export function test_architecture_surface_pattern_findings(): void {
  const overlapping: IAutoMovieSurfacePatternResult =
    generateAutoMovieSurfacePattern({
      pattern: pattern({
        id: "overlap",
        zones: [
          zone({
            id: "bad",
            region: rectangle(-0.1, 0, 2.1, 0.6),
            period: { u: 0.5, v: 2 },
            reach: { u: 0.6, v: 0.6 },
            generate: ({
              column,
              row,
              origin,
            }: {
              column: number;
              row: number;
              origin: IAutoMoviePatternPoint;
              period: { u: number; v: number };
            }): {
              id: string;
              center: { u: number; v: number };
              size: { u: number; v: number };
              rotationDeg: number;
              grainDeg: number;
              mirror: false;
            }[] =>
              row !== 0
                ? []
                : [
                    {
                      id: `m${column}`,
                      center: { u: origin.u + 0.25, v: 0.3 },
                      size: { u: 0.6, v: 0.6 },
                      rotationDeg: 0,
                      grainDeg: 0,
                      mirror: false,
                    },
                  ],
          }),
        ],
        adjacency: 0.05,
        minimumPiece: 0.05,
      }),
    });
  TestValidator.equals(
    "every overlapping neighbour pair is reported, and no distant pair is",
    overlapping.findings.map((one: IAutoMoviePatternFinding): string =>
      one.occurrences.join("+"),
    ),
    [
      "bad/m-1+bad/m0",
      "bad/m0+bad/m1",
      "bad/m1+bad/m2",
      "bad/m2+bad/m3",
      "bad/m3+bad/m4",
    ],
  );
  TestValidator.equals(
    "an overlap reports the metre penetration against a zero limit",
    namedFacts([
      [
        "kinds",
        (): boolean =>
          overlapping.findings.every(
            (one: IAutoMoviePatternFinding): boolean =>
              one.kind === "module-overlap",
          ),
      ],
      [
        "measured",
        (): boolean =>
          overlapping.findings.every((one: IAutoMoviePatternFinding): boolean =>
            nclose(one.measured, -0.1, 1e-9),
          ),
      ],
      [
        "limit",
        (): boolean =>
          overlapping.findings.every((one: IAutoMoviePatternFinding): boolean =>
            nclose(one.limit, 0, 0),
          ),
      ],
      [
        "detail",
        (): boolean =>
          overlapping.findings[0]!.detail.includes(
            "instead of leaving a joint",
          ),
      ],
      ["placements", (): boolean => overlapping.placements.length === 6],
      [
        "outside",
        (): boolean =>
          overlapping.placements
            .map((one: IAutoMoviePatternPlacement): string => one.module)
            .join() === "m-1,m0,m1,m2,m3,m4",
      ],
    ]),
    {
      kinds: true,
      measured: true,
      limit: true,
      detail: true,
      placements: true,
      outside: true,
    },
  );

  const straddle: IAutoMovieSurfacePatternZone = zone({
    period: { u: 1, v: 1 },
    reach: { u: 0.6, v: 0.6 },
    generate: ({
      column,
      row,
      origin,
    }: {
      column: number;
      row: number;
      origin: IAutoMoviePatternPoint;
      period: { u: number; v: number };
    }): {
      id: string;
      center: { u: number; v: number };
      size: { u: number; v: number };
      rotationDeg: number;
      grainDeg: number;
      mirror: false;
    }[] =>
      row !== 0
        ? []
        : [
            {
              id: `c${column}`,
              center: { u: origin.u, v: 0.25 },
              size: { u: 1, v: 0.5 },
              rotationDeg: 0,
              grainDeg: 0,
              mirror: false,
            },
          ],
  });
  const shared: IAutoMovieSurfacePatternResult =
    generateAutoMovieSurfacePattern({
      pattern: pattern({
        id: "border",
        zones: [
          { ...straddle, id: "a", region: rectangle(0, 0, 1, 0.5) },
          {
            ...straddle,
            id: "b",
            region: rectangle(1, 0, 2, 0.5),
            origin: { u: 1, v: 0 },
          },
        ],
        minimumPiece: 0.5,
      }),
    });
  TestValidator.equals(
    "pieces cut at a shared border butt on the surface and report nothing",
    namedFacts([
      [
        "placements",
        (): boolean =>
          shared.placements
            .map((one: IAutoMoviePatternPlacement): string => one.id)
            .join() === "a/c0,a/c1,b/c0,b/c1",
      ],
      [
        "sameRectangle",
        (): boolean =>
          nclose(shared.placements[1]!.center.u, 1, 1e-12) &&
          nclose(shared.placements[2]!.center.u, 1, 1e-12) &&
          nclose(shared.placements[1]!.size.u, 1, 1e-12) &&
          nclose(shared.placements[2]!.size.u, 1, 1e-12),
      ],
      [
        "cutAtBorder",
        (): boolean =>
          shared.placements.every(
            (one: IAutoMoviePatternPlacement): boolean =>
              one.cut === "boundary",
          ),
      ],
      ["findings", (): boolean => shared.findings.length === 0],
    ]),
    {
      placements: true,
      sameRectangle: true,
      cutAtBorder: true,
      findings: true,
    },
  );

  const onCorner: (
    joint: number,
    jointTolerance: number,
    adjacency: number,
  ) => IAutoMovieSurfacePatternResult = (
    joint: number,
    jointTolerance: number,
    adjacency: number,
  ): IAutoMovieSurfacePatternResult =>
    generateAutoMovieSurfacePattern({
      pattern: pattern({
        id: "corner",
        zones: [
          zone({
            id: "tri",
            region: [
              { u: 0, v: 0 },
              { u: 2, v: 0 },
              { u: 0, v: 2 },
            ],
            origin: { u: 0.5, v: 0.5 },
            period: { u: 1, v: 1 },
            reach: { u: 1, v: 1 },
            generate: ({
              column,
              row,
              origin,
            }: {
              column: number;
              row: number;
              origin: IAutoMoviePatternPoint;
              period: { u: number; v: number };
            }): {
              id: string;
              center: { u: number; v: number };
              size: { u: number; v: number };
              rotationDeg: number;
              grainDeg: number;
              mirror: false;
            }[] =>
              row !== 0 || column < -1 || column > 0
                ? []
                : [
                    {
                      id: `m${column}`,
                      center: { u: origin.u + 0.5, v: origin.v + 0.5 },
                      size: { u: 1, v: 1 },
                      rotationDeg: 0,
                      grainDeg: 0,
                      mirror: false,
                    },
                  ],
          }),
        ],
        joint,
        jointTolerance,
        adjacency,
        minimumPiece: 0.5,
      }),
    });
  const cornered: IAutoMovieSurfacePatternResult = onCorner(0, 0, 0);
  TestValidator.equals(
    "a corner landing exactly on a clip edge is kept once, not twice",
    namedFacts([
      ["placements", (): boolean => cornered.placements.length === 2],
      ["triangle", (): boolean => cornered.placements[1]!.outline.length === 3],
      [
        "distinct",
        (): boolean =>
          cornered.placements.every(
            (one: IAutoMoviePatternPlacement): boolean =>
              one.outline.every(
                (point: IAutoMoviePatternPoint, index: number): boolean =>
                  !nclose(
                    point.u,
                    one.outline[(index + 1) % one.outline.length]!.u,
                    0,
                  ) ||
                  !nclose(
                    point.v,
                    one.outline[(index + 1) % one.outline.length]!.v,
                    0,
                  ),
              ),
          ),
      ],
      [
        "areas",
        (): boolean =>
          cornered.placements.every(
            (one: IAutoMoviePatternPlacement): boolean =>
              nclose(one.area, 0.5, 1e-12),
          ),
      ],
      [
        "coverage",
        (): boolean =>
          cornered.placements.every(
            (one: IAutoMoviePatternPlacement): boolean =>
              nclose(one.coverage, 0.5, 1e-12),
          ),
      ],
      ["findings", (): boolean => cornered.findings.length === 0],
    ]),
    {
      placements: true,
      triangle: true,
      distinct: true,
      areas: true,
      coverage: true,
      findings: true,
    },
  );
  const cornerJoint: IAutoMovieSurfacePatternResult = onCorner(
    0.02,
    0.001,
    0.05,
  );
  TestValidator.equals(
    "the two pieces are still measured against each other, not skipped as NaN",
    cornerJoint.findings.map(
      (one: IAutoMoviePatternFinding): string =>
        `${one.kind}:${one.occurrences.join("+")}`,
    ),
    ["joint-deviation:tri/m-1+tri/m0"],
  );
  TestValidator.equals(
    "and the measurement is the real zero-metre butt joint",
    namedFacts([
      [
        "measured",
        (): boolean => nclose(cornerJoint.findings[0]!.measured, 0, 0),
      ],
      [
        "limit",
        (): boolean => nclose(cornerJoint.findings[0]!.limit, 0.02, 1e-12),
      ],
    ]),
    { measured: true, limit: true },
  );

  const run: (
    narrow: boolean,
    grainToleranceDeg: number | null,
  ) => IAutoMovieSurfacePatternResult = (
    narrow: boolean,
    grainToleranceDeg: number | null,
  ): IAutoMovieSurfacePatternResult =>
    generateAutoMovieSurfacePattern({
      pattern: pattern({
        id: "course",
        zones: [
          zone({
            id: "band",
            region: rectangle(0, 0, 3, 0.5),
            period: { u: 1, v: 2 },
            reach: { u: 1, v: 0.5 },
            generate: ({
              column,
              row,
              origin,
            }: {
              column: number;
              row: number;
              origin: IAutoMoviePatternPoint;
              period: { u: number; v: number };
            }): {
              id: string;
              center: { u: number; v: number };
              size: { u: number; v: number };
              rotationDeg: number;
              grainDeg: number;
              mirror: false;
            }[] =>
              row !== 0
                ? []
                : [
                    {
                      id: `c${column}`,
                      center: { u: origin.u + 0.5, v: 0.25 },
                      size: {
                        u: narrow && column === 1 ? 0.94 : 0.98,
                        v: 0.5,
                      },
                      rotationDeg: 0,
                      grainDeg:
                        grainToleranceDeg !== null && column === 1 ? 90 : 0,
                      mirror: false,
                    },
                  ],
          }),
        ],
        joint: 0.02,
        jointTolerance: 0.005,
        adjacency: 0.1,
        minimumPiece: 0.5,
        grainToleranceDeg,
      }),
    });

  const opened: IAutoMovieSurfacePatternResult = run(true, null);
  TestValidator.equals(
    "a narrower module opens both of its joints beyond the tolerance",
    namedFacts([
      ["placements", (): boolean => opened.placements.length === 3],
      ["count", (): boolean => opened.findings.length === 2],
      [
        "kinds",
        (): boolean =>
          opened.findings.every(
            (one: IAutoMoviePatternFinding): boolean =>
              one.kind === "joint-deviation",
          ),
      ],
      [
        "pairs",
        (): boolean =>
          opened.findings
            .map((one: IAutoMoviePatternFinding): string =>
              one.occurrences.join("+"),
            )
            .join() === "band/c0+band/c1,band/c1+band/c2",
      ],
      [
        "measured",
        (): boolean =>
          opened.findings.every((one: IAutoMoviePatternFinding): boolean =>
            nclose(one.measured, 0.04, 1e-9),
          ),
      ],
      [
        "limit",
        (): boolean =>
          opened.findings.every((one: IAutoMoviePatternFinding): boolean =>
            nclose(one.limit, 0.02, 1e-12),
          ),
      ],
    ]),
    {
      placements: true,
      count: true,
      kinds: true,
      pairs: true,
      measured: true,
      limit: true,
    },
  );

  TestValidator.equals(
    "a course laid to the nominal joint reports nothing",
    run(false, null).findings.length,
    0,
  );

  const turned: IAutoMovieSurfacePatternResult = run(true, 5);
  TestValidator.equals(
    "a pair that deviates in joint and grain raises both, joint first",
    turned.findings.map(
      (one: IAutoMoviePatternFinding): string =>
        `${one.kind}:${one.occurrences.join("+")}`,
    ),
    [
      "joint-deviation:band/c0+band/c1",
      "grain-break:band/c0+band/c1",
      "joint-deviation:band/c1+band/c2",
      "grain-break:band/c1+band/c2",
    ],
  );
  TestValidator.equals(
    "a grain break reports the smallest angle between the two directions",
    namedFacts([
      [
        "measured",
        (): boolean => nclose(turned.findings[1]!.measured, 90, 1e-12),
      ],
      ["limit", (): boolean => nclose(turned.findings[1]!.limit, 5, 1e-12)],
      [
        "detail",
        (): boolean => turned.findings[1]!.detail.includes("run their grain"),
      ],
    ]),
    { measured: true, limit: true, detail: true },
  );

  const transition: (
    grainToleranceDeg: number | null,
  ) => IAutoMovieSurfacePatternResult = (
    grainToleranceDeg: number | null,
  ): IAutoMovieSurfacePatternResult =>
    generateAutoMovieSurfacePattern({
      pattern: pattern({
        id: "transition",
        zones: [
          zone({
            id: "a",
            region: rectangle(0, 0, 1, 0.5),
            period: { u: 0.5, v: 1 },
            generate: course(0.5, 0, 0.5),
          }),
          zone({
            id: "b",
            region: rectangle(1, 0, 2, 0.5),
            origin: { u: 1, v: 0 },
            period: { u: 0.5, v: 1 },
            generate: course(0.5, 90, 0.5),
          }),
        ],
        grainToleranceDeg,
        minimumPiece: 0.5,
      }),
    });
  const across: IAutoMovieSurfacePatternResult = transition(5);
  TestValidator.equals(
    "the grain turn is reported across the zone border and nowhere else",
    across.findings.map(
      (one: IAutoMoviePatternFinding): string =>
        `${one.kind}:${one.occurrences.join("+")}`,
    ),
    ["grain-break:a/c1+b/c0"],
  );
  TestValidator.equals(
    "the transition still lays both zones in full",
    across.placements.map((one: IAutoMoviePatternPlacement): string => one.id),
    ["a/c0", "a/c1", "b/c0", "b/c1"],
  );
  TestValidator.equals(
    "a null grain tolerance disables the grain scan entirely",
    transition(null).findings.length,
    0,
  );
}
