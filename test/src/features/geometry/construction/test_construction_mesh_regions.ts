import {
  AutoMovieSolidMesh,
  type IAutoMovieSolidSurface,
} from "@automovie/engine";

import { HumanSolidShapes } from "../../internal/HumanSolidShapes";

/** A rectangle in the independent chart oracle. */
type Rectangle = readonly [number, number, number, number];

/** One chart-space case, with its independently prescribed area and exposed rail edges. */
interface Case {
  /** Address printed with every finding. */
  name: string;

  /** Whether the chart wraps once in its second coordinate. */
  periodic: boolean;

  /** Regular sampling coordinates; their density does not change the region. */
  stations: number[];

  /** Each polygon's kept side and its prescribed chart points. */
  loops: {
    kind: AutoMovieSolidMesh.ILoop["kind"];
    points: [number, number][];
    exposed?: number[];
  }[];

  /** Independent analytic region, separate from mesher kept-side classification. */
  contains: (u: number, v: number) => boolean;

  /** Chart area from elementary rectangle and trapezoid geometry. */
  area: number;
}

/**
 * A final face triangulation covers its prescribed chart region once and retains
 * every exposed boundary index. The rectangle and cylinder cases exercise the
 * topology independently of any person, join solver or loft interpolation.
 *
 * Scenarios:
 * 1. An uncut square, a collinearly subdivided square hole, nested redundant holes,
 *    an island with a hole, an island with no kept grid cells and a fully cut face.
 * 2. Holes meeting a domain edge, subdividing that edge between grid vertices,
 *    and sharing a domain corner, without changing their elementary areas.
 * 3. Periodic start/end rails with different column counts, an empty-grid band,
 *    a phase-seam hole and the same hole translated by three phase periods.
 * 4. A clipped winding end whose dent and extra column subdivide the blend's
 *    domain boundary, as a second merge does, with its trapezoidal chart area.
 * 5. Each triangle's centroid and three positive barycentric probes must lie in
 *    the independently authored analytic region. Output also has positive chart area, exact edge pairing,
 *    unchanged exposed rail indices and the analytic plane/cylinder coordinates.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls AutoMovieSolidMesh.face on independently specified planar and periodic charts and reads only emitted indices, owner coordinates and returned boundaries. It detects missing or overlapping regions, inverted faces, opened shared seams and omitted collinear boundary vertices.
 * @evidence contracts/development/testing.md#independent-expectations Areas are sums and differences of prescribed rectangles or trapezoids in the input chart. An oriented triangulation uses each interior edge once in each direction and each exposed boundary once. The plane and unit cylinder provide independent coordinate and outward-normal oracles; no join, loft, mesher predicate or triangulator computes the expected region.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes empty interiors, fully removed regions, redundant nested holes, boundary contacts and subdivisions, distinct periodic rail populations, seam translation and a clipped winding boundary. Real merge closure and sphere winding remain owned by operator_body and level_winding; caps and generating surfaces remain owned by view_pole and operator_mesh.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by --include construction_mesh_regions. It generates no person and starts no renderer, host or process.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: An uncut square, a collinearly subdivided square hole, nested redundant holes,).
 */
