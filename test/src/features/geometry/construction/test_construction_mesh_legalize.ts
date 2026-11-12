import {
  AutoMovieSolidMesh,
  type IAutoMovieSolidSurface,
  incircleAutoMovieSolidChart,
} from "@automovie/engine";

/** One chart point. */
type Chart = [number, number];

/** One trimmed face, its analytic surface and its independent expectations. */
interface Case {
  /** Address printed with every finding. */
  name: string;

  /** The analytic surface, with its outward orientation sign. */
  surface: IAutoMovieSolidSurface;

  /** Grid stations. */
  stations: number[];

  /** Grid phases. */
  phases: number[];

  /** Trim loops and their chart points. */
  loops: { kind: AutoMovieSolidMesh.ILoop["kind"]; points: Chart[] }[];

  /** Chart area of the kept region, from elementary polygon areas. */
  area: number;

  /** The analytic first fundamental form's `E` and `G` at a chart point. */
  form: (u: number, v: number) => [number, number];

  /** Whether a chart edge lies on a domain side, so it has one triangle. */
  side: (a: Chart, b: Chart) => boolean;
}

/**
 * A trimmed face's residual triangulation is constrained Delaunay in the face's
 * local metric, so a dense trim rail never keeps triangles of its own vertices
 * and a face whose phase scale changes across it keeps no triangle that is fair
 * only in its mean metric.
 *
 * Scenarios:
 * 1. Sheared plane: the plane `(u, v + c u^2, 0)` with `c = -0.05` (Jacobian
 *    determinant 1, outward +Z) over `[0, 4]^2`, holed by a box whose top side
 *    is a dense 64-segment smile `v = 2.5 - 0.02 sin(pi (u - 1) / 2)`. The
 *    smile is convex toward the face in the chart (`v''` from 0 to 0.049) and
 *    concave in the world (`v'' + 2c` at most -0.05), so a triangle of three
 *    rail vertices is chart-positive and faces against +Z. No emitted triangle
 *    may face inward.
 * 2. Anisotropic cylinder: radius 50 mm, so one phase radian is 50 mm of skin
 *    against 1 mm per station, with a 24-point start rail at `u = 0` and a
 *    192-point wavy end rail `u = 80 + 6 sin 3v`. The metric scale is
 *    `sqrt(G / E) = 50` everywhere.
 * 3. Flared tube: the same rails on a tube whose radius grows from 20 mm at the
 *    start rail to 120 mm, so the phase scale runs from 14 to 85 mm a radian
 *    against the face's mean of 54, the trunk's case beside the armscye's loop, where
 *    the skin spans twice its face's mean. Legalized in the mean metric, edges
 *    near the end rail are not locally Delaunay in their own.
 * 4. All three: every interior edge off the rails and grid lines is locally
 *    Delaunay in the chart with phase scaled by the local scale at its
 *    quadrilateral's centroid, `sqrt(G / E)` from the means of the analytic `E`
 *    and `G` at the cell's four grid corners; every rail edge is used once and
 *    every interior edge once each way; the chart area equals the elementary
 *    polygon area; a second identical face emits the same indices.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls AutoMovieSolidMesh.face on three analytic charts and reads only emitted indices, positions and owner coordinates: world normals against the analytic outward normal, chart in-circle signs over shared edges, rail-edge use, chart area and repeated output.
 * @evidence contracts/development/testing.md#independent-expectations The sheared plane's world-inverted rail triangles follow from the smile's two curvatures, `v''` against `v'' + 2c`; the scales follow from the analytic `E` and `G` at the grid corners (plane `E = 1 + 4 c^2 u^2` against `G` 1, cylinder `G` 2500 against `E` 1, flared tube `G = (20 + u)^2` against `E` 2); areas are the domain minus the hole's shoelace area and the trapezoids under the wavy rail; the in-circle determinant is evaluated here in floating point, not by the engine predicate.
 * @evidence contracts/development/testing.md#distinguishing-cases A planar hole whose rail is convex in the chart but concave in the world, a periodic winding rail on a chart 50 times longer in phase and the same rail on a chart whose phase scale grows sixfold along it separate a chart-only ear triangulation, an unscaled Delaunay, a Delaunay in the face's mean metric and a legalization that flips a rail edge.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by --include construction_mesh_legalize. It generates no person and starts no renderer, host or process.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Sheared plane: the plane `(u, v + c u^2, 0)` with `c = -0.05` (Jacobian).
 */
