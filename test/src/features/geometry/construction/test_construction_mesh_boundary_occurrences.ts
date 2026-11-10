import {
  AutoMovieSolidCycle,
  AutoMovieSolidMesh,
  AutoMovieSolidMeshConstraints,
  type AutoMovieSolidMeshPlan,
  type IAutoMovieSolidSurface,
  openAutoMovieSolidMesh,
} from "@automovie/engine";

import { nclose } from "../../internal/nclose";

/**
 * Endpoint charts retain native cover occurrences instead of a first-ID lookup.
 *
 * Scenarios:
 * 1. Cylinders at three units and both chart orientations return two complete
 *    opposite-winding endpoint records with their exact native station.
 * 2. Fans built from those positive native boundaries close every edge once in
 *    each direction and face outward, or inward for a cutter.
 * 3. A hole touching a periodic endpoint leaves a valid trimmed surface but a
 *    partial endpoint arc. It is diagnosed and never returned for a false cap;
 *    an omitted callback throws atomically before new mesh writes.
 * 4. Translating the source hole by three periods changes no region, winding
 *    or endpoint classification; coordinates retain their actual face cover.
 * 5. Flat/bounded winding sources at exact seams, neighbouring doubles and
 *    signed subnormals agree with their independently known station sides.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls actual Mesh.face/close and reads IOpen chart/winding/end, world triangles, shared edge incidence and failure atomicity with no foreign replacement.
 * @evidence contracts/development/testing.md#independent-expectations A unit cylinder has known radial normals and opposite endpoint traversals. A bottom-contact rectangle removes exactly 0.6 chart area from 4 times 2pi, while only the untouched top remains a full endpoint.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers chart reflection, cutter inversion, three units, full/partial endpoints, source period translation, callback presence/absence and original source IDs.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable synchronous CPU test through construction_mesh_boundary_occurrences; it generates no person, host, render, process or independent triangulator.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Cylinders at three units and both chart orientations return two complete).
 */
export function test_construction_mesh_boundary_occurrences(): void {
  const failures: string[] = [];
  for (const scale of [0.001, 1, 1000])
    for (const orientation of [1, -1] as const)
      for (const inverted of [false, true])
        closed(failures, scale, orientation, inverted);
  for (const turns of [0, 3]) partial(failures, turns);
  occurrences(failures);
  cycleSeams(failures);
  if (failures.length !== 0)
    throw new Error(
      `Mesh endpoint occurrence findings:\n${failures.join("\n")}`,
    );
}

/** A flat or bounded-height winding boundary crosses each phase once, including raw seam neighbours. */
function cycleSeams(failures: string[]): void {
  const periods: [number, number, number][] = [
    [1, 1 - 2 ** -53, 1 + 2 ** -52],
    [2 * Math.PI, 2 * Math.PI - 2 ** -50, 2 * Math.PI + 2 ** -50],
  ];
  for (const scale of [0.001, 1, 1000])
    for (const [period, below, above] of periods)
      for (const offset of [0, Number.EPSILON / 2])
        for (const translated of [0, 3 * period])
          for (const varying of [false, true])
            for (const reverse of [false, true]) {
              const raw: [number, number][] = [0, 1, 2, 3].map(
                (k: number): [number, number] => [
                  scale * (varying ? [1, 1.25, 1, 0.75][k]! : 1),
                  offset + translated + (k * period) / 4,
                ],
              );
              const chart: [number, number][] = reverse
                ? raw.slice().reverse()
                : raw;
              const before: string = JSON.stringify(chart);
              const phases: number[] = [
                -3 * period,
                -Number.EPSILON / 2,
                -Number.MIN_VALUE,
                0,
                Number.MIN_VALUE,
                Number.EPSILON / 2,
                below,
                period,
                above,
                3 * period,
              ];
              for (const kind of ["start", "end"] as const) {
                const cycle: Pick<
                  AutoMovieSolidCycle.ICycle,
                  "kind" | "chart"
                > = { kind, chart };
                const read: (u: number, v: number) => boolean =
                  AutoMovieSolidCycle.prepare(cycle, period);
                for (const phase of phases)
                  for (const [u, kept] of [
                    [0, kind === "end"],
                    [2 * scale, kind === "start"],
                  ] as [number, boolean][]) {
                    const live: boolean = AutoMovieSolidCycle.kept(
                      cycle,
                      u,
                      phase,
                      period,
                    );
                    const prepared: boolean = read(u, phase);
                    if (live !== kept || prepared !== kept)
                      failures.push(
                        `winding seam ${kind}/${scale}/${period}/${offset}/${translated}/${varying}/${reverse}: (${u},${phase}) was ${live}/${prepared}, expected ${kept}`,
                      );
                  }
              }
              if (JSON.stringify(chart) !== before)
                failures.push(
                  "winding seam reading moved an original chart endpoint",
                );
            }
}

