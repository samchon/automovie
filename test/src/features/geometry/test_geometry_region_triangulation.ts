import { TestValidator } from "@nestia/e2e";

import { IAutoMovieRegionTriangulation } from "../../../../packages/engine/src/geometry/IAutoMovieRegionTriangulation";
import { triangulateAutoMovieRegion } from "../../../../packages/engine/src/geometry/triangulateAutoMovieRegion";
import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { namedFacts, nclose, throwsError } from "../internal/predicates";

interface IPlanarPoint {
  x: number;
  y: number;
}

const signedArea: (points: readonly IPlanarPoint[]) => number = (
  points: readonly IPlanarPoint[],
): number => {
  let total: number = 0;
  for (let index: number = 0; index < points.length; ++index) {
    const from: IPlanarPoint = points[index]!;
    const to: IPlanarPoint = points[(index + 1) % points.length]!;
    total += from.x * to.y - to.x * from.y;
  }
  return total / 2;
};

const triangleAreas: (plan: IAutoMovieRegionTriangulation) => number[] = (
  plan: IAutoMovieRegionTriangulation,
): number[] => {
  const areas: number[] = [];
  for (let at: number = 0; at < plan.triangles.length; at += 3)
    areas.push(
      signedArea([
        plan.points[plan.triangles[at]!]!,
        plan.points[plan.triangles[at + 1]!]!,
        plan.points[plan.triangles[at + 2]!]!,
      ]),
    );
  return areas;
};

/**
 * Positive triangle winding, the declared boundary chain and independently
 * known area jointly detect overlaps, omissions and filled holes. Cancelling
 * internal oriented edges leaves exactly the outer boundary and hole loops.
 */
const coversExactly: (
  plan: IAutoMovieRegionTriangulation,
  area: number,
) => boolean = (plan: IAutoMovieRegionTriangulation, area: number): boolean => {
  const areas: number[] = triangleAreas(plan);
  const boundary: Map<string, number> = new Map();
  const edge: (from: number, to: number, sign: number) => void = (
    from: number,
    to: number,
    sign: number,
  ): void => {
    const key: string = `${Math.min(from, to)}/${Math.max(from, to)}`;
    boundary.set(key, (boundary.get(key) ?? 0) + sign * (from < to ? 1 : -1));
  };
  for (let at: number = 0; at < plan.triangles.length; at += 3)
    for (let corner: number = 0; corner < 3; ++corner)
      edge(
        plan.triangles[at + corner]!,
        plan.triangles[at + ((corner + 1) % 3)]!,
        1,
      );
  for (const ring of plan.rings)
    for (let corner: number = 0; corner < ring.count; ++corner)
      edge(ring.start + corner, ring.start + ((corner + 1) % ring.count), -1);
  return (
    [...boundary.values()].every((count: number): boolean => count === 0) &&
    areas.every((one: number): boolean => one > 0) &&
    nclose(
      areas.reduce((total: number, one: number): number => total + one, 0),
      area,
      1e-12,
    ) &&
    nclose(plan.area, area, 1e-12)
  );
};

const ringOf: (
  plan: IAutoMovieRegionTriangulation,
  at: number,
) => IPlanarPoint[] = (
  plan: IAutoMovieRegionTriangulation,
  at: number,
): IPlanarPoint[] =>
  plan.points.slice(
    plan.rings[at]!.start,
    plan.rings[at]!.start + plan.rings[at]!.count,
  );

const ell: IPlanarPoint[] = [
  { x: 0, y: 0 },
  { x: 3, y: 0 },
  { x: 3, y: 1 },
  { x: 1, y: 1 },
  { x: 1, y: 3 },
  { x: 0, y: 3 },
];

const square: IPlanarPoint[] = [
  { x: 0, y: 0 },
  { x: 4, y: 0 },
  { x: 4, y: 4 },
  { x: 0, y: 4 },
];

const inner: IPlanarPoint[] = [
  { x: 1, y: 1 },
  { x: 3, y: 1 },
  { x: 3, y: 3 },
  { x: 1, y: 3 },
];