export function test_construction_mesh_legalize(): void {
  const failures: string[] = [];
  for (const input of [plane(), cylinder(), flare()]) inspect(input, failures);
  exactness(failures);
  if (failures.length > 0)
    throw new Error(
      `${failures.length} legalization failures:\n${failures.join("\n")}`,
    );
}

/** Scenario 1: the sheared plane with a smile-topped hole. */
function plane(): Case {
  const c: number = -0.05;
  const surface: IAutoMovieSolidSurface = {
    name: "sheared plane",
    orientation: 1,
    jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => ({
      p: [u, v + c * u * u, 0],
      u: [1, 2 * c * u, 0],
      v: [0, 1, 0],
      uu: [0, 2 * c, 0],
      uv: [0, 0, 0],
      vv: [0, 0, 0],
    }),
  };
  const smile: Chart[] = Array.from(
    { length: 63 },
    (_: unknown, k: number): Chart => {
      const u: number = 3 - (2 * (k + 1)) / 64;
      return [u, 2.5 - 0.02 * Math.sin((Math.PI * (u - 1)) / 2)];
    },
  );
  const hole: Chart[] = [
    [1, 1.5],
    [2, 1.5],
    [3, 1.5],
    [3, 2],
    [3, 2.5],
    ...smile,
    [1, 2.5],
    [1, 2],
  ];
  const grid: number[] = [0, 1, 2, 3, 4];
  return {
    name: "sheared plane",
    surface,
    stations: grid,
    phases: grid,
    loops: [{ kind: "hole", points: hole }],
    area: 16 - Math.abs(shoelace(hole)),
    // E = 1 + 4 c^2 u^2 (1 to 1.16 over the grid) and G = 1.
    form: (u: number): [number, number] => [1 + 4 * c * c * u * u, 1],
    side: (a: Chart, b: Chart): boolean =>
      (a[0] === b[0] && (a[0] === 0 || a[0] === 4)) ||
      (a[1] === b[1] && (a[1] === 0 || a[1] === 4)),
  };
}

/** Scenario 2: the radius-50 cylinder with a wavy end rail. */
function cylinder(): Case {
  const R: number = 50;
  const turn: number = 2 * Math.PI;
  const surface: IAutoMovieSolidSurface = {
    name: "anisotropic cylinder",
    period: turn,
    // S_u x S_v = (-R cos v, -R sin v, 0) points into the axis.
    orientation: -1,
    jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => ({
      p: [R * Math.cos(v), R * Math.sin(v), u],
      u: [0, 0, 1],
      v: [-R * Math.sin(v), R * Math.cos(v), 0],
      uu: [0, 0, 0],
      uv: [0, 0, 0],
      vv: [-R * Math.cos(v), -R * Math.sin(v), 0],
    }),
  };
  const start: Chart[] = Array.from(
    { length: 24 },
    (_: unknown, k: number): Chart => [0, (turn * k) / 24],
  );
  const end: Chart[] = Array.from(
    { length: 192 },
    (_: unknown, k: number): Chart => {
      const v: number = (turn * k) / 192;
      return [80 + 6 * Math.sin(3 * v), v];
    },
  );
  // The kept band's chart area: the trapezoids under the end rail's polyline, closed over one period.
  let area: number = 0;
  for (let k: number = 0; k < end.length; k++) {
    const a: Chart = end[k]!;
    const b: Chart = end[(k + 1) % end.length]!;
    area += ((a[0] + b[0]) / 2) * (turn / 192);
  }
  return {
    name: "anisotropic cylinder",
    surface,
    stations: Array.from(
      { length: 11 },
      (_: unknown, k: number): number => 10 * k,
    ),
    phases: Array.from(
      { length: 32 },
      (_: unknown, k: number): number => (turn * k) / 32,
    ),
    loops: [
      { kind: "start", points: start },
      { kind: "end", points: end },
    ],
    area,
    // E = 1 and G = R^2 = 2500, so sqrt(G / E) = 50 mm of skin per radian everywhere.
    form: (): [number, number] => [1, R * R],
    side: (): boolean => false,
  };
}