/** The same ID pair represents two distinct semicircle edges, not one first-ID chart. */
function occurrences(failures: string[]): void {
  const chart: Map<number, readonly [number, number]> = new Map([
    [0, [0, 0]],
    [1, [0, 3]],
    [2, [1, 0]],
    [3, [1, 3]],
  ]);
  const segments: AutoMovieSolidMeshConstraints.ISegment[] = [
    { a: 0, b: 1, turn: 0 },
    { a: 0, b: 1, turn: -1 },
    { a: 2, b: 3, turn: 0 },
    { a: 2, b: 3, turn: -1 },
  ];
  const split: AutoMovieSolidMeshConstraints.IEdge[] | string =
    AutoMovieSolidMeshConstraints.split(chart, segments, 6);
  if (typeof split === "string") {
    failures.push(`native occurrence fixture: ${split}`);
    return;
  }
  const triangles: AutoMovieSolidMeshPlan.ITriangle[] = [
    { vertices: [0, 2, 3], lifts: [0, 0, 0] },
    { vertices: [0, 3, 1], lifts: [0, 0, 0] },
    { vertices: [1, 3, 2], lifts: [0, 0, 1] },
    { vertices: [1, 2, 0], lifts: [0, 1, 1] },
  ];
  const actual: ReturnType<typeof openAutoMovieSolidMesh> =
    openAutoMovieSolidMesh(chart, triangles, split, 0, 4, 0, 1, 6);
  if (typeof actual === "string") {
    failures.push(`native occurrence reading: ${actual}`);
    return;
  }
  if (actual.partial || actual.cycles.length !== 2)
    failures.push(
      "two original-ID semicircles lost their complete endpoint walks",
    );
  for (const cycle of actual.cycles) {
    if (
      cycle.vertices.length !== 2 ||
      cycle.chart.length !== 2 ||
      Math.abs(cycle.chart[1]![1] - cycle.chart[0]![1]) !== 3 ||
      cycle.winding !== (cycle.end === "bottom" ? -1 : 1)
    )
      failures.push(
        `native occurrence was reconstructed from first ID: ${JSON.stringify(cycle)}`,
      );
  }
}

/** A reflected cylinder has the same world-solid outward normal with opposite native sign. */
function cylinder(scale: number, orientation: 1 | -1): IAutoMovieSolidSurface {
  return {
    name: `cylinder/${scale}/${orientation}`,
    orientation,
    period: 2 * Math.PI,
    domain: [0, 4 * scale],
    jet(u: number, v: number): IAutoMovieSolidSurface.IJet {
      const c: number = Math.cos(v);
      const s: number = Math.sin(v);
      return {
        p: [scale * c, u, orientation * scale * s],
        u: [0, 1, 0],
        v: [-scale * s, 0, orientation * scale * c],
        uu: [0, 0, 0],
        uv: [0, 0, 0],
        vv: [-scale * c, 0, -orientation * scale * s],
      };
    },
  };
}