/**
 * The free-form region triangulator: an arbitrary contour less its holes.
 *
 * Every expectation is hand math against the authored outline. An L of legs 3x1
 * and 1x2 encloses 5 m² and a simple hexagon resolves to four triangles; a 4 m
 * square holding a 2 m square hole encloses 12 m² and the ten corners the
 * bridge leaves resolve to eight. Coverage requires positive areas, the known
 * total area and cancellation of every internal oriented edge to exactly the
 * declared outer and hole boundary chains; a count alone cannot establish it.
 *
 * Scenarios:
 *
 * 1. A concave contour triangulates to `points - 2` counter-clockwise triangles
 *    covering exactly its own area, which the convex kernel refuses outright.
 * 2. A square holding a square hole bridges into one ring of ten corners, resolves
 *    to eight triangles, and covers the outer ring less the hole.
 * 3. Two holes bridge independently, a hole inside a concave outer ring
 *    bridges against a contour that is not convex, and a hole that sees no
 *    outer corner from inside another hole's cavity bridges after that hole.
 * 4. Winding is canonicalized, not demanded: a clockwise outer ring and a
 *    counter-clockwise hole come back counter-clockwise and clockwise, with
 *    the same independently expected area and boundary coverage.
 * 5. Determinism: the same authored region rebuilds with exact finite values and structure.
 * 6. Negative twins: each refusal fires one property away from a region that
 *    triangulates, covering short, non-finite, repeated, spiked, empty,
 *    self-crossing, touching, escaped, and nested rings.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls triangulateAutoMovieRegion for concavity and holes, including a sheltered first hole; positive triangle winding and boundary-chain conservation catch filled holes or inconsistent coverage as well as declaration-order bridge failure.
 * @evidence contracts/testing.md#independent-expectations Authored dimensions give outer-minus-hole areas independently, and oriented-edge cancellation expresses the triangulation boundary contract without using the ear algorithm. Positive triangle areas and the known total retain 1e-12 absolute area agreement; this numerical chain check is not an exact-arithmetic or rendered proof, and separate source-identity tests own each canonical point's provenance.
 * @evidence contracts/testing.md#distinguishing-cases Covers concavity, multiple/sheltered holes, reversed winding, deterministic rebuilds and short/nonfinite/repeated/spiked/crossing/touching/escaped/nested rings; source-identity tests own point provenance.
 * @evidence contracts/testing.md#execution-ownership The discoverable geometry entry runs portable triangulation and ordinary assertion helpers directly; all cases belong to this function without host startup.
 */