/** Scenario 3: a flared tube whose radius grows from 20 to 120 mm along 100 stations, with the wavy end rail of scenario 2. */
function flare(): Case {
  const turn: number = 2 * Math.PI;
  // R(u) = 20 + u, so R' = 1, E = 1 + R'^2 = 2 and G = R^2.
  const radius = (u: number): number => 20 + u;
  const surface: IAutoMovieSolidSurface = {
    name: "flared tube",
    period: turn,
    // S_u x S_v = (-R cos v, -R sin v, R R') points into the axis.
    orientation: -1,
    jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => {
      const R: number = radius(u);
      return {
        p: [R * Math.cos(v), R * Math.sin(v), u],
        u: [Math.cos(v), Math.sin(v), 1],
        v: [-R * Math.sin(v), R * Math.cos(v), 0],
        uu: [0, 0, 0],
        uv: [-Math.sin(v), Math.cos(v), 0],
        vv: [-R * Math.cos(v), -R * Math.sin(v), 0],
      };
    },
  };
  const base: Case = cylinder();
  return {
    ...base,
    name: "flared tube",
    surface,
    form: (u: number): [number, number] => [2, radius(u) ** 2],
  };
}

/**
 * The face's phase scale at a chart point, as residual legalization reads it: `sqrt(G / E)` from the means of the analytic `E` and `G`
 * over the four grid corners of the cell holding the point.
 */
function local(input: Case, u: number, v: number): number {
  const period: number | undefined = input.surface.period;
  const below = (values: number[], x: number): number => {
    let k: number = 0;
    while (k + 2 < values.length && x >= values[k + 1]!) ++k;
    return k;
  };
  const i: number = below(input.stations, u);
  const phase: number =
    period === undefined
      ? v
      : v - period * Math.floor((v - input.phases[0]!) / period);
  const last: number = input.phases.length - 1;
  const j: number =
    period !== undefined && phase >= input.phases[last]!
      ? last
      : below(input.phases, phase);
  const k: number = period === undefined ? Math.min(j + 1, last) : (j + 1) % input.phases.length;
  let e: number = 0;
  let g: number = 0;
  for (const [s, t] of [
    [input.stations[i]!, input.phases[j]!],
    [input.stations[i]!, input.phases[k]!],
    [input.stations[i + 1]!, input.phases[j]!],
    [input.stations[i + 1]!, input.phases[k]!],
  ] as [number, number][]) {
    const [E, G] = input.form(s, t);
    e += E;
    g += G;
  }
  return Math.sqrt(g / e);
}