/** World normals and paired edges independently check the complete capped cylinder. */
function closed(
  failures: string[],
  scale: number,
  orientation: 1 | -1,
  inverted: boolean,
): void {
  const label: string = `${scale}/${orientation}/${inverted}`;
  const surface: IAutoMovieSolidSurface = cylinder(scale, orientation);
  const mesh: AutoMovieSolidMesh.IMesh = AutoMovieSolidMesh.create();
  const phases: number[] = Array.from(
    { length: 12 },
    (_: unknown, k: number): number => (2 * Math.PI * k) / 12,
  );
  let open: AutoMovieSolidMesh.IOpen[];
  try {
    open = AutoMovieSolidMesh.face(mesh, {
      surface,
      stations: [0, 2 * scale, 4 * scale],
      phases,
      loops: [],
      inverted,
    });
  } catch (error) {
    failures.push(`${label}: ${String(error)}`);
    return;
  }
  if (open.length !== 2)
    failures.push(`${label}: ${open.length} complete endpoints instead of two`);
  const owner: number = AutoMovieSolidMesh.owner(mesh, surface);
  for (const boundary of open) {
    const end: "bottom" | "top" | null = boundary.end;
    if (end === null) {
      failures.push(`${label}: periodic endpoint has no explicit end`);
      continue;
    }
    const station: number = end === "bottom" ? 0 : 4 * scale;
    if (
      boundary.chart.length !== boundary.vertices.length ||
      !boundary.chart.every(
        (point: [number, number]): boolean => point[0] === station,
      ) ||
      boundary.winding !== (end === "bottom" ? -1 : 1)
    )
      failures.push(`${label}: wrong native occurrence/winding at ${end}`);
    const apex: number = AutoMovieSolidMesh.vertex(
      mesh,
      [0, end === "bottom" ? -scale : 5 * scale, 0],
      owner,
      station,
      0,
    );
    const fan: [number, number, number][] = boundary.vertices.map(
      (id: number, k: number): [number, number, number] => [
        id,
        boundary.vertices[(k + 1) % boundary.vertices.length]!,
        apex,
      ],
    );
    AutoMovieSolidMesh.close(mesh, fan, surface, inverted);
  }
  const edges: Map<string, number> = new Map();
  for (let k: number = 0; k < mesh.indices.length; k += 3) {
    const ids: number[] = mesh.indices.slice(k, k + 3);
    const points: number[][] = ids.map((id: number): number[] =>
      mesh.positions.slice(3 * id, 3 * id + 3),
    );
    const a: number[] = points[0]!;
    const b: number[] = points[1]!;
    const c: number[] = points[2]!;
    const u: number[] = b.map(
      (value: number, j: number): number => value - a[j]!,
    );
    const v: number[] = c.map(
      (value: number, j: number): number => value - a[j]!,
    );
    const n: number[] = [
      u[1]! * v[2]! - u[2]! * v[1]!,
      u[2]! * v[0]! - u[0]! * v[2]!,
      u[0]! * v[1]! - u[1]! * v[0]!,
    ];
    const radial: number =
      n[0]! * (a[0]! / 3 + b[0]! / 3 + c[0]! / 3) +
      n[1]! * (a[1]! / 3 + b[1]! / 3 + c[1]! / 3 - 2 * scale) +
      n[2]! * (a[2]! / 3 + b[2]! / 3 + c[2]! / 3);
    if (!(radial * (inverted ? -1 : 1) > 0))
      failures.push(
        `${label}: world triangle ${k / 3} faces against independent convex-solid normal`,
      );
    for (let j: number = 0; j < 3; j++) {
      const key: string = `${ids[j]}/${ids[(j + 1) % 3]}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  }
  for (const [edge, count] of edges) {
    const [a, b]: string[] = edge.split("/");
    if (count !== 1 || edges.get(`${b}/${a}`) !== 1)
      failures.push(`${label}: unpaired capped edge ${edge}`);
  }
}

/** A legitimate partial source end must not become a false event or pole ring. */
function partial(failures: string[], turns: number): void {
  const surface: IAutoMovieSolidSurface = cylinder(1, 1);
  const mesh: AutoMovieSolidMesh.IMesh = AutoMovieSolidMesh.create();
  const owner: number = AutoMovieSolidMesh.owner(mesh, surface);
  const chart: [number, number][] = [
    [0, turns * 2 * Math.PI - 0.3],
    [1, turns * 2 * Math.PI - 0.3],
    [1, turns * 2 * Math.PI + 0.3],
    [0, turns * 2 * Math.PI + 0.3],
  ];
  const vertices: number[] = chart.map(([u, v]: [number, number]): number =>
    AutoMovieSolidMesh.vertex(mesh, surface.jet(u, v).p, owner, u, v),
  );
  const phases: number[] = Array.from(
    { length: 16 },
    (_: unknown, k: number): number => (2 * Math.PI * k) / 16,
  );
  const input: AutoMovieSolidMesh.IFace = {
    surface,
    stations: [0, 1, 2, 3, 4],
    phases,
    loops: [{ kind: "hole", vertices, chart }],
  };
  const before: string = JSON.stringify(mesh);
  let missing: unknown;
  try {
    AutoMovieSolidMesh.face(mesh, input);
  } catch (error) {
    missing = error;
  }
  if (
    !(missing instanceof Error) ||
    !missing.message.includes("partial periodic") ||
    JSON.stringify(mesh) !== before
  )
    failures.push(
      `partial/${turns}: callback-free partial end was silent or mutated mesh (${String(missing)})`,
    );
  const reports: string[] = [];
  let open: AutoMovieSolidMesh.IOpen[];
  try {
    open = AutoMovieSolidMesh.face(mesh, {
      ...input,
      onFailure: (detail: string): void => {
        reports.push(detail);
      },
    });
  } catch (error) {
    failures.push(`partial/${turns}: ${String(error)}`);
    return;
  }
  if (
    reports.length !== 1 ||
    !reports[0]!.includes("partial periodic") ||
    open.length !== 1 ||
    open[0]!.end !== "top" ||
    open[0]!.winding !== 1
  )
    failures.push(
      `partial/${turns}: ${reports.join(";")}, endpoints ${JSON.stringify(open)}`,
    );
  let area: number = 0;
  for (let k: number = 0; k < mesh.indices.length; k += 3) {
    const points: [number, number][] = mesh.indices
      .slice(k, k + 3)
      .map((id: number): [number, number] => [
        mesh.coordinates[3 * id + 1]!,
        mesh.coordinates[3 * id + 2]!,
      ]);
    for (let j: number = 1; j < 3; j++)
      points[j]![1] +=
        2 *
        Math.PI *
        Math.round((points[0]![1] - points[j]![1]) / (2 * Math.PI));
    const [a, b, c]: [number, number][] = points;
    area +=
      ((b![0] - a![0]) * (c![1] - a![1]) - (b![1] - a![1]) * (c![0] - a![0])) /
      2;
  }
  if (!nclose(area, 8 * Math.PI - 0.6, 1e-10))
    failures.push(
      `partial/${turns}: chart area ${area}, expected ${8 * Math.PI - 0.6}`,
    );
}