export function test_geometry_region_triangulation(): void {
  const concave: IAutoMovieRegionTriangulation = triangulateAutoMovieRegion({
    outer: ell,
  });
  TestValidator.equals(
    "a concave contour triangulates to exactly its own area",
    namedFacts([
      [
        "triangles",
        (): boolean => concave.triangles.length === (ell.length - 2) * 3,
      ],
      ["rings", (): boolean => concave.rings.length === 1],
      [
        "span",
        (): boolean =>
          concave.rings[0]!.start === 0 &&
          concave.rings[0]!.count === ell.length,
      ],
      ["covers", (): boolean => coversExactly(concave, 5)],
    ]),
    { triangles: true, rings: true, span: true, covers: true },
  );

  const holed: IAutoMovieRegionTriangulation = triangulateAutoMovieRegion({
    outer: square,
    holes: [inner],
  });
  TestValidator.equals(
    "a square holding a square hole bridges into one ring and covers the remainder",
    namedFacts([
      // Four outer corners, four hole corners, and the bridge repeating one of
      // each: ten corners, so ten minus two triangles.
      ["triangles", (): boolean => holed.triangles.length === 8 * 3],
      ["points", (): boolean => holed.points.length === 8],
      [
        "rings",
        (): boolean =>
          holed.rings.length === 2 &&
          holed.rings[1]!.start === 4 &&
          holed.rings[1]!.count === 4,
      ],
      [
        "outerWinding",
        (): boolean => nclose(signedArea(ringOf(holed, 0)), 16, 0),
      ],
      [
        "holeWinding",
        (): boolean => nclose(signedArea(ringOf(holed, 1)), -4, 0),
      ],
      ["covers", (): boolean => coversExactly(holed, 12)],
    ]),
    {
      triangles: true,
      points: true,
      rings: true,
      outerWinding: true,
      holeWinding: true,
      covers: true,
    },
  );

  const twoHoles: IAutoMovieRegionTriangulation = triangulateAutoMovieRegion({
    outer: square,
    holes: [
      [
        { x: 0.5, y: 0.5 },
        { x: 1.5, y: 0.5 },
        { x: 1.5, y: 1.5 },
        { x: 0.5, y: 1.5 },
      ],
      [
        { x: 2.5, y: 2.5 },
        { x: 3.5, y: 2.5 },
        { x: 3.5, y: 3.5 },
        { x: 2.5, y: 3.5 },
      ],
    ],
  });
  // A hole inside a concave outer ring, so the contour the bridge is chosen
  // against is not convex.
  const notched: IAutoMovieRegionTriangulation = triangulateAutoMovieRegion({
    outer: [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 6, y: 6 },
      { x: 3.5, y: 6 },
      { x: 3.5, y: 2 },
      { x: 2.5, y: 2 },
      { x: 2.5, y: 6 },
      { x: 0, y: 6 },
    ],
    holes: [
      [
        { x: 4.5, y: 3 },
        { x: 5.5, y: 3 },
        { x: 5.5, y: 4 },
        { x: 4.5, y: 4 },
      ],
    ],
  });
  TestValidator.equals(
    "several holes and a hole inside a concave contour each bridge and cover",
    namedFacts([
      ["twoHoles", (): boolean => coversExactly(twoHoles, 16 - 1 - 1)],
      ["twoHoleTriangles", (): boolean => twoHoles.triangles.length === 14 * 3],
      ["notched", (): boolean => coversExactly(notched, 6 * 6 - 1 * 4 - 1)],
      ["notchedTriangles", (): boolean => notched.triangles.length === 12 * 3],
    ]),
    {
      twoHoles: true,
      twoHoleTriangles: true,
      notched: true,
      notchedTriangles: true,
    },
  );

  // The triangle hole sits in the cavity of a C-shaped hole whose slot faces
  // the middle of the outer ring's right side, so no outer corner is visible
  // from it: it can only bridge once the C has joined the ring, although it is
  // declared first.
  const sheltered: IAutoMovieRegionTriangulation = triangulateAutoMovieRegion({
    outer: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ],
    holes: [
      [
        { x: 4.5, y: 4.5 },
        { x: 5.5, y: 4.5 },
        { x: 5, y: 5.5 },
      ],
      [
        { x: 7, y: 5.2 },
        { x: 7, y: 7 },
        { x: 3, y: 7 },
        { x: 3, y: 3 },
        { x: 7, y: 3 },
        { x: 7, y: 4.8 },
        { x: 6.5, y: 4.8 },
        { x: 6.5, y: 3.5 },
        { x: 3.5, y: 3.5 },
        { x: 3.5, y: 6.5 },
        { x: 6.5, y: 6.5 },
        { x: 6.5, y: 5.2 },
      ],
    ],
  });
  TestValidator.equals(
    "a hole sheltered in another hole's cavity bridges after the hole it can see",
    namedFacts([
      // 19 corners and two bridges that each repeat two: 23, so 21 triangles.
      ["triangles", (): boolean => sheltered.triangles.length === 21 * 3],
      ["covers", (): boolean => coversExactly(sheltered, 100 - 6.8 - 0.5)],
    ]),
    { triangles: true, covers: true },
  );

  const reversed: IAutoMovieRegionTriangulation = triangulateAutoMovieRegion({
    outer: [...square].reverse(),
    holes: [[...inner].reverse()],
  });
  TestValidator.equals(
    "a region authored the other way round is canonicalized, not refused",
    namedFacts([
      [
        "outerWinding",
        (): boolean => nclose(signedArea(ringOf(reversed, 0)), 16, 0),
      ],
      [
        "holeWinding",
        (): boolean => nclose(signedArea(ringOf(reversed, 1)), -4, 0),
      ],
      ["covers", (): boolean => coversExactly(reversed, 12)],
    ]),
    { outerWinding: true, holeWinding: true, covers: true },
  );

  TestValidator.predicate(
    "the same authored region rebuilds with exact finite values and structure",
    equalGeometryTestValues(
      triangulateAutoMovieRegion({ outer: square, holes: [inner] }),
      holed,
    ),
  );

  const invalids: Array<readonly [string, () => unknown, string]> = [
    [
      "short ring",
      (): IAutoMovieRegionTriangulation =>
        triangulateAutoMovieRegion({
          outer: [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
          ],
        }),
      "polygon outer ring needs at least three points",
    ],
    [
      "non-finite corner",
      (): IAutoMovieRegionTriangulation =>
        triangulateAutoMovieRegion({
          outer: [{ x: 0, y: Number.POSITIVE_INFINITY }, ...ell.slice(1)],
        }),
      "polygon outer ring[0] must be finite",
    ],
    [
      "repeated corner",
      (): IAutoMovieRegionTriangulation =>
        triangulateAutoMovieRegion({
          outer: [
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
          ],
        }),
      "polygon outer ring[0] repeats the point beside it",
    ],
    [
      "spike",
      (): IAutoMovieRegionTriangulation =>
        triangulateAutoMovieRegion({
          outer: [
            { x: 0, y: 0 },
            { x: 2, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 2 },
          ],
        }),
      "polygon outer ring[1] doubles back along its own edge",
    ],
    [
      "collinear ring",
      (): IAutoMovieRegionTriangulation =>
        triangulateAutoMovieRegion({
          outer: [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 2, y: 0 },
          ],
        }),
      "polygon outer ring encloses no area",
    ],
    [
      "ring whose halves cancel",
      (): IAutoMovieRegionTriangulation =>
        triangulateAutoMovieRegion({
          outer: [
            { x: 0, y: 0 },
            { x: 2, y: 2 },
            { x: 2, y: 0 },
            { x: 0, y: 2 },
          ],
        }),
      "polygon outer ring encloses no area",
    ],
    [
      "self-crossing ring",
      (): IAutoMovieRegionTriangulation =>
        triangulateAutoMovieRegion({
          outer: [
            { x: 0, y: 0 },
            { x: 4, y: 4 },
            { x: 4, y: 0 },
            { x: 0, y: 3 },
          ],
        }),
      "polygon outer ring crosses itself between edge 0 and edge 2",
    ],
    [
      "hole crossing the outer ring",
      (): IAutoMovieRegionTriangulation =>
        triangulateAutoMovieRegion({
          outer: square,
          holes: [
            [
              { x: 3, y: 1 },
              { x: 5, y: 1 },
              { x: 5, y: 3 },
              { x: 3, y: 3 },
            ],
          ],
        }),
      "polygon outer ring and polygon hole[0] touch or cross",
    ],
    [
      "hole touching the outer ring",
      (): IAutoMovieRegionTriangulation =>
        triangulateAutoMovieRegion({
          outer: square,
          holes: [
            [
              { x: 1, y: 1 },
              { x: 4, y: 1 },
              { x: 4, y: 3 },
              { x: 1, y: 3 },
            ],
          ],
        }),
      "polygon outer ring and polygon hole[0] touch or cross",
    ],
    [
      "hole outside the outer ring",
      (): IAutoMovieRegionTriangulation =>
        triangulateAutoMovieRegion({
          outer: square,
          holes: [
            [
              { x: 6, y: 6 },
              { x: 7, y: 6 },
              { x: 7, y: 7 },
              { x: 6, y: 7 },
            ],
          ],
        }),
      "polygon hole[0] must lie inside polygon outer ring",
    ],
    [
      "hole nested in another hole",
      (): IAutoMovieRegionTriangulation =>
        triangulateAutoMovieRegion({
          outer: square,
          holes: [
            inner,
            [
              { x: 1.5, y: 1.5 },
              { x: 2.5, y: 1.5 },
              { x: 2.5, y: 2.5 },
              { x: 1.5, y: 2.5 },
            ],
          ],
        }),
      "polygon hole[1] must lie outside polygon hole[0]",
    ],
  ];
  for (const [name, callback, message] of invalids)
    TestValidator.predicate(
      `${name} is refused by its own diagnostic`,
      throwsError(callback, message),
    );
}