/** Build one face and record every finding. */
function inspect(input: Case, failures: string[]): void {
  const report = (finding: string): void => {
    failures.push(`${input.name}: ${finding}`);
  };
  const first: AutoMovieSolidMesh.IMesh | string = build(input);
  const second: AutoMovieSolidMesh.IMesh | string = build(input);
  if (typeof first === "string") return report(first);
  if (typeof second === "string") return report(`repeat: ${second}`);
  if (JSON.stringify(first.indices) !== JSON.stringify(second.indices))
    report("a second identical face emitted different indices");
  const mesh: AutoMovieSolidMesh.IMesh = first;
  const period: number | undefined = input.surface.period;
  const chart = (id: number): Chart => [
    mesh.coordinates[3 * id + 1]!,
    mesh.coordinates[3 * id + 2]!,
  ];
  const near = (value: number, anchor: number): number =>
    period === undefined
      ? value
      : value + period * Math.round((anchor - value) / period);
  const position = (id: number): number[] => [
    mesh.positions[3 * id]!,
    mesh.positions[3 * id + 1]!,
    mesh.positions[3 * id + 2]!,
  ];

  // Orientation in the world and in the chart, and the chart area.
  const directed: Map<string, number> = new Map();
  let area: number = 0;
  let inverted: number = 0;
  const examples: string[] = [];
  for (let t: number = 0; t < mesh.indices.length; t += 3) {
    const ids: number[] = mesh.indices.slice(t, t + 3);
    const charts: Chart[] = ids.map(chart);
    for (let k: number = 1; k < 3; k++)
      charts[k]![1] = near(charts[k]![1], charts[0]![1]);
    const [a, b, c] = charts as [Chart, Chart, Chart];
    area +=
      (input.surface.orientation *
        ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]))) /
      2;
    const [p, q, r] = ids.map(position) as [number[], number[], number[]];
    const normal: number[] = cross(minus(q, p), minus(r, p));
    const jet: IAutoMovieSolidSurface.IJet = input.surface.jet(
      (a[0] + b[0] + c[0]) / 3,
      (a[1] + b[1] + c[1]) / 3,
    );
    const outward: number[] = cross(jet.u, jet.v).map(
      (x: number): number => x * input.surface.orientation,
    );
    if (!(dot(normal, outward) > 0)) {
      ++inverted;
      if (examples.length < 4)
        examples.push(JSON.stringify({ ids, chart: charts }));
    }
    for (let k: number = 0; k < 3; k++) {
      const key: string = `${ids[k]},${ids[(k + 1) % 3]}`;
      directed.set(key, (directed.get(key) ?? 0) + 1);
    }
  }
  if (inverted !== 0)
    report(
      `${inverted} of ${mesh.indices.length / 3} triangles face against the outward normal, e.g. ${examples.join("; ")}`,
    );
  const allowance: number = 1e-9 * Math.max(1, input.area);
  if (!(Math.abs(area - input.area) <= allowance))
    report(`chart area ${area}, expected ${input.area}`);

  // Rails: every loop edge once; every other edge once each way unless it lies on a domain side.
  const rails: Set<string> = new Set();
  for (const loop of loops(input))
    for (let k: number = 0; k < loop.length; k++) {
      const a: number = loop[k]!;
      const b: number = loop[(k + 1) % loop.length]!;
      rails.add(`${Math.min(a, b)},${Math.max(a, b)}`);
      const uses: number =
        (directed.get(`${a},${b}`) ?? 0) + (directed.get(`${b},${a}`) ?? 0);
      if (uses !== 1)
        report(`rail edge ${a}-${b} is used ${uses} times, expected once`);
    }
  for (const [key, count] of directed) {
    const [a, b] = key.split(",").map(Number) as [number, number];
    const reverse: number = directed.get(`${b},${a}`) ?? 0;
    if (count !== 1 || reverse > 1)
      report(`edge ${key} has ${count} forward and ${reverse} reverse uses`);
    if (
      reverse === 0 &&
      !rails.has(`${Math.min(a, b)},${Math.max(a, b)}`) &&
      !input.side(chart(a), chart(b))
    )
      report(`edge ${key} is open inside the chart`);
  }

  // Local Delaunay in the scaled chart over every shared edge off the rails and grid lines.
  const opposite: Map<string, number> = new Map();
  for (let t: number = 0; t < mesh.indices.length; t += 3)
    for (let k: number = 0; k < 3; k++)
      opposite.set(
        `${mesh.indices[t + k]},${mesh.indices[t + ((k + 1) % 3)]}`,
        mesh.indices[t + ((k + 2) % 3)]!,
      );
  const grid = (p: Chart): boolean =>
    input.stations.includes(p[0]) && input.phases.includes(p[1]);
  let violations: number = 0;
  const worst: string[] = [];
  for (const [key, d] of opposite) {
    const [a, b] = key.split(",").map(Number) as [number, number];
    if (!(a < b)) continue;
    const c: number | undefined = opposite.get(`${b},${a}`);
    if (c === undefined || rails.has(`${a},${b}`)) continue;
    const A: Chart = chart(a);
    const B: Chart = chart(b);
    if (grid(A) && grid(B) && (A[0] === B[0] || A[1] === B[1])) continue;
    const corners: Chart[] = [A, B, chart(d), chart(c)].map(
      (p: Chart): Chart => [p[0], near(p[1], A[1])],
    );
    const scale: number = local(
      input,
      corners.reduce((s: number, p: Chart): number => s + p[0], 0) / 4,
      corners.reduce((s: number, p: Chart): number => s + p[1], 0) / 4,
    );
    const points: Chart[] = corners.map(
      (p: Chart): Chart => [p[0], p[1] * scale],
    );
    // (a, b, d) is positive in the face's chart order; c is the far vertex across a-b.
    const [P, Q, S, T] = (
      input.surface.orientation > 0
        ? points
        : [points[1]!, points[0]!, points[2]!, points[3]!]
    ) as [Chart, Chart, Chart, Chart];
    const value: number = incircle(P, Q, S, T);
    if (value > 1e-9) {
      ++violations;
      if (worst.length < 4)
        worst.push(
          `${a}-${b} (opposite ${d}, ${c}): normalized in-circle ${value}`,
        );
    }
  }
  if (violations !== 0)
    report(
      `${violations} shared edges are not locally Delaunay in the scaled chart, e.g. ${worst.join("; ")}`,
    );
}

