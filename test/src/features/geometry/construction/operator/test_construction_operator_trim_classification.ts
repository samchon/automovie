import {
  AutoMovieSolidCycle,
  AutoMovieSolidMesh,
  AutoMovieSolidMeshLoop,
  type AutoMovieSolidVector,
  type IAutoMovieSolidSurface,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** A chart point, with each coordinate in its surface parameter's units. */
type Point = [number, number];
/** A world vector in mm per unit parameter. */
type Vec3 = AutoMovieSolidVector.Vec3;
/** A face trim record used without any generated person. */
type Loop = AutoMovieSolidMesh.ILoop;

/**
 * Face-local trim preparation preserves the live classifier while reusing only
 * unchanged numerical data, with independent metric and emitted-mesh checks.
 *
 * Scenarios:
 * 1. Rectangular holes/islands in stretched and sheared planes, with margins
 *    just below, exactly at and above independently derived distances.
 * 2. Winding cycles that turn back, seam aliases, half-period ties, degenerate
 *    charts/metrics and non-finite values, compared with the original arithmetic.
 * 3. Unreached accessor/malformed loops, a reached original exception, live jet
 *    accessors, fresh preparation after mutation and no reads from copied charts.
 * 4. A unit-cylinder face trimmed at u=1: exact shared ring, two retained grid
 *    rows, outward triangles, paired interior edges and the sole open top ring.
 * 5. A surface failure keeps its identity and station-major jet call order;
 *    empty/singleton face grids do not acquire new admission requirements.
 * 6. A periodic island 5.9 of 6.28 wide, its points crowded at one end: a
 *    point at its far end is kept, at its own phase and a period lower, and
 *    points in its gap are not.
 * 7. An island and a hole wider than a period (f1's ear after the concha's
 *    widened cut, 2.34 to 9.05 rad): a point with two images in the span is
 *    read at the one inside, and points past it are not.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls live/prepared Cycle and MeshLoop readers and the real Mesh.face consumer. Boolean decisions, getter/exception effects, chart-read counts, owner coordinates, edge uses and triangle normals catch stale snapshots, reordered failure, wrong metric margins or changed tessellation. Equivalent immutable numeric preparation is allowed.
 * @evidence contracts/development/testing.md#independent-expectations Rectangle distances follow the affine plane map: 2 mm on the stretched chart and sqrt(2) mm on the sheared chart. The turnback polygon crosses v=1.5 at u=1.5,3,4.5. The cylinder has four columns and two retained rows, hence 8 grid and 8 zipper triangles, 12 total vertices and one open four-edge top. Floating owner round trips allow 64 EPSILON at this unit scale. A separate literal legacy arithmetic oracle checks compatibility only, including ambiguous zero-margin boundary ties; it does not establish the currently unmet inclusive-on-cycle contract.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers all four kinds, positive/zero margins, periodic aliases and ties, empty/singleton/duplicate charts, singular metrics, unsupported accessors/non-finite data, short-circuit exceptions, copied-data reuse and new preparation after mutation. The unchanged five construction failures and full merge/clip topology are observed by the same construction_ round, not redefined here.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable synchronous CPU unit test_construction_operator_trim_classification, reached by --include construction_. All surfaces and accessor probes belong to this test; it generates no person and starts no process, host, renderer or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 7 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Rectangular holes/islands in stretched and sheared planes, with margins).
 */
export function test_construction_operator_trim_classification(): void {
  const square: Point[] = [
    [0, 0],
    [2, 0],
    [2, 2],
    [0, 2],
  ];
  const hole: Loop = loop("hole", square);
  const island: Loop = loop("island", square);
  const stretch: IAutoMovieSolidSurface.IJet = jet([2, 0, 0], [0, 0, 3]);
  const shear: IAutoMovieSolidSurface.IJet = jet([2, 0, 0], [1, 1, 0]);
  for (const [label, shape, u, v, frame, distance] of [
    ["stretched outside", hole, 3, 1, stretch, 2],
    ["stretched inside", island, 1, 1, stretch, 2],
    ["sheared outside", hole, 3, 0, shear, Math.sqrt(2)],
  ] as [string, Loop, number, number, IAutoMovieSolidSurface.IJet, number][]) {
    const read: ReturnType<typeof AutoMovieSolidMeshLoop.prepare> =
      AutoMovieSolidMeshLoop.prepare([shape], undefined);
    TestValidator.predicate(
      label + " below",
      read(u, v, frame, distance - 1e-9),
    );
    TestValidator.predicate(label + " equal", read(u, v, frame, distance));
    TestValidator.predicate(
      label + " above",
      !read(u, v, frame, distance + 1e-9),
    );
  }
  for (const shape of [hole, island]) {
    const read: ReturnType<typeof AutoMovieSolidMeshLoop.prepare> =
      AutoMovieSolidMeshLoop.prepare([shape], undefined);
    TestValidator.predicate(
      "positive margin excludes boundary " + shape.kind,
      !read(0, 1, stretch, 1e-9),
    );
  }

  // These expectations are the three ray crossings of the specified polygon.
  const turnback: Point[] = [
    [0, 0],
    [2, 2],
    [4, 1],
    [6, 3],
    [6, 5],
  ];
  for (const kind of ["start", "end"] as const) {
    const read: (u: number, v: number) => boolean = AutoMovieSolidCycle.prepare(
      loop(kind, turnback),
      2 * Math.PI,
    );
    for (const [u, start] of [
      [1, false],
      [2, true],
      [3.5, false],
      [5, true],
    ] as [number, boolean][])
      TestValidator.predicate(
        kind + " turnback " + u,
        read(u, 1.5) === (kind === "start" ? start : !start),
      );
  }

  // A periodic island almost a whole period wide, its points crowded at one end, as a band cut through from rim to rim leaves: a point
  // at its far end is inside it and a point in its gap is not. The mean of its points' phases lies near the crowded end, and a phase
  // moved to within half a period of that mean read the far end's points in the gap's image.
  const wide: Point[] = [
    [0, 0.1],
    ...Array.from({ length: 40 }, (_: unknown, k: number): Point => [0, 0.1 + (0.5 * k) / 39]),
    [0, 6.0],
    [1, 6.0],
    [1, 0.1],
  ];
  const wideRead: (u: number, v: number) => boolean = AutoMovieSolidCycle.prepare(loop("island", wide), 2 * Math.PI);
  TestValidator.predicate("wide island keeps its far end", wideRead(0.5, 5.8) && AutoMovieSolidCycle.kept(loop("island", wide), 0.5, 5.8, 2 * Math.PI));
  TestValidator.predicate("wide island keeps its far end through a lifted phase", wideRead(0.5, 5.8 - 2 * Math.PI));
  TestValidator.predicate("wide island leaves its gap", !wideRead(0.5, 6.2) && !wideRead(0.5, 0.05));

  // An island wider than a period, as a cut whose two runs across a band stand apart in phase leaves. The coordinates are f1's: the ear's
  // face after the concha's cut, widened forward, crossed its band (every twelfth point of the island's 384, and the three beside the
  // query). It spans 2.34 to 9.05 rad about 5.69, so the triangle's probe at 8.89 has two images within it, and only the one at 8.89 lies
  // inside; moved to within half a period of the middle it was read at 2.61, outside, and the face's triangulation was refused.
  const across: Point[] = [[8.42, 2.64], [7.31, 2.65], [10.43, 2.8], [11.54, 3.02], [15.35, 3.24], [21.47, 3.8], [22.49, 5.41], [22.16, 6.14], [17.19, 6.34], [9.68, 6.55], [7.76, 6.88], [14.05, 6.63], [19.66, 6.52], [20.98, 8.41], [20.56, 8.82], [20.31, 8.9], [20.07, 8.96], [17.67, 9.05], [12.67, 8.96], [10.36, 8.78], [8.61, 8.59], [7.28, 8.41], [6.03, 8.3], [4.86, 8.29], [4.5, 7.93], [4.5, 6.77], [4.5, 6.28], [4.5, 5.58], [4.5, 3.46], [4.5, 2.94], [4.5, 2.75], [4.5, 2.39], [5.07, 2.34], [6.1, 2.44], [7.18, 2.54]];
  const acrossRead: (u: number, v: number) => boolean = AutoMovieSolidCycle.prepare(loop("island", across), 2 * Math.PI);
  TestValidator.predicate("island wider than a period keeps a point at either image", acrossRead(20.31, 8.89) && acrossRead(20.31, 8.89 - 2 * Math.PI) && AutoMovieSolidCycle.kept(loop("island", across), 20.31, 8.89, 2 * Math.PI));
  TestValidator.predicate("island wider than a period reads its low end through the high image", acrossRead(5, 2) && acrossRead(15, 2));
  TestValidator.predicate("island wider than a period leaves what lies past it", !acrossRead(20.3, 9.3) && !acrossRead(12, 9.3) && !acrossRead(25, 5));
  TestValidator.predicate("hole wider than a period removes a point at either image", !AutoMovieSolidCycle.kept(loop("hole", across), 20.31, 8.89, 2 * Math.PI) && AutoMovieSolidCycle.kept(loop("hole", across), 20.3, 9.3, 2 * Math.PI));

  // This oracle owns equivalence with the face's arithmetic, not correct boundary ownership.
  const turn: number = 2 * Math.PI;
  const charts: Point[][] = [
    square,
    [],
    [[0, 0]],
    [
      [0, 0],
      [0, 0],
      [2, 2],
    ],
    turnback,
    [
      [0, 6.1],
      [2, 6.1],
      [2, 6.5],
      [0, 6.5],
    ],
    [
      [NaN, 0],
      [1, 1],
    ],
  ];
  const frames: IAutoMovieSolidSurface.IJet[] = [
    stretch,
    shear,
    jet([1, 0, 0], [2, 0, 0]),
    jet([0, 0, 0], [0, 0, 0]),
    jet([NaN, 0, 0], [0, 1, 0]),
  ];
  for (const kind of ["hole", "island", "start", "end"] as const)
    for (const chart of charts)
      for (const period of [undefined, turn, 0, -turn, NaN]) {
        const shape: Loop = loop(kind, chart);
        const read: ReturnType<typeof AutoMovieSolidMeshLoop.prepare> =
          AutoMovieSolidMeshLoop.prepare([shape], period);
        for (const u of [-1, 0, 1, 2, 3, NaN, Infinity])
          for (const v of [-turn, -Math.PI, 0, 1, Math.PI, turn, 3 * turn])
            for (const frame of frames)
              for (const margin of [0, 0.25, -1, NaN, Infinity])
                TestValidator.predicate(
                  "legacy " +
                    [kind, chart.length, period, u, v, margin].join("/"),
                  read(u, v, frame, margin) ===
                    legacy(shape, u, v, frame, margin, period),
                );
      }

  const pair: Loop[] = [
    island,
    loop("hole", [
      [0.5, 0.5],
      [1.5, 0.5],
      [1.5, 1.5],
      [0.5, 1.5],
    ]),
  ];
  const pairRead: ReturnType<typeof AutoMovieSolidMeshLoop.prepare> =
    AutoMovieSolidMeshLoop.prepare(pair, undefined);
  for (const u of [-1, 0.25, 1, 1.75, 3])
    for (const v of [0.25, 1, 1.75])
      for (const margin of [0, 0.1, 1])
        TestValidator.predicate(
          "multiple loop conjunction",
          pairRead(u, v, shear, margin) ===
            pair.every((shape: Loop): boolean =>
              legacy(shape, u, v, shear, margin, undefined),
            ),
        );
  TestValidator.predicate(
    "empty loop conjunction",
    AutoMovieSolidMeshLoop.prepare([], undefined)(
      NaN,
      NaN,
      jet([NaN, 0, 0], [NaN, 0, 0]),
      NaN,
    ),
  );

  effects(hole, island, stretch);
  consumer();
}

/** A test-owned trim record; vertex IDs are unnecessary for scalar predicates. */
function loop(kind: Loop["kind"], chart: Point[]): Loop {
  return { kind, chart, vertices: [] };
}

/** A planar jet with the prescribed first derivatives. */
function jet(u: Vec3, v: Vec3): IAutoMovieSolidSurface.IJet {
  return { p: [0, 0, 0], u, v, uu: [0, 0, 0], uv: [0, 0, 0], vv: [0, 0, 0] };
}

/** Original comparison arithmetic retained solely as a compatibility oracle. */
function legacy(
  shape: Loop,
  u: number,
  v: number,
  frame: IAutoMovieSolidSurface.IJet,
  margin: number,
  period: number | undefined,
): boolean {
  const points: Point[] = shape.chart;
  const shift: (
    x: number,
    reference: number,
    p: number | undefined,
  ) => number = (
    x: number,
    reference: number,
    p: number | undefined,
  ): number => (p === undefined ? x : x + p * Math.round((reference - x) / p));
  let kept: boolean;
  if (shape.kind === "hole" || shape.kind === "island") {
    let low: number = Infinity;
    let high: number = -Infinity;
    for (const p of points) {
      low = Math.min(low, p[1]);
      high = Math.max(high, p[1]);
    }
    const w: number = shift(v, (low + high) / 2, period);
    let inside: boolean = false;
    for (let k: number = 0; k < points.length; k++) {
      const a: Point = points[k]!;
      const b: Point = points[(k + 1) % points.length]!;
      if (
        a[1] > w !== b[1] > w &&
        u < a[0] + ((w - a[1]) * (b[0] - a[0])) / (b[1] - a[1])
      )
        inside = !inside;
    }
    kept = shape.kind === "island" ? inside : !inside;
  } else {
    const p: number = period ?? 2 * Math.PI;
    let count: number = 0;
    for (let k: number = 0; k < points.length; k++) {
      const a: Point = points[k]!;
      const raw: Point = points[(k + 1) % points.length]!;
      const bv: number = shift(raw[1], a[1], p);
      const w: number = shift(v, (a[1] + bv) / 2, p);
      if (a[1] > w === bv > w) continue;
      const x: number = a[0] + ((w - a[1]) * (raw[0] - a[0])) / (bv - a[1]);
      if (shape.kind === "start" ? x <= u : x >= u) count++;
    }
    kept = count % 2 === 1;
  }
  if (!kept) return false;
  const dot: (a: Vec3, b: Vec3) => number = (a: Vec3, b: Vec3): number =>
    a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const E: number = dot(frame.u, frame.u);
  const F: number = dot(frame.u, frame.v);
  const G: number = dot(frame.v, frame.v);
  let least: number = Infinity;
  for (let k: number = 0; k < points.length; k++) {
    const a: Point = points[k]!;
    const b: Point = points[(k + 1) % points.length]!;
    const dx: number = b[0] - a[0];
    const dy: number = shift(b[1], a[1], period) - a[1];
    const px: number = u - a[0];
    const py: number = shift(v, a[1], period) - a[1];
    const dd: number = E * dx * dx + 2 * F * dx * dy + G * dy * dy;
    const pd: number = E * px * dx + F * (px * dy + py * dx) + G * py * dy;
    const t: number = dd > 0 ? Math.min(1, Math.max(0, pd / dd)) : 0;
    const x: number = px - t * dx;
    const y: number = py - t * dy;
    least = Math.min(
      least,
      Math.sqrt(Math.max(0, E * x * x + 2 * F * x * y + G * y * y)),
    );
  }
  return least >= margin;
}

/** Original exceptions/getters remain live; numerical copies have one reader lifetime. */
function effects(
  hole: Loop,
  island: Loop,
  frame: IAutoMovieSolidSurface.IJet,
): void {
  const sentinel: Error = new Error("owned late chart");
  let reads: number = 0;
  const late: Loop = {
    kind: "hole",
    vertices: [],
    get chart(): Point[] {
      reads++;
      throw sentinel;
    },
  };
  const reject: ReturnType<typeof AutoMovieSolidMeshLoop.prepare> =
    AutoMovieSolidMeshLoop.prepare([hole, late], undefined);
  TestValidator.predicate("late getter untouched at prepare", reads === 0);
  TestValidator.predicate(
    "first loop short circuit",
    !reject(1, 1, frame, 0) && reads === 0,
  );
  let thrown: unknown;
  try {
    reject(3, 1, frame, 0);
  } catch (error) {
    thrown = error;
  }
  TestValidator.predicate(
    "same reached exception",
    thrown === sentinel && reads === 1,
  );
  const sparse: Loop[] = [hole];
  Object.defineProperty(sparse, "1", {
    get: (): Loop => {
      throw sentinel;
    },
    configurable: true,
  });
  const lazy: ReturnType<typeof AutoMovieSolidMeshLoop.prepare> =
    AutoMovieSolidMeshLoop.prepare(sparse, undefined);
  TestValidator.predicate("array getter short circuit", !lazy(1, 1, frame, 0));
  const malformed: Loop = {
    kind: "hole",
    chart: [undefined as unknown as Point],
    vertices: [],
  };
  TestValidator.predicate(
    "malformed unreached",
    !AutoMovieSolidMeshLoop.prepare([hole, malformed], undefined)(
      1,
      1,
      frame,
      0,
    ),
  );

  const order: string[] = [];
  const point: Point = [0, 0];
  Object.defineProperty(point, "0", {
    get: (): number => {
      order.push("x");
      return 0;
    },
  });
  Object.defineProperty(point, "1", {
    get: (): number => {
      order.push("y");
      return 0;
    },
  });
  TestValidator.predicate(
    "accessor coordinate result",
    AutoMovieSolidMeshLoop.prepare([loop("hole", [point])], undefined)(
      3,
      1,
      frame,
      0,
    ),
  );
  TestValidator.predicate(
    "original coordinate evaluation order",
    order.join("") === "xyyyyyyxyxxy",
  );

  let axes: number = 0;
  const accessor: IAutoMovieSolidSurface.IJet = {
    ...frame,
    get u(): Vec3 {
      axes++;
      return frame.u;
    },
  };
  const expected: boolean = legacy(hole, 3, 1, accessor, 0, undefined);
  const originalReads: number = axes;
  axes = 0;
  const actual: boolean = AutoMovieSolidMeshLoop.prepare([hole], undefined)(
    3,
    1,
    accessor,
    0,
  );
  TestValidator.predicate(
    "live jet result and getter count",
    actual === expected && axes === originalReads,
  );

  // Descriptor probes are test-owned observations of eligibility/copy work.
  let probes: number = 0;
  const counted: Point[] = island.chart.map(
    (p: Point): Point =>
      new Proxy(p, {
        getOwnPropertyDescriptor(
          target: Point,
          key: string | symbol,
        ): PropertyDescriptor | undefined {
          probes++;
          return Reflect.getOwnPropertyDescriptor(target, key);
        },
      }),
  );
  const owned: Loop = loop("island", counted);
  const read: ReturnType<typeof AutoMovieSolidMeshLoop.prepare> =
    AutoMovieSolidMeshLoop.prepare([owned], undefined);
  TestValidator.predicate("first copied reading", read(1, 1, frame, 0));
  const copied: number = probes;
  for (let k: number = 0; k < 10; k++)
    TestValidator.predicate(
      "repeated copied reading " + k,
      read(1, 1, frame, 0),
    );
  TestValidator.predicate(
    "chart source read once",
    copied > 0 && probes === copied,
  );
  owned.chart = [
    [10, 10],
    [12, 10],
    [12, 12],
    [10, 12],
  ];
  TestValidator.predicate(
    "new reader after mutation",
    !AutoMovieSolidMeshLoop.prepare([owned], undefined)(1, 1, frame, 0),
  );
}

/** The real face consumer on a cylinder with independent topology/coordinate checks. */
function consumer(): void {
  const phases: number[] = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  const surface: IAutoMovieSolidSurface = {
    name: "trim-classification-cylinder",
    period: 2 * Math.PI,
    orientation: 1,
    jet(u: number, v: number): IAutoMovieSolidSurface.IJet {
      return {
        p: [Math.cos(v), u, Math.sin(v)],
        u: [0, 1, 0],
        v: [-Math.sin(v), 0, Math.cos(v)],
        uu: [0, 0, 0],
        uv: [0, 0, 0],
        vv: [-Math.cos(v), 0, -Math.sin(v)],
      };
    },
  };
  const mesh: AutoMovieSolidMesh.IMesh = AutoMovieSolidMesh.create();
  const owner: number = AutoMovieSolidMesh.owner(mesh, surface);
  const chart: Point[] = phases.map((v: number): Point => [1, v]);
  const vertices: number[] = chart.map(([u, v]: Point): number =>
    AutoMovieSolidMesh.vertex(mesh, [Math.cos(v), u, Math.sin(v)], owner, u, v),
  );
  const open: AutoMovieSolidMesh.IOpen[] = AutoMovieSolidMesh.face(mesh, {
    surface,
    stations: [0, 1, 2, 3],
    phases,
    loops: [{ kind: "start", chart, vertices }],
  });
  TestValidator.predicate(
    "cylinder vertex/triangle populations",
    mesh.positions.length === 36 && mesh.indices.length === 48,
  );
  TestValidator.predicate(
    "sole open top",
    open.length === 1 &&
      open[0]!.vertices.length === 4 &&
      open[0]!.vertices.every(
        (id: number): boolean => mesh.coordinates[3 * id + 1] === 3,
      ),
  );
  const edges: Map<string, number> = new Map();
  for (let t: number = 0; t < mesh.indices.length; t += 3) {
    const ids: number[] = mesh.indices.slice(t, t + 3);
    const points: Vec3[] = ids.map(
      (id: number): Vec3 => [
        mesh.positions[3 * id]!,
        mesh.positions[3 * id + 1]!,
        mesh.positions[3 * id + 2]!,
      ],
    );
    const a: Vec3 = points[0]!;
    const b: Vec3 = points[1]!;
    const c: Vec3 = points[2]!;
    const ux: number = b[0] - a[0];
    const uy: number = b[1] - a[1];
    const uz: number = b[2] - a[2];
    const vx: number = c[0] - a[0];
    const vy: number = c[1] - a[1];
    const vz: number = c[2] - a[2];
    const radial: number =
      (uy * vz - uz * vy) * (a[0] + b[0] + c[0]) +
      (ux * vy - uy * vx) * (a[2] + b[2] + c[2]);
    TestValidator.predicate("outward triangle " + t / 3, radial > 0);
    for (let k: number = 0; k < 3; k++) {
      const key: string = ids[k] + "," + ids[(k + 1) % 3];
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  }
  let exposed: number = 0;
  for (const [key, count] of edges) {
    const [a, b]: number[] = key.split(",").map(Number);
    const reverse: number = edges.get(b + "," + a) ?? 0;
    TestValidator.predicate(
      "edge multiplicity " + key,
      count === 1 && reverse <= 1,
    );
    if (reverse === 0) {
      exposed++;
      const u: number = mesh.coordinates[3 * a! + 1]!;
      TestValidator.predicate(
        "open edge on trim or top " + key,
        (u === 1 || u === 3) && mesh.coordinates[3 * b! + 1] === u,
      );
    }
  }
  TestValidator.predicate(
    "four trim and four top boundary edges",
    exposed === 8,
  );
  for (let k: number = 0; k < vertices.length; k++) {
    const a: number = vertices[k]!;
    const b: number = vertices[(k + 1) % vertices.length]!;
    TestValidator.predicate(
      "original shared trim edge " + k,
      (edges.get(a + "," + b) ?? 0) + (edges.get(b + "," + a) ?? 0) === 1,
    );
  }
  for (let id: number = 0; id < mesh.positions.length / 3; id++) {
    const point: Vec3 = AutoMovieSolidMesh.evaluate(mesh, id);
    for (let k: number = 0; k < 3; k++)
      TestValidator.predicate(
        "owner coordinate " + id + "/" + k,
        nclose(mesh.positions[3 * id + k]!, point[k]!, 64 * Number.EPSILON),
      );
  }

  const calls: Point[] = [];
  const sentinel: Error = new Error("owned surface jet");
  const throwing: IAutoMovieSolidSurface = {
    name: "trim-throw",
    orientation: 1,
    jet(u: number, v: number): IAutoMovieSolidSurface.IJet {
      calls.push([u, v]);
      if (u === 1 && v === 1) throw sentinel;
      return jet([1, 0, 0], [0, 1, 0]);
    },
  };
  let thrown: unknown;
  try {
    AutoMovieSolidMesh.face(AutoMovieSolidMesh.create(), {
      surface: throwing,
      stations: [0, 1, 2],
      phases: [0, 1, 2],
      loops: [],
    });
  } catch (error) {
    thrown = error;
  }
  TestValidator.predicate("original surface failure", thrown === sentinel);
  TestValidator.predicate(
    "station-major jet calls",
    calls.length === 5 &&
      calls.every(
        ([u, v]: Point, k: number): boolean =>
          u === Math.floor(k / 3) && v === k % 3,
      ),
  );
  for (const [stations, angles] of [
    [[], []],
    [[0], [0]],
  ] as [number[], number[]][]) {
    const empty: AutoMovieSolidMesh.IMesh = AutoMovieSolidMesh.create();
    TestValidator.predicate(
      "degenerate grid has no triangles",
      AutoMovieSolidMesh.face(empty, {
        surface,
        stations,
        phases: angles,
        loops: [],
      }).length === 0 && empty.indices.length === 0,
    );
  }
}