export function test_construction_mesh_regions(): void {
  const failures: string[] = [];
  const grid: number[] = [0, 1, 2, 3, 4];
  const turn: number = 2 * Math.PI;
  const phases: number[] = Array.from(
    { length: 16 },
    (_: unknown, k: number): number => (turn * k) / 16,
  );
  const rail: (u: number, count: number) => [number, number][] = (
    u: number,
    count: number,
  ): [number, number][] =>
    Array.from({ length: count }, (_: unknown, k: number): [number, number] => [
      u,
      (turn * k) / count,
    ]);
  const hole: Rectangle = [1, 1, 3, 3];
  const square: (r: Rectangle) => [number, number][] = (
    r: Rectangle,
  ): [number, number][] => rectangle(r);
  const clipped: [number, number][] = rail(4, 16);
  clipped[0] = [2, 0];
  clipped.splice(1, 0, [3, turn / 32]);
  const cases: Case[] = [
    {
      name: "uncut square",
      contains: (u: number, v: number): boolean => inside([0, 0, 4, 4], u, v),
      periodic: false,
      stations: grid,
      loops: [],
      area: 16,
    },
    {
      name: "collinear shared hole",
      contains: (u: number, v: number): boolean =>
        inside([0, 0, 4, 4], u, v) && !inside(hole, u, v),
      periodic: false,
      stations: grid,
      loops: [{ kind: "hole", points: square(hole) }],
      area: 12,
    },
    {
      name: "nested redundant holes",
      contains: (u: number, v: number): boolean =>
        inside([0, 0, 4, 4], u, v) && !inside(hole, u, v),
      periodic: false,
      stations: grid,
      loops: [
        { kind: "hole", points: square(hole) },
        { kind: "hole", points: square([1.5, 1.5, 2.5, 2.5]), exposed: [] },
      ],
      area: 12,
    },
    {
      name: "island and hole",
      contains: (u: number, v: number): boolean =>
        inside([0.5, 0.5, 3.5, 3.5], u, v) &&
        !inside([1.5, 1.5, 2.5, 2.5], u, v),
      periodic: false,
      stations: grid,
      loops: [
        { kind: "island", points: square([0.5, 0.5, 3.5, 3.5]) },
        { kind: "hole", points: square([1.5, 1.5, 2.5, 2.5]) },
      ],
      area: 8,
    },
    {
      name: "empty kept grid",
      contains: (u: number, v: number): boolean => inside([1, 1, 3, 3], u, v),
      periodic: false,
      stations: [0, 4],
      loops: [{ kind: "island", points: square([1, 1, 3, 3]) }],
      area: 4,
    },
    {
      name: "hole inside one coarse cell",
      contains: (u: number, v: number): boolean =>
        inside([0, 0, 4, 4], u, v) && !inside([1.8, 1.8, 2.2, 2.2], u, v),
      periodic: false,
      stations: [0, 4],
      loops: [{ kind: "hole", points: square([1.8, 1.8, 2.2, 2.2]) }],
      area: 16 - 0.16,
    },
    {
      name: "entire face cut",
      contains: (_u: number, _v: number): boolean => false,
      periodic: false,
      stations: grid,
      loops: [{ kind: "hole", points: square([0, 0, 4, 4]), exposed: [] }],
      area: 0,
    },
    {
      name: "domain edge contact",
      contains: (u: number, v: number): boolean =>
        inside([0, 0, 4, 4], u, v) && !inside([0, 1, 2, 3], u, v),
      periodic: false,
      stations: grid,
      loops: [
        {
          kind: "hole",
          points: square([0, 1, 2, 3]),
          exposed: [0, 1, 2, 3, 4, 5],
        },
      ],
      area: 12,
    },
    {
      name: "subdivided domain contact",
      contains: (u: number, v: number): boolean =>
        inside([0, 0, 4, 4], u, v) && !inside([0, 1.5, 2, 2.5], u, v),
      periodic: false,
      stations: grid,
      loops: [
        {
          kind: "hole",
          points: square([0, 1.5, 2, 2.5]),
          exposed: [0, 1, 2, 3, 4, 5],
        },
      ],
      area: 14,
    },
    {
      name: "domain corner contact",
      contains: (u: number, v: number): boolean =>
        inside([0, 0, 4, 4], u, v) && !inside([0, 0, 2, 2], u, v),
      periodic: false,
      stations: grid,
      loops: [
        { kind: "hole", points: square([0, 0, 2, 2]), exposed: [2, 3, 4, 5] },
      ],
      area: 12,
    },
    {
      name: "periodic rails subdivide domain",
      contains: (u: number, _v: number): boolean => u > 0 && u < 4,
      periodic: true,
      stations: grid,
      loops: [
        { kind: "start", points: rail(0, 24) },
        { kind: "end", points: rail(4, 20) },
      ],
      area: 4 * turn,
    },
    {
      name: "periodic empty grid band",
      contains: (u: number, _v: number): boolean => u > 1 && u < 3,
      periodic: true,
      stations: [0, 4],
      loops: [
        { kind: "start", points: rail(1, 24) },
        { kind: "end", points: rail(3, 20) },
      ],
      area: 2 * turn,
    },
    {
      name: "periodic seam hole",
      contains: (u: number, v: number): boolean =>
        u > 0 &&
        u < 4 &&
        !(u > 1 && u < 3 && Math.abs(v - turn * Math.round(v / turn)) < 0.3),
      periodic: true,
      stations: grid,
      loops: [{ kind: "hole", points: square([1, -0.3, 3, 0.3]) }],
      area: 4 * turn - 1.2,
    },
    {
      name: "translated periodic seam hole",
      contains: (u: number, v: number): boolean =>
        u > 0 &&
        u < 4 &&
        !(u > 1 && u < 3 && Math.abs(v - turn * Math.round(v / turn)) < 0.3),
      periodic: true,
      stations: grid,
      loops: [
        {
          kind: "hole",
          points: square([1, 3 * turn - 0.3, 3, 3 * turn + 0.3]),
        },
      ],
      area: 4 * turn - 1.2,
    },
    {
      name: "clipped winding end",
      contains: (u: number, v: number): boolean =>
        u > 0 &&
        u <
          4 -
            Math.max(
              0,
              2 - (32 * Math.abs(v - turn * Math.round(v / turn))) / turn,
            ),
      periodic: true,
      stations: grid,
      loops: [
        { kind: "start", points: rail(0, 24) },
        { kind: "end", points: clipped },
      ],
      area: 4 * turn - turn / 8,
    },
  ];
  for (const input of cases)
    inspect(input, input.periodic ? phases : input.stations, failures);
  if (failures.length > 0)
    throw new Error(
      `${failures.length} chart region failures:\n${failures.join("\n")}`,
    );
}

