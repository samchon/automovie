import {
  type AutoMovieSolidMeshConstraints,
  AutoMovieSolidMeshIncidence,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Original vertex identities with represented chart coordinates. */
type Vertex = [number, readonly [number, number]];

/**
 * Native halfedges retain branching vertices and periodic boundary components.
 *
 * Scenarios:
 * 1. A square with both diagonals split at their shared centre has four triangular
 *    left boundaries and one exterior boundary at three length units.
 * 2. A cylinder band with two meridians has two rectangular faces and two
 *    noncontractible exterior boundaries. Winding is distinct from closure.
 * 3. A dangling edge is retained in both directions, while an unsplit overlap,
 *    missing endpoint, invalid cover turn and nonfinite point fail explicitly.
 * 4. Inputs remain unchanged and repeated results do not borrow mutable arrays.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads original vertex IDs, directed incidence counts, cover lifts and winding from the internal walker; it does not infer production triangulation or face membership from those walks.
 * @evidence contracts/development/testing.md#independent-expectations Elementary planar geometry gives four area-4 triangles and one area-minus-16 exterior square; a 4-by-3 half-period band gives two area-12 rectangles and exterior windings plus/minus one. Every undirected edge contributes two incidences.
 * @evidence contracts/development/testing.md#distinguishing-cases Exercises degree four, disconnected exterior components, periodic identification, three units, a dangling branch, empty input, malformed subdivision and output ownership without removing an expected edge.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable synchronous CPU unit reached by --include construction_chart_incidence; starts no Human generation, host, renderer or process.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A square with both diagonals split at their shared centre has four triangular).
 */
export function test_construction_chart_incidence(): void {
  const failures: string[] = [];
  for (const scale of [0.001, 1, 1000]) {
    const square: Vertex[] = [
      [0, [0, 0]],
      [1, [4 * scale, 0]],
      [2, [4 * scale, 4 * scale]],
      [3, [0, 4 * scale]],
      [4, [2 * scale, 2 * scale]],
    ];
    const edges: AutoMovieSolidMeshConstraints.ISegment[] = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [0, 4],
      [1, 4],
      [2, 4],
      [3, 4],
    ].map(
      ([a, b]: number[]): AutoMovieSolidMeshConstraints.ISegment => ({
        a: a!,
        b: b!,
        turn: 0,
      }),
    );
    const made: AutoMovieSolidMeshIncidence.IWalk[] | string =
      AutoMovieSolidMeshIncidence.walks(new Map(square), edges);
    if (typeof made === "string") failures.push(`square ${scale}: ${made}`);
    else {
      const sizes: number[] = made
        .map(
          (walk: AutoMovieSolidMeshIncidence.IWalk): number =>
            walk.vertices.length,
        )
        .sort((a: number, b: number): number => a - b);
      if (
        sizes.join(",") !== "3,3,3,3,4" ||
        made.some(
          (walk: AutoMovieSolidMeshIncidence.IWalk): boolean =>
            walk.winding !== 0,
        )
      )
        failures.push(`square ${scale}: wrong boundary population`);
      for (const walk of made)
        check(
          failures,
          `square area ${scale}/${walk.vertices.length}`,
          area(walk, new Map(square)),
          (walk.vertices.length === 3 ? 4 : -16) * scale * scale,
        );
      incidence(failures, `square ${scale}`, made, edges.length);
    }
    const band: Vertex[] = [
      [0, [0, 0]],
      [1, [0, 3 * scale]],
      [2, [4 * scale, 0]],
      [3, [4 * scale, 3 * scale]],
    ];
    const rails: AutoMovieSolidMeshConstraints.ISegment[] = [
      { a: 0, b: 1, turn: 0 },
      { a: 1, b: 0, turn: 1 },
      { a: 2, b: 3, turn: 0 },
      { a: 3, b: 2, turn: 1 },
      { a: 0, b: 2, turn: 0 },
      { a: 1, b: 3, turn: 0 },
    ];
    const period: number = 6 * scale;
    const before: string = JSON.stringify({ band, rails });
    const wrapped: AutoMovieSolidMeshIncidence.IWalk[] | string =
      AutoMovieSolidMeshIncidence.walks(new Map(band), rails, period);
    if (typeof wrapped === "string") failures.push(`band ${scale}: ${wrapped}`);
    else {
      const winding: number[] = wrapped
        .map((walk: AutoMovieSolidMeshIncidence.IWalk): number => walk.winding)
        .sort((a: number, b: number): number => a - b);
      if (winding.join(",") !== "-1,0,0,1")
        failures.push(
          `band ${scale}: wrong winding population ${winding.join(",")}`,
        );
      for (const walk of wrapped)
        if (walk.winding === 0)
          check(
            failures,
            `band area ${scale}`,
            area(walk, new Map(band), period),
            12 * scale * scale,
          );
      incidence(failures, `band ${scale}`, wrapped, rails.length);
      const original: string = JSON.stringify(wrapped);
      wrapped[0]!.vertices.push(999);
      wrapped[0]!.lifts.push(999);
      const repeated: AutoMovieSolidMeshIncidence.IWalk[] | string =
        AutoMovieSolidMeshIncidence.walks(new Map(band), rails, period);
      if (JSON.stringify(repeated) !== original)
        failures.push(`band ${scale}: shared mutable output`);
    }
    if (JSON.stringify({ band, rails }) !== before)
      failures.push(`band ${scale}: input mutation`);
  }
  const line: Vertex[] = [
    [0, [0, 0]],
    [1, [1, 0]],
    [2, [2, 0]],
  ];
  const dangling: AutoMovieSolidMeshIncidence.IWalk[] | string =
    AutoMovieSolidMeshIncidence.walks(new Map(line), [{ a: 0, b: 1, turn: 0 }]);
  if (
    typeof dangling === "string" ||
    dangling.length !== 1 ||
    dangling[0]!.vertices.join(",") !== "0,1"
  )
    failures.push("dangling edge lost directed incidences");
  const empty: AutoMovieSolidMeshIncidence.IWalk[] | string =
    AutoMovieSolidMeshIncidence.walks(new Map(), []);
  if (typeof empty === "string" || empty.length !== 0)
    failures.push("empty graph did not remain empty");
  refuse(
    failures,
    "overlap",
    AutoMovieSolidMeshIncidence.walks(new Map(line), [
      { a: 0, b: 1, turn: 0 },
      { a: 0, b: 2, turn: 0 },
    ]),
    "split first",
  );
  refuse(
    failures,
    "missing",
    AutoMovieSolidMeshIncidence.walks(new Map(line.slice(0, 1)), [
      { a: 0, b: 1, turn: 0 },
    ]),
    "endpoints",
  );
  refuse(
    failures,
    "turn",
    AutoMovieSolidMeshIncidence.walks(
      new Map(line),
      [{ a: 0, b: 1, turn: 0.5 }],
      6,
    ),
    "turns",
  );
  refuse(
    failures,
    "nonfinite",
    AutoMovieSolidMeshIncidence.walks(new Map([[0, [NaN, 0]]]), []),
    "finite",
  );
  if (failures.length !== 0)
    throw new Error(`Chart incidence findings:\n${failures.join("\n")}`);
}

