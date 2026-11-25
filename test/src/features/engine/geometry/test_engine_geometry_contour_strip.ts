import { tessellateAutoMovieContourStrip64 } from "@automovie/engine";
import type { IAutoMovieContourLoft64 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { contourStripOracle as O } from "../../internal/contourStripOracle";
import { throwsError } from "../../internal/throwsError";

type Observation = Omit<
  NonNullable<IAutoMovieContourLoft64.IResult["stripObservations"]>[number],
  "beforeMm" | "afterMm" | "group"
>;

/**
 * `tessellateAutoMovieContourStrip64(a, b, emit, identity?, observe?)` tiles
 * the strip between two contour boundaries with the fixed-seam path of least
 * unsigned area among those whose sheet incidence is admissible, qualifying it
 * by vertex identity.
 *
 * Oracle: `contourStripOracle.minimum` enumerates every elementary path (C(n +
 * m, n)) and keeps the admissible least area. Area tolerance 512 epsilon (n +
 * m) of the area.
 *
 * Scenarios:
 *
 * 1. Triangle/triangle, triangle/quadrilateral and quadrilateral/pentagon (20, 35
 *    and 126 paths, some refused by incidence), at scales 2^-12, 1 and 2^12, in
 *    either winding, the second boundary relabelled cyclically: the emitted n +
 *    m triangles attain the oracle's minimum with admissible incidence,
 *    qualified without timing; the area scales by the square; a rebuild emits
 *    the same point identities; inputs are unchanged.
 * 2. A square and a close, turned pentagon reach the optimum with an adjacent pair
 *    of opposing normals: valid, not a crease rule.
 * 3. Two triangles joined by a doubled slit (165 paths): qualified, admissible,
 *    the oracle's area.
 * 4. A boundary repeating a point at the same place: finite tiles remain, all of
 *    positive area, unqualified with a "zero-length physical edge" and a
 *    "Zero-area contour primitive count omitted" diagnostic.
 * 5. Empty, single, collinear and NaN boundaries, and a missing or contradictory
 *    identity ("identity"), refuse before emitting anything; unique declared
 *    identities keep the ordinary strip.
 */
export function test_engine_geometry_contour_strip(): void {
  const strip = (
    a: O.V[],
    b: O.V[],
    identity?: (p: O.V) => string | undefined,
  ) => {
    const tiles: O.Triangle[] = [];
    let record: Observation | undefined;
    tessellateAutoMovieContourStrip64(
      a,
      b,
      (p: O.V, q: O.V, r: O.V): void => {
        tiles.push([p, q, r]);
      },
      identity,
      (o: Observation): void => {
        record = o;
      },
    );
    return { tiles, record };
  };
  const near = (x: number, y: number, e: number): boolean =>
    Math.abs(x - y) <= e;

  // 1.
  for (const [n, m, height, count] of [
    [3, 3, 1, 20],
    [3, 4, 0.25, 35],
    [4, 5, 0.0001, 126],
  ] satisfies [number, number, number, number][])
    for (const scale of [2 ** -12, 1, 2 ** 12])
      for (const reversed of [false, true]) {
        const label: string = `${n}/${m}/${scale}/${reversed}`;
        // One doubled radius gives the seam a unique exterior.
        const a: O.V[] = O.polygon(n, 0, scale).map(
          (p: O.V, i: number): O.V => [p[0] * (i === 0 ? 2 : 1), p[1], p[2]],
        );
        const b: O.V[] = O.polygon(m, height * scale, scale, 0.07);
        if (reversed) {
          a.reverse();
          b.reverse();
        }
        b.push(...b.splice(0, 1));
        const before: string = JSON.stringify([a, b]);
        const expected = O.minimum(a, b);
        const unscaled = O.minimum(
          a.map((p: O.V): O.V => [p[0] / scale, p[1] / scale, p[2] / scale]),
          b.map((p: O.V): O.V => [p[0] / scale, p[1] / scale, p[2] / scale]),
        );
        const tolerance: number =
          expected.area * Number.EPSILON * 512 * (n + m);
        TestValidator.equals(`${label} paths`, expected.visited, count);
        TestValidator.predicate(
          `${label} incidence`,
          expected.admitted > 0 && expected.admitted < count,
        );
        TestValidator.predicate(
          `${label} scaling`,
          near(expected.area, unscaled.area * scale * scale, tolerance),
        );
        const { tiles, record } = strip(a, b);
        TestValidator.predicate(
          `${label} minimum`,
          near(O.area(tiles), expected.area, tolerance),
        );
        TestValidator.predicate(`${label} admissible`, O.admits(a, b, tiles));
        TestValidator.equals(`${label} count`, tiles.length, n + m);
        TestValidator.predicate(
          `${label} qualified`,
          record !== undefined && record.qualified && record.elapsedMs === null,
        );
        const again: O.Triangle[] = strip(a, b).tiles;
        TestValidator.predicate(
          `${label} identities`,
          again.length === tiles.length &&
            again.every((t: O.Triangle, i: number): boolean =>
              t.every((p: O.V, k: number): boolean => p === tiles[i]![k]),
            ),
        );
        TestValidator.equals(
          `${label} inputs kept`,
          JSON.stringify([a, b]),
          before,
        );
      }

  // 2.
  const square: O.V[] = O.polygon(4, 0);
  const turned: O.V[] = O.polygon(5, 0.0001, 1, 0.07);
  const close: O.Triangle[] = strip(square, turned).tiles;
  TestValidator.predicate(
    "opposing neighbours",
    O.admits(square, turned, close) &&
      close.some((first: O.Triangle, i: number): boolean =>
        close.slice(i + 1).some((second: O.Triangle): boolean => {
          if (
            first.filter((p: O.V): boolean => second.includes(p)).length !== 2
          )
            return false;
          const u: O.V = O.normal(first);
          const v: O.V = O.normal(second);
          return u[0] * v[0] + u[1] * v[1] + u[2] * v[2] < 0;
        }),
      ),
  );

  // 3.
  const left: O.V[] = O.polygon(3, 0, 0.5, 0.03, -2);
  const right: O.V[] = O.polygon(3, 0, 0.5, 0, 2);
  const branch: O.V[] = [...left, left[0]!, ...right, right[0]!];
  const upper: O.V[] = O.polygon(3, 2, 5);
  const optimum = O.minimum(branch, upper);
  const slit = strip(branch, upper);
  TestValidator.equals("slit paths", optimum.visited, 165);
  TestValidator.predicate(
    "slit qualified",
    slit.record !== undefined &&
      slit.record.qualified &&
      O.admits(branch, upper, slit.tiles),
  );
  TestValidator.predicate(
    "slit area",
    optimum.admitted > 0 &&
      near(
        O.area(slit.tiles),
        optimum.area,
        optimum.area * Number.EPSILON * 512 * 11,
      ),
  );

  // 4.
  const lower: O.V[] = O.polygon(3, 0);
  const top: O.V[] = O.polygon(3, 1);
  const collapsed: O.V[] = [lower[0]!, [...lower[0]!], ...lower.slice(1)];
  const partial = strip(collapsed, top);
  TestValidator.predicate(
    "finite tiles",
    partial.tiles.length > 0 &&
      partial.tiles.length < collapsed.length + top.length &&
      partial.tiles.every(
        (t: O.Triangle): boolean => Math.hypot(...O.normal(t)) > 0,
      ),
  );
  TestValidator.predicate(
    "unqualified",
    partial.record !== undefined &&
      !partial.record.qualified &&
      partial.record.diagnostics.some((r: string): boolean =>
        r.includes("zero-length physical edge"),
      ) &&
      partial.record.diagnostics.some((r: string): boolean =>
        r.includes("Zero-area contour primitive count omitted"),
      ),
  );

  // 5.
  const silent = (
    run: (emit: () => void) => void,
    message?: string,
  ): boolean => {
    let calls: number = 0;
    return (
      throwsError((): void => run((): void => void calls++), message) &&
      calls === 0
    );
  };
  for (const boundary of [
    [],
    [[0, 0, 0]],
    [
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
    ],
    [
      [NaN, 0, 0],
      [1, 0, 0],
      [0, 0, 1],
    ],
  ] satisfies O.V[][])
    TestValidator.predicate(
      `boundary ${boundary.length}`,
      silent((emit) => tessellateAutoMovieContourStrip64(boundary, top, emit)),
    );
  for (const identity of [
    (): undefined => undefined,
    (): string => "one-point",
  ])
    TestValidator.predicate(
      "identity refused",
      silent(
        (emit) => tessellateAutoMovieContourStrip64(lower, top, emit, identity),
        "identity",
      ),
    );
  const points: O.V[] = [...lower, ...top];
  TestValidator.predicate(
    "unique identities",
    O.admits(
      lower,
      top,
      strip(lower, top, (p: O.V): string => `sheet:${points.indexOf(p)}`).tiles,
    ),
  );
}