/** Strict analytic rectangle membership, independent of the production parity reader. */
function inside(box: Rectangle, u: number, v: number): boolean {
  return u > box[0] && u < box[2] && v > box[1] && v < box[3];
}

/** Eight boundary points, retaining one collinear subdivision on each rectangle side. */
function rectangle([x0, y0, x1, y1]: Rectangle): [number, number][] {
  return [
    [x0, y0],
    [(x0 + x1) / 2, y0],
    [x1, y0],
    [x1, (y0 + y1) / 2],
    [x1, y1],
    [(x0 + x1) / 2, y1],
    [x0, y1],
    [x0, (y0 + y1) / 2],
  ];
}

/** Inspect all findings of one analytic chart before the caller fails the round. */
function inspect(input: Case, phases: number[], failures: string[]): void {
  const mesh: AutoMovieSolidMesh.IMesh = AutoMovieSolidMesh.create();
  const surface: IAutoMovieSolidSurface = input.periodic
    ? HumanSolidShapes.cylinder(
        input.name,
        [0, 0, 0],
        [0, 0, 1],
        [1, 0, 0],
        [0, 1, 0],
        1,
      )
    : HumanSolidShapes.plane(
        input.name,
        [0, 0, 0],
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      );
  const owner: number = AutoMovieSolidMesh.owner(mesh, surface);
  const loops: AutoMovieSolidMesh.ILoop[] = input.loops.map(
    (loop: Case["loops"][number]): AutoMovieSolidMesh.ILoop => ({
      kind: loop.kind,
      chart: loop.points,
      vertices: loop.points.map(([u, v]: [number, number]): number =>
        AutoMovieSolidMesh.vertex(
          mesh,
          input.periodic ? [Math.cos(v), Math.sin(v), u] : [u, v, 0],
          owner,
          u,
          v,
        ),
      ),
    }),
  );
  const report: (finding: string) => void = (finding: string): void => {
    failures.push(`${input.name}: ${finding}`);
  };
  try {
    AutoMovieSolidMesh.face(mesh, {
      surface,
      stations: input.stations,
      phases,
      loops,
    });
  } catch (error) {
    report(`face throws ${String(error)}`);
    return;
  }
  const uses: Map<string, number> = new Map();
  const referenced: Set<number> = new Set(mesh.indices);
  for (const id of referenced) {
    const u: number = mesh.coordinates[3 * id + 1]!;
    const v: number = mesh.coordinates[3 * id + 2]!;
    const expected: number[] = input.periodic
      ? [Math.cos(v), Math.sin(v), u]
      : [u, v, 0];
    const error: number = Math.hypot(
      ...expected.map(
        (x: number, k: number): number => x - mesh.positions[3 * id + k]!,
      ),
    );
    const allowance: number =
      64 * Number.EPSILON * Math.max(1, ...expected.map(Math.abs));
    if (!(error <= allowance))
      report(`vertex ${id} is ${error} from its analytic chart point`);
  }
  let area: number = 0;
  for (let t: number = 0; t < mesh.indices.length; t += 3) {
    const ids: number[] = mesh.indices.slice(t, t + 3);
    const chart: [number, number][] = ids.map(
      (id: number): [number, number] => [
        mesh.coordinates[3 * id + 1]!,
        mesh.coordinates[3 * id + 2]!,
      ],
    );
    if (input.periodic)
      for (let k: number = 1; k < 3; k++)
        chart[k]![1] +=
          2 *
          Math.PI *
          Math.round((chart[0]![1] - chart[k]![1]) / (2 * Math.PI));
    const a: [number, number] = chart[0]!;
    const b: [number, number] = chart[1]!;
    const c: [number, number] = chart[2]!;
    const signed: number =
      (surface.orientation *
        ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]))) /
      2;
    if (!(signed > 0))
      report(
        `triangle ${t / 3} has non-positive oriented chart area ${signed}; context ${JSON.stringify({ ids, unwrapped: chart, stored: ids.map((id: number): [number, number] => [mesh.coordinates[3 * id + 1]!, mesh.coordinates[3 * id + 2]!]) })}`,
      );
    area += signed;
    for (const weights of [
      [1 / 3, 1 / 3, 1 / 3],
      [0.6, 0.2, 0.2],
      [0.2, 0.6, 0.2],
      [0.2, 0.2, 0.6],
    ]) {
      const u: number =
        a[0] * weights[0]! + b[0] * weights[1]! + c[0] * weights[2]!;
      const v: number =
        a[1] * weights[0]! + b[1] * weights[1]! + c[1] * weights[2]!;
      if (!input.contains(u, v))
        report(
          `triangle ${t / 3} left its independent analytic region at ${u}/${v}`,
        );
    }
    for (let k: number = 0; k < 3; k++) {
      const key: string = `${ids[k]},${ids[(k + 1) % 3]}`;
      uses.set(key, (uses.get(key) ?? 0) + 1);
    }
  }
  const tolerance: number =
    64 *
    Number.EPSILON *
    Math.max(1, input.area) *
    Math.max(1, mesh.indices.length);
  if (Math.abs(area - input.area) > tolerance)
    report(
      `chart area ${area}, expected ${input.area} within summation allowance ${tolerance}`,
    );
  loops.forEach((loop: AutoMovieSolidMesh.ILoop, at: number): void => {
    const exposed: number[] =
      input.loops[at]!.exposed ??
      loop.vertices.map((_: number, k: number): number => k);
    for (const k of exposed) {
      const a: number = loop.vertices[k]!;
      const b: number = loop.vertices[(k + 1) % loop.vertices.length]!;
      const count: number =
        (uses.get(`${a},${b}`) ?? 0) + (uses.get(`${b},${a}`) ?? 0);
      if (count !== 1)
        report(
          `shared rail ${at} edge ${k} uses its original indices ${count} times, expected once`,
        );
    }
  });
  for (const [key, count] of uses) {
    const [a, b]: number[] = key.split(",").map(Number);
    const reverse: number = uses.get(`${b},${a}`) ?? 0;
    if (count !== 1 || reverse > 1)
      report(`edge ${key} has ${count} forward and ${reverse} reverse uses`);
    if (reverse === 0 && !boundary(a!, b!, mesh, loops, input.periodic))
      report(`edge ${key} is open inside the chart`);
  }
}

/** Whether an edge is an authored rail or one of the independent rectangular domain sides. */
function boundary(
  a: number,
  b: number,
  mesh: AutoMovieSolidMesh.IMesh,
  loops: AutoMovieSolidMesh.ILoop[],
  periodic: boolean,
): boolean {
  for (const loop of loops)
    for (let k: number = 0; k < loop.vertices.length; k++)
      if (
        (loop.vertices[k] === a &&
          loop.vertices[(k + 1) % loop.vertices.length] === b) ||
        (loop.vertices[k] === b &&
          loop.vertices[(k + 1) % loop.vertices.length] === a)
      )
        return true;
  const u: number = mesh.coordinates[3 * a + 1]!;
  const x: number = mesh.coordinates[3 * b + 1]!;
  if (u === x && (u === 0 || u === 4)) return true;
  const v: number = mesh.coordinates[3 * a + 2]!;
  const y: number = mesh.coordinates[3 * b + 2]!;
  return !periodic && v === y && (v === 0 || v === 4);
}