/** Ordinary signed shoelace area, used only for zero-winding finite elementary faces. */
function area(
  walk: AutoMovieSolidMeshIncidence.IWalk,
  points: ReadonlyMap<number, readonly [number, number]>,
  period: number = 0,
): number {
  let total: number = 0;
  for (let k: number = 0; k < walk.vertices.length; k++) {
    const next: number = (k + 1) % walk.vertices.length;
    const a: readonly [number, number] = points.get(walk.vertices[k]!)!;
    const b: readonly [number, number] = points.get(walk.vertices[next]!)!;
    total +=
      a[0] * (b[1] + walk.lifts[next]! * period) -
      b[0] * (a[1] + walk.lifts[k]! * period);
  }
  return total / 2;
}

/** Each input edge appears once in each direction, including noncontractible components. */
function incidence(
  failures: string[],
  label: string,
  walks: AutoMovieSolidMeshIncidence.IWalk[],
  edges: number,
): void {
  if (
    walks.reduce(
      (sum: number, walk: AutoMovieSolidMeshIncidence.IWalk): number =>
        sum + walk.vertices.length,
      0,
    ) !==
      2 * edges ||
    walks.some(
      (walk: AutoMovieSolidMeshIncidence.IWalk): boolean =>
        walk.vertices.length !== walk.lifts.length ||
        walk.lifts[0] !== 0 ||
        !walk.lifts.every(Number.isSafeInteger),
    )
  )
    failures.push(`${label}: invalid directed incidence count or cover`);
}

/** Finite independent area comparison with a unit-scaled arithmetic allowance. */
function check(
  failures: string[],
  label: string,
  actual: number,
  expected: number,
): void {
  try {
    TestValidator.predicate(
      label,
      nclose(
        actual,
        expected,
        128 * Number.EPSILON * Math.max(Math.abs(expected), Number.MIN_VALUE),
      ),
    );
  } catch {
    failures.push(`${label}: ${actual}, expected ${expected}`);
  }
}

/** Named failure rather than an implicitly discarded constraint. */
function refuse(
  failures: string[],
  label: string,
  result: AutoMovieSolidMeshIncidence.IWalk[] | string,
  expected: string,
): void {
  if (typeof result !== "string" || !result.includes(expected))
    failures.push(
      `${label}: expected ${expected}, received ${JSON.stringify(result)}`,
    );
}
