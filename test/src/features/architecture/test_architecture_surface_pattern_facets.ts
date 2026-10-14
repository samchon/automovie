import {
  type IAutoMoviePatternFinding, type IAutoMoviePatternInstancing, type IAutoMoviePatternPlacement, type IAutoMoviePatternPoint, type IAutoMovieSurfacePatternZone,
  type AutoMovieSurfacePatternGenerator,
  type IAutoMoviePatternFacet,
  type IAutoMovieSurfacePatternResult,
  Quaternion,
  autoMoviePatternInstanceTransforms,
  generateAutoMovieSurfacePattern,
} from "@automovie/engine";
import type { IAutoMovieExplicitInstanceTransform, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { pattern, rectangle, zone } from "../internal/patternFixtures";
import {
  namedFacts,
  nclose,
  throwsError,
  vclose,
} from "../internal/predicates";

/** The flat face every unfolded zone stays on: X across, Y up, normal +Z. */
const FLAT: { origin: { x: number; y: number; z: number; }; u: { x: number; y: number; z: number; }; v: { x: number; y: number; z: number; }; } = {
  origin: { x: 0, y: 0, z: 0 },
  u: { x: 1, y: 0, z: 0 },
  v: { x: 0, y: 1, z: 0 },
};

/** One 0.49 m brick per lattice cell, on the row through the wall. */
const bricks: (width: number) => AutoMovieSurfacePatternGenerator =
  (width: number): AutoMovieSurfacePatternGenerator =>
  ({ column, row, origin }: { column: number; row: number; origin: IAutoMoviePatternPoint; period: { u: number; v: number; }; }) : { id: string; center: { u: number; v: number; }; size: { u: number; v: number; }; rotationDeg: number; grainDeg: number; mirror: false; }[] =>
    row !== 0
      ? []
      : [
          {
            id: `b${column}`,
            center: { u: origin.u + 0.25, v: 0.3 },
            size: { u: width, v: 0.6 },
            rotationDeg: 0,
            grainDeg: 0,
            mirror: false,
          },
        ];

const wall: (id: string, from: number, to: number, width: number) => IAutoMovieSurfacePatternZone = (id: string, from: number, to: number, width: number) : IAutoMovieSurfacePatternZone =>
  zone({
    id,
    region: rectangle(from, 0, to, 0.6),
    origin: { u: from, v: 0 },
    period: { u: 0.5, v: 1.2 },
    reach: { u: 0.5, v: 0.65 },
    material: "brick",
    generate: bricks(width),
  });

const corner: (width: number) => IAutoMovieSurfacePatternResult = (width: number): IAutoMovieSurfacePatternResult =>
  generateAutoMovieSurfacePattern({
    pattern: pattern({
      id: "corner",
      zones: [wall("south", 0, 2, 0.49), wall("east", 2, 3, width)],
      joint: 0.01,
      jointTolerance: 0.002,
      adjacency: 0.05,
      minimumPiece: 0.5,
    }),
  });

/** The panel directions of a facade folded 15 degrees at every seam. */
const heading: (index: number) => IAutoMovieVector3 = (index: number): IAutoMovieVector3 => {
  const angle: number = index * 15 * Quaternion.DEG2RAD;
  return { x: Math.cos(angle), y: 0, z: Math.sin(angle) };
};

/** Where the seam before panel `index` stands in the world. */
const seam: (index: number) => IAutoMovieVector3 = (index: number): IAutoMovieVector3 => {
  const point: { x: number; y: number; z: number; } = { x: 0, y: 0, z: 0 };
  for (let panel: number = 0; panel < index; ++panel) {
    point.x += heading(panel).x;
    point.z += heading(panel).z;
  }
  return point;
};

const facade: IAutoMovieSurfacePatternResult = generateAutoMovieSurfacePattern({
  pattern: pattern({
    id: "facade",
    zones: [0, 1, 2, 3].map((index: number) : IAutoMovieSurfacePatternZone =>
      zone({
        id: `p${index}`,
        region: rectangle(index, 0, index + 1, 0.5),
        origin: { u: index, v: 0 },
        period: { u: 1, v: 1 },
        reach: { u: 1, v: 0.6 },
        material: "panel",
        generate: ({ column, row, origin }: { column: number; row: number; origin: IAutoMoviePatternPoint; period: { u: number; v: number; }; }) : { id: string; center: { u: number; v: number; }; size: { u: number; v: number; }; rotationDeg: number; grainDeg: number; mirror: false; }[] =>
          row !== 0
            ? []
            : [
                {
                  id: `p${column}`,
                  center: { u: origin.u + 0.5, v: 0.25 },
                  size: { u: 0.98, v: 0.5 },
                  rotationDeg: 0,
                  grainDeg: 0,
                  mirror: false,
                },
              ],
      }),
    ),
    joint: 0.02,
    jointTolerance: 0.001,
    adjacency: 0.05,
    minimumPiece: 0.9,
  }),
});

const panels: IAutoMoviePatternFacet[] = [1, 2, 3].map((index: number) : { zone: string; anchor: { u: number; v: number; }; frame: { origin: IAutoMovieVector3; u: IAutoMovieVector3; v: { x: number; y: number; z: number; }; }; } => ({
  zone: `p${index}`,
  anchor: { u: index, v: 0 },
  frame: {
    origin: seam(index),
    u: heading(index),
    v: { x: 0, y: 1, z: 0 },
  },
}));

/**
 * One pattern laid around a corner and across a curved facade.
 *
 * Per-zone facets fold the developed corner and four facade panels into world space.
 *
 * Scenarios:
 *
 * 1. The corner is laid as one run: six bricks, every joint at the nominal
 *    including the one across the fold, and the take-off closes on the two
 *    regions together.
 * 2. A facet carries the return wall's bricks onto the return wall, and the
 *    unfolded run leaves them out along the first wall instead: the negative
 *    twin that shows the facet is what moved them.
 * 3. The two walls' faces really do turn: the return bricks' own face normal is a
 *    right angle from the first wall's.
 * 4. A brick laid short opens the corner joint, and the same scan that reports a
 *    joint inside one wall reports this one across the fold, naming both
 *    zones.
 * 5. Every facade panel lands on its own tangent panel, at the seam plus half its
 *    own heading, and consecutive panel normals are 15 degrees apart.
 * 6. Folding shortens the world: developed centres are 1 m apart while the world
 *    centres are a chord of `cos 7.5°` apart, and the developed take-off is
 *    unchanged by the fold.
 * 7. A facet naming an unknown zone, a zone named twice, a non-finite
 *    anchor, an axis that is not a unit vector, and axes that are not
 *    perpendicular are each refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates developed corner/facade patterns and instances them with or without facets, checking quantities, cross-zone joint findings, world positions, selected local axes, folded chords, and malformed facet refusals.
 * @evidence contracts/testing.md#independent-expectations Six authored 0.49-by-0.6 bricks cover 1.764 of 1.8 square metres; literal corner positions/axes and trigonometric 15-degree panel headings independently determine folded placements. Four 0.98-by-0.5 panels cover 1.96 of two square metres, and adjacent centres have chord cos(7.5 degrees).
 * @evidence contracts/testing.md#distinguishing-cases Folded versus unfolded returns distinguish facet placement, a shortened return brick must open the cross-zone joint, and curved panel normals/centres distinguish orientation from mere translation. Unknown/duplicate zones, nonfinite anchor/origin, nonunit axes, and nonperpendicular axes must retain their own Error causes.
 * @evidence contracts/testing.md#execution-ownership Uses local authored generator/facet records and synchronous numerical generation, instancing, and quaternion-vector reads without resources, clocks, global replacement, renderer, or another host. Developed quantities and sampled transforms do not certify a rendered curved facade or its physical construction.
 */
export function test_architecture_surface_pattern_facets(): void {
  const laid: IAutoMovieSurfacePatternResult = corner(0.49);
  TestValidator.equals(
    "the corner is laid as one run whose joints are all nominal",
    namedFacts([
      [
        "ids",
        () : boolean =>
          laid.placements.map((one: IAutoMoviePatternPlacement) : string => one.id).join() ===
          "south/b0,south/b1,south/b2,south/b3,east/b0,east/b1",
      ],
      ["whole", () : boolean => laid.quantities.whole === 6],
      ["findings", () : boolean => laid.findings.length === 0],
      ["covered", () : boolean => nclose(laid.quantities.coveredArea, 1.764, 1e-12)],
      ["net", () : boolean => nclose(laid.quantities.netRegionArea, 1.8, 1e-12)],
      ["jointArea", () : boolean => nclose(laid.quantities.jointArea, 0.036, 1e-12)],
      ["jointLength", () : boolean => nclose(laid.quantities.jointLength, 3.6, 1e-9)],
    ]),
    {
      ids: true,
      whole: true,
      findings: true,
      covered: true,
      net: true,
      jointArea: true,
      jointLength: true,
    },
  );

  const returned: IAutoMoviePatternFacet[] = [
    {
      zone: "east",
      anchor: { u: 2, v: 0 },
      frame: {
        origin: { x: 2, y: 0, z: 0 },
        u: { x: 0, y: 0, z: -1 },
        v: { x: 0, y: 1, z: 0 },
      },
    },
  ];
  const folded: IAutoMoviePatternInstancing = autoMoviePatternInstanceTransforms({
    result: laid,
    frame: FLAT,
    facets: returned,
    thickness: 0.1,
  });
  const unfolded: IAutoMoviePatternInstancing = autoMoviePatternInstanceTransforms({
    result: laid,
    frame: FLAT,
    thickness: 0.1,
  });
  TestValidator.equals(
    "a facet carries the return wall's bricks onto the return wall",
    namedFacts([
      [
        "firstWall",
        () : boolean =>
          folded.transforms
            .slice(0, 4)
            .every((one: IAutoMovieExplicitInstanceTransform, index: number) : boolean =>
              vclose(one.translation, { x: 0.25 + index * 0.5, y: 0.3, z: 0 }),
            ),
      ],
      [
        "returnWall",
        () : boolean =>
          vclose(folded.transforms[4]!.translation, {
            x: 2,
            y: 0.3,
            z: -0.25,
          }) &&
          vclose(folded.transforms[5]!.translation, {
            x: 2,
            y: 0.3,
            z: -0.75,
          }),
      ],
      [
        "unfolded",
        () : boolean =>
          vclose(unfolded.transforms[4]!.translation, {
            x: 2.25,
            y: 0.3,
            z: 0,
          }) &&
          vclose(unfolded.transforms[5]!.translation, {
            x: 2.75,
            y: 0.3,
            z: 0,
          }),
      ],
      [
        "sameFirstWall",
        () : boolean =>
          folded.transforms
            .slice(0, 4)
            .every((one: IAutoMovieExplicitInstanceTransform, index: number) : boolean =>
              vclose(one.translation, unfolded.transforms[index]!.translation),
            ),
      ],
    ]),
    {
      firstWall: true,
      returnWall: true,
      unfolded: true,
      sameFirstWall: true,
    },
  );

  TestValidator.equals(
    "the return wall's own face turns a right angle from the first wall's",
    namedFacts([
      [
        "first",
        () : boolean =>
          vclose(
            Quaternion.rotateVector(folded.transforms[0]!.rotation, {
              x: 0,
              y: 0,
              z: 1,
            }),
            { x: 0, y: 0, z: 1 },
          ),
      ],
      [
        "return",
        () : boolean =>
          vclose(
            Quaternion.rotateVector(folded.transforms[4]!.rotation, {
              x: 0,
              y: 0,
              z: 1,
            }),
            { x: 1, y: 0, z: 0 },
          ),
      ],
      [
        "along",
        () : boolean =>
          vclose(
            Quaternion.rotateVector(folded.transforms[4]!.rotation, {
              x: 1,
              y: 0,
              z: 0,
            }),
            { x: 0, y: 0, z: -1 },
          ),
      ],
    ]),
    { first: true, return: true, along: true },
  );

  TestValidator.equals(
    "a brick laid short opens the corner joint and the one behind it",
    corner(0.45).findings.map(
      (one: IAutoMoviePatternFinding) : string => `${one.kind}:${one.occurrences.join("+")}`,
    ),
    ["joint-deviation:south/b3+east/b0", "joint-deviation:east/b0+east/b1"],
  );

  const curved: IAutoMoviePatternInstancing = autoMoviePatternInstanceTransforms({
    result: facade,
    frame: FLAT,
    facets: panels,
    thickness: 0.04,
  });
  TestValidator.equals(
    "every facade panel lands on its own tangent panel",
    namedFacts([
      ["count", () : boolean => curved.transforms.length === 4],
      ["cut", () : boolean => curved.cut.length === 0],
      [
        "seated",
        () : boolean =>
          curved.transforms.every((one: IAutoMovieExplicitInstanceTransform, index: number) : boolean => {
            const base: IAutoMovieVector3 = seam(index);
            const along: IAutoMovieVector3 = heading(index);
            return vclose(one.translation, {
              x: base.x + along.x * 0.5,
              y: 0.25,
              z: base.z + along.z * 0.5,
            });
          }),
      ],
      [
        "fanned",
        () : boolean =>
          curved.transforms.every((one: IAutoMovieExplicitInstanceTransform, index: number) : boolean => {
            const normal: IAutoMovieVector3 = Quaternion.rotateVector(one.rotation, {
              x: 0,
              y: 0,
              z: 1,
            });
            const angle: number = index * 15 * Quaternion.DEG2RAD;
            return vclose(normal, {
              x: -Math.sin(angle),
              y: 0,
              z: Math.cos(angle),
            });
          }),
      ],
    ]),
    { count: true, cut: true, seated: true, fanned: true },
  );

  TestValidator.equals(
    "folding shortens the world while the developed take-off is unchanged",
    namedFacts([
      [
        "chord",
        () : boolean =>
          [0, 1, 2].every((index: number) : boolean => {
            const left: IAutoMovieVector3 = curved.transforms[index]!.translation;
            const right: IAutoMovieVector3 = curved.transforms[index + 1]!.translation;
            return nclose(
              Math.hypot(right.x - left.x, right.z - left.z),
              Math.cos(7.5 * Quaternion.DEG2RAD),
              1e-12,
            );
          }),
      ],
      [
        "developed",
        () : boolean =>
          [0, 1, 2].every((index: number) : boolean =>
            nclose(
              facade.placements[index + 1]!.center.u -
                facade.placements[index]!.center.u,
              1,
              1e-12,
            ),
          ),
      ],
      ["findings", () : boolean => facade.findings.length === 0],
      ["covered", () : boolean => nclose(facade.quantities.coveredArea, 1.96, 1e-12)],
      ["net", () : boolean => nclose(facade.quantities.netRegionArea, 2, 1e-12)],
      ["jointArea", () : boolean => nclose(facade.quantities.jointArea, 0.04, 1e-12)],
      ["jointLength", () : boolean => nclose(facade.quantities.jointLength, 2, 1e-9)],
    ]),
    {
      chord: true,
      developed: true,
      findings: true,
      covered: true,
      net: true,
      jointArea: true,
      jointLength: true,
    },
  );

  const refuse: (facet: IAutoMoviePatternFacet, message: string) => boolean = (facet: IAutoMoviePatternFacet, message: string): boolean =>
    throwsError(
      () : IAutoMoviePatternInstancing =>
        autoMoviePatternInstanceTransforms({
          result: laid,
          frame: FLAT,
          facets: [...returned, facet],
          thickness: 0.1,
        }),
      message,
    );
  TestValidator.equals(
    "a facet must name one zone that was laid, once, on an orthonormal panel",
    namedFacts([
      [
        "unknown",
        () : boolean =>
          refuse(
            { ...returned[0]!, zone: "north" },
            'pattern facet names zone "north", which pattern "corner" did not lay',
          ),
      ],
      [
        "duplicate",
        () : boolean => refuse(returned[0]!, 'pattern facet zone "east" must be unique'),
      ],
      [
        "anchor",
        () : boolean =>
          refuse(
            {
              ...returned[0]!,
              zone: "south",
              anchor: { u: Number.NaN, v: 0 },
            },
            'pattern facet "south" frame anchor must be finite',
          ),
      ],
      [
        "unit",
        () : boolean =>
          refuse(
            {
              ...returned[0]!,
              zone: "south",
              frame: { ...returned[0]!.frame, u: { x: 2, y: 0, z: 0 } },
            },
            'pattern facet "south" frame u must be a unit vector',
          ),
      ],
      [
        "origin",
        () : boolean =>
          refuse(
            {
              ...returned[0]!,
              zone: "south",
              frame: {
                ...returned[0]!.frame,
                origin: { x: Number.POSITIVE_INFINITY, y: 0, z: 0 },
              },
            },
            'pattern facet "south" frame origin must be finite',
          ),
      ],
      [
        "perpendicular",
        () : boolean =>
          refuse(
            {
              ...returned[0]!,
              zone: "south",
              frame: {
                ...returned[0]!.frame,
                v: { x: 0, y: Math.SQRT1_2, z: -Math.SQRT1_2 },
              },
            },
            'pattern facet "south" frame axes must be perpendicular',
          ),
      ],
    ]),
    {
      unknown: true,
      duplicate: true,
      anchor: true,
      unit: true,
      origin: true,
      perpendicular: true,
    },
  );
}