/** One face on a fresh mesh, or the thrown planning refusal. */
function build(input: Case): AutoMovieSolidMesh.IMesh | string {
  const mesh: AutoMovieSolidMesh.IMesh = AutoMovieSolidMesh.create();
  const owner: number = AutoMovieSolidMesh.owner(mesh, input.surface);
  const made: AutoMovieSolidMesh.ILoop[] = input.loops.map(
    (loop: Case["loops"][number]): AutoMovieSolidMesh.ILoop => ({
      kind: loop.kind,
      chart: loop.points,
      vertices: loop.points.map(([u, v]: Chart): number =>
        AutoMovieSolidMesh.vertex(mesh, input.surface.jet(u, v).p, owner, u, v),
      ),
    }),
  );
  try {
    AutoMovieSolidMesh.face(mesh, {
      surface: input.surface,
      stations: input.stations,
      phases: input.phases,
      loops: made,
    });
  } catch (error) {
    return `face throws ${String(error)}`;
  }
  return mesh;
}

/** The loops' vertex indices, which `build` assigns first and in loop order. */
function loops(input: Case): number[][] {
  let next: number = 0;
  return input.loops.map((loop: Case["loops"][number]): number[] =>
    loop.points.map((): number => next++),
  );
}

/**
 * Scenario 5: the legalization's in-circle sign is exact on represented
 * points. The unit circle through `(-1, 0)`, `(1, 0)` and `(0, 1)` is
 * tested at the 17 by 17 points `(i u, -1 + j u)` around its lowest point,
 * `u = 2^-52` and `i, j` in -8..8: every coordinate is a multiple of `u`
 * below 2 in magnitude, so the expected sign is the integer determinant of
 * the coordinates times 2^52 in BigInt. Off the circle by as little as
 * `i^2 u^2` (2^-104), most of these lie far below the floating
 * determinant's rounding (near 2^-50 for terms near 8), and the test records
 * that the floating determinant misreads some of them.
 */
function exactness(failures: string[]): void {
  const u: number = 2 ** -52;
  const circle: [Chart, Chart, Chart] = [
    [-1, 0],
    [1, 0],
    [0, 1],
  ];
  let naiveWrong: number = 0;
  for (let i: number = -8; i <= 8; ++i)
    for (let j: number = -8; j <= 8; ++j) {
      const d: Chart = [i * u, -1 + j * u];
      const expected: number = exact(...circle, d);
      const got: number = incircleAutoMovieSolidChart(...circle, d);
      if (got !== expected)
        failures.push(
          `in-circle at ${JSON.stringify(d)}: ${got}, exact ${expected}`,
        );
      if (Math.sign(floating(...circle, d)) !== expected) ++naiveWrong;
    }
  if (naiveWrong === 0)
    failures.push(
      "exactness proof: the floating determinant resolved every case, so the cases do not test the exact path",
    );
}

/** Integer in-circle determinant sign of chart points that are multiples of 2^-52, read times 2^52. */
function exact(a: Chart, b: Chart, c: Chart, d: Chart): number {
  const scaled = (v: number): bigint => BigInt(v * 2 ** 52);
  const rows: bigint[][] = [a, b, c].map((p: Chart): bigint[] => {
    const x: bigint = scaled(p[0]) - scaled(d[0]);
    const y: bigint = scaled(p[1]) - scaled(d[1]);
    return [x, y, x * x + y * y];
  });
  const [p, q, r] = rows as [bigint[], bigint[], bigint[]];
  const det: bigint =
    p[0]! * (q[1]! * r[2]! - q[2]! * r[1]!) -
    p[1]! * (q[0]! * r[2]! - q[2]! * r[0]!) +
    p[2]! * (q[0]! * r[1]! - q[1]! * r[0]!);
  return det > 0n ? 1 : det < 0n ? -1 : 0;
}

/** The same determinant in binary64, unnormalized. */
function floating(a: Chart, b: Chart, c: Chart, d: Chart): number {
  const rows: number[][] = [a, b, c].map((p: Chart): number[] => {
    const x: number = p[0] - d[0];
    const y: number = p[1] - d[1];
    return [x, y, x * x + y * y];
  });
  const [p, q, r] = rows as [number[], number[], number[]];
  return (
    p[0]! * (q[1]! * r[2]! - q[2]! * r[1]!) -
    p[1]! * (q[0]! * r[2]! - q[2]! * r[0]!) +
    p[2]! * (q[0]! * r[1]! - q[1]! * r[0]!)
  );
}

/** In-circle determinant of `t` against the positive triangle `(p, q, s)`, normalized by the fourth power of the quad's extent: positive inside. */
function incircle(p: Chart, q: Chart, s: Chart, t: Chart): number {
  const rows: number[][] = [p, q, s].map((x: Chart): number[] => {
    const dx: number = x[0] - t[0];
    const dy: number = x[1] - t[1];
    return [dx, dy, dx * dx + dy * dy];
  });
  const [a, b, c] = rows as [number[], number[], number[]];
  const det: number =
    a[0]! * (b[1]! * c[2]! - b[2]! * c[1]!) -
    a[1]! * (b[0]! * c[2]! - b[2]! * c[0]!) +
    a[2]! * (b[0]! * c[1]! - b[1]! * c[0]!);
  const extent: number = Math.max(
    ...rows.flatMap((row: number[]): number[] => [
      Math.abs(row[0]!),
      Math.abs(row[1]!),
    ]),
  );
  return det / extent ** 4;
}

/** Shoelace signed area of a closed chart polygon. */
function shoelace(points: Chart[]): number {
  let sum: number = 0;
  for (let k: number = 0; k < points.length; k++) {
    const a: Chart = points[k]!;
    const b: Chart = points[(k + 1) % points.length]!;
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
}

function minus(a: readonly number[], b: readonly number[]): number[] {
  return [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
}

function cross(a: readonly number[], b: readonly number[]): number[] {
  return [
    a[1]! * b[2]! - a[2]! * b[1]!,
    a[2]! * b[0]! - a[0]! * b[2]!,
    a[0]! * b[1]! - a[1]! * b[0]!,
  ];
}

function dot(a: readonly number[], b: readonly number[]): number {
  return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
}
