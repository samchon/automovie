import {
  AutoMovieSolidBody,
  AutoMovieSolidCycle,
  AutoMovieSolidMesh,
  AutoMovieSolidMeshLoop,
  type IAutoMovieSolidSurface,
} from "@automovie/engine";

import { HumanSolidShapes } from "../../internal/HumanSolidShapes";
import { nclose } from "../../internal/nclose";

/**
 * A named face refusal is explicit and no fallible preparation mutates buffers.
 *
 * Scenarios:
 * 1. Omitted/undefined callback, recording callback and throwing callback observe
 *    the same invalid-period source, with all four mesh populations unchanged.
 * 2. A source sentinel at the fifth station-major jet propagates by identity;
 *    no owner is registered during preparation and no failure callback runs.
 * 3. A foreign owner stores shifted coordinates while the trim supplies this
 *    face's chart; the square-minus-hole area and shared IDs remain exact.
 * 4. A reused jet object is copied during preparation; analytic plane points
 *    and an explicit detached planar rim survive without a registry.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual Mesh.face and Body.draw with ordinary buffers, recording only public output, callback effects and thrown objects; it never replaces globals or foreign methods.
 * @evidence contracts/testing.md#independent-expectations Invalid period is outside the public contract; unchanged buffers follow atomic refusal. Plane area is 16 minus 4 and each point is independently [u,v,0], with same original source IDs.
 * @evidence contracts/testing.md#distinguishing-cases Separates missing/undefined/recording/throwing callbacks, arbitrary source exceptions, winding accessor order, first-five query order, aliased jet storage, foreign charts, fixed canonical index publication and planar non-endpoint output.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU test through construction_mesh_transaction; no person generation, viewer, server, process or foreign replacement is used.
 */
export function test_construction_mesh_transaction(): void {
  const failures: string[] = [];
  const bad: IAutoMovieSolidSurface = { ...plane("bad-period"), period: 0 };
  for (const mode of ["omitted", "undefined", "record", "throw"]) {
    const mesh: AutoMovieSolidMesh.IMesh = AutoMovieSolidMesh.create();
    const before: string = JSON.stringify(mesh);
    const sentinel: Error = new Error("owned diagnostic callback");
    const details: string[] = [];
    const input: AutoMovieSolidMesh.IFace = {
      surface: bad,
      stations: [0, 1],
      phases: [0, 1],
      loops: [],
    };
    if (mode === "undefined") input.onFailure = undefined;
    if (mode === "record")
      input.onFailure = (detail: string): void => {
        details.push(detail);
      };
    if (mode === "throw")
      input.onFailure = (_detail: string): void => {
        throw sentinel;
      };
    let thrown: unknown;
    let result: AutoMovieSolidMesh.IOpen[] | undefined;
    try {
      result = AutoMovieSolidMesh.face(mesh, input);
    } catch (error) {
      thrown = error;
    }
    if (JSON.stringify(mesh) !== before)
      failures.push(`${mode}: named refusal mutated mesh`);
    if (mode === "record") {
      if (
        thrown !== undefined ||
        result?.length !== 0 ||
        details.length !== 1 ||
        !details[0]!.includes("period")
      )
        failures.push(
          `${mode}: missing named refusal ${String(thrown)}/${details.join(";")}`,
        );
    } else if (mode === "throw") {
      if (thrown !== sentinel)
        failures.push("diagnostic callback exception lost identity");
    } else if (!(thrown instanceof Error) || !thrown.message.includes("period"))
      failures.push(`${mode}: omitted callback silently accepted refusal`);
  }

  // Body must not turn an absent callback into an always-present no-op wrapper.
  const body: AutoMovieSolidBody.IBody = AutoMovieSolidBody.create("bad-body", [
    { surface: bad, stations: [0, 1], phases: [0, 1] },
  ]);
  let bodyError: unknown;
  try {
    AutoMovieSolidBody.draw(body);
  } catch (error) {
    bodyError = error;
  }
  if (
    !(bodyError instanceof Error) ||
    !bodyError.message.includes("period") ||
    body.mesh.owners.length !== 0
  )
    failures.push("Body.draw swallowed its callback-free named refusal");

  const mesh: AutoMovieSolidMesh.IMesh = AutoMovieSolidMesh.create();
  const calls: [number, number][] = [];
  const sourceError: Error = new Error("owned source sentinel");
  let diagnoses: number = 0;
  const source: IAutoMovieSolidSurface = {
    name: "source-throw",
    orientation: 1,
    jet(u: number, v: number): IAutoMovieSolidSurface.IJet {
      calls.push([u, v]);
      if (mesh.owners.length !== 0)
        failures.push("owner registered before source preparation finished");
      if (u === 1 && v === 1) throw sourceError;
      return planeJet(u, v);
    },
  };
  let thrown: unknown;
  try {
    AutoMovieSolidMesh.face(mesh, {
      surface: source,
      stations: [0, 1, 2],
      phases: [0, 1, 2],
      loops: [],
      onFailure: (_detail: string): void => {
        diagnoses++;
      },
    });
  } catch (error) {
    thrown = error;
  }
  if (
    thrown !== sourceError ||
    diagnoses !== 0 ||
    mesh.positions.length !== 0 ||
    mesh.coordinates.length !== 0 ||
    mesh.indices.length !== 0 ||
    mesh.owners.length !== 0
  )
    failures.push("source exception identity/atomicity changed");
  if (
    calls.length !== 5 ||
    !calls.every(
      ([u, v]: [number, number], k: number): boolean =>
        u === Math.floor(k / 3) && v === k % 3,
    )
  )
    failures.push("source jet order is not station-major through its sentinel");

  inspectAuthority(failures);
  windingEffects(failures);
  canonicalIndices(failures);
  inspectForeign(failures);
  inspectAliased(failures);
  if (failures.length !== 0)
    throw new Error(`Mesh transaction findings:\n${failures.join("\n")}`);
}

/** Raw winding classification and the public metric fallback retain the original first exception. */
function windingEffects(failures: string[]): void {
  const first: Error = new Error("owned start phase");
  const next: Error = new Error("owned endpoint station");
  const a: [number, number] = [0, 0];
  const b: [number, number] = [1, 1];
  let phaseReads: number = 0;
  let stationReads: number = 0;
  Object.defineProperty(a, "1", {
    get: (): number => {
      phaseReads++;
      throw first;
    },
  });
  Object.defineProperty(b, "0", {
    get: (): number => {
      stationReads++;
      throw next;
    },
  });
  const loop: AutoMovieSolidMesh.ILoop = {
    kind: "start",
    vertices: [0, 1, 2],
    chart: [a, b, [0, 4]],
  };
  const raw: (u: number, v: number) => boolean = (
    u: number,
    v: number,
  ): boolean => AutoMovieSolidCycle.kept(loop, u, v, 2 * Math.PI);
  const prepared: ReturnType<typeof AutoMovieSolidMeshLoop.prepare> =
    AutoMovieSolidMeshLoop.prepare([loop], 2 * Math.PI);
  if (phaseReads !== 0 || stationReads !== 0)
    failures.push("winding accessor was invoked during metric preparation");
  for (const observe of [
    (): unknown => raw(2, 0.5),
    (): unknown => prepared(2, 0.5, planeJet(0, 0), 0),
    (): unknown => AutoMovieSolidCycle.prepare(loop, 2 * Math.PI),
  ]) {
    phaseReads = 0;
    stationReads = 0;
    let thrown: unknown;
    try {
      observe();
    } catch (error) {
      thrown = error;
    }
    if (thrown !== next || phaseReads !== 0 || stationReads !== 1)
      failures.push("winding raw endpoint/start getter exception order changed");
  }
  const order: string[] = [];
  const point: [number, number] = [0, 0];
  const endpoint: [number, number] = [1, 1];
  const later: Error = new Error("owned later phase");
  Object.defineProperty(point, "1", {
    get: (): number => {
      order.push("a");
      if (order.filter((name: string): boolean => name === "a").length === 3)
        throw later;
      return 0;
    },
  });
  Object.defineProperty(endpoint, "0", {
    get: (): number => {
      order.push("x");
      return 1;
    },
  });
  Object.defineProperty(endpoint, "1", {
    get: (): number => {
      order.push("y");
      return 1;
    },
  });
  let thrown: unknown;
  try {
    AutoMovieSolidCycle.kept(
      { kind: "start", chart: [point, endpoint, [0, 4]] },
      2,
      0.5,
      2 * Math.PI,
    );
  } catch (error) {
    thrown = error;
  }
  if (thrown !== later || order.join("") !== "xyaaa")
    failures.push(
      `winding reached start-coordinate order changed: ${order.join("")}`,
    );
}

/** Two original-ID triangles sharing only their origin have one literal oriented publication. */
function canonicalIndices(failures: string[]): void {
  const mesh: AutoMovieSolidMesh.IMesh = AutoMovieSolidMesh.create();
  const source: IAutoMovieSolidSurface = plane("canonical-index-source");
  const owner: number = AutoMovieSolidMesh.owner(mesh, source);
  const points: [number, number][] = [
    [-2, 0],
    [0, -2],
    [2, 0],
    [0, 2],
    [0, 0],
  ];
  const ids: number[] = points.map(([u, v]: [number, number]): number =>
    AutoMovieSolidMesh.vertex(mesh, [u, v, 0], owner, u, v),
  );
  const loop: number[] = [4, 2, 3, 4, 0, 1];
  const before: string = JSON.stringify({
    positions: mesh.positions,
    coordinates: mesh.coordinates,
  });
  try {
    AutoMovieSolidMesh.face(mesh, {
      surface: source,
      stations: [-2, 0, 2],
      phases: [-2, 0, 2],
      loops: [
        {
          kind: "island",
          vertices: loop.map((id: number): number => ids[id]!),
          chart: loop.map((id: number): [number, number] => points[id]!),
        },
      ],
    });
  } catch (error) {
    failures.push(`canonical index fixture: ${String(error)}`);
    return;
  }
  if (mesh.indices.join(",") !== "0,1,4,2,3,4")
    failures.push(
      `fixed original triangles published in a different order: ${mesh.indices.join(",")}`,
    );
  if (
    JSON.stringify({ positions: mesh.positions, coordinates: mesh.coordinates }) !==
    before
  )
    failures.push(
      "index publication changed an original vertex or its owner chart",
    );
  let area: number = 0;
  for (let at: number = 0; at < mesh.indices.length; at += 3) {
    const a: [number, number] = [
      mesh.positions[3 * mesh.indices[at]!]!,
      mesh.positions[3 * mesh.indices[at]! + 1]!,
    ];
    const b: [number, number] = [
      mesh.positions[3 * mesh.indices[at + 1]!]!,
      mesh.positions[3 * mesh.indices[at + 1]! + 1]!,
    ];
    const c: [number, number] = [
      mesh.positions[3 * mesh.indices[at + 2]!]!,
      mesh.positions[3 * mesh.indices[at + 2]! + 1]!,
    ];
    area +=
      ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;
  }
  if (area !== 4) failures.push(`fixed original triangles changed area: ${area}`);
}

/** A square hole's source identities belong to a different evaluating chart. */
function inspectForeign(failures: string[]): void {
  const mesh: AutoMovieSolidMesh.IMesh = AutoMovieSolidMesh.create();
  const foreign: IAutoMovieSolidSurface = {
    name: "foreign",
    orientation: 1,
    jet(u: number, v: number): IAutoMovieSolidSurface.IJet {
      return planeJet(u - 100, v - 200);
    },
  };
  const owner: number = AutoMovieSolidMesh.owner(mesh, foreign);
  const chart: [number, number][] = [
    [1, 1],
    [2, 1],
    [3, 1],
    [3, 2],
    [3, 3],
    [2, 3],
    [1, 3],
    [1, 2],
  ];
  const vertices: number[] = chart.map(([u, v]: [number, number]): number =>
    AutoMovieSolidMesh.vertex(mesh, [u, v, 0], owner, u + 100, v + 200),
  );
  const before: string = JSON.stringify(mesh.coordinates);
  let open: AutoMovieSolidMesh.IOpen[] = [];
  try {
    open = AutoMovieSolidMesh.face(mesh, {
      surface: plane("native"),
      stations: [0, 1, 2, 3, 4],
      phases: [0, 1, 2, 3, 4],
      loops: [{ kind: "hole", vertices, chart }],
    });
  } catch (error) {
    failures.push(`foreign chart: ${String(error)}`);
    return;
  }
  let area: number = 0;
  const uses: Map<string, number> = new Map();
  for (let k: number = 0; k < mesh.indices.length; k += 3) {
    const [a, b, c]: number[] = mesh.indices.slice(k, k + 3);
    const ax: number = mesh.positions[3 * a!]!;
    const ay: number = mesh.positions[3 * a! + 1]!;
    const bx: number = mesh.positions[3 * b!]!;
    const by: number = mesh.positions[3 * b! + 1]!;
    const cx: number = mesh.positions[3 * c!]!;
    const cy: number = mesh.positions[3 * c! + 1]!;
    const signed: number = ((bx - ax) * (cy - ay) - (by - ay) * (cx - ax)) / 2;
    area += signed;
    const x: number = ax / 3 + bx / 3 + cx / 3;
    const y: number = ay / 3 + by / 3 + cy / 3;
    if (!(signed > 0) || (x > 1 && x < 3 && y > 1 && y < 3))
      failures.push(
        `foreign chart: triangle ${k / 3} left independent square-minus-hole region`,
      );
    for (const edge of [
      [a!, b!],
      [b!, c!],
      [c!, a!],
    ]) {
      const key: string = `${Math.min(edge[0]!, edge[1]!)}/${Math.max(edge[0]!, edge[1]!)}`;
      uses.set(key, (uses.get(key) ?? 0) + 1);
    }
  }
  if (!nclose(area, 12, 1e-11))
    failures.push(`foreign chart: area ${area}, expected 12`);
  if (JSON.stringify(mesh.coordinates.slice(0, chart.length * 3)) !== before)
    failures.push(
      "foreign chart: authoritative owner coordinates were overwritten",
    );
  for (let k: number = 0; k < vertices.length; k++) {
    const a: number = vertices[k]!;
    const b: number = vertices[(k + 1) % vertices.length]!;
    if (uses.get(`${Math.min(a, b)}/${Math.max(a, b)}`) !== 1)
      failures.push(`foreign chart: original edge ${k} was not retained`);
  }
  if (
    open.length !== 1 ||
    open[0]!.end !== null ||
    open[0]!.winding !== 0 ||
    open[0]!.chart.some(
      ([u, v]: [number, number]): boolean => u < 0 || u > 4 || v < 0 || v > 4,
    )
  )
    failures.push(
      "foreign chart: planar rim lost its own native occurrence data",
    );
}

/** A source may reuse its result storage; the face must retain each reading's value. */
function inspectAliased(failures: string[]): void {
  const reused: IAutoMovieSolidSurface.IJet = planeJet(0, 0);
  const source: IAutoMovieSolidSurface = {
    name: "reused-plane",
    orientation: 1,
    domain: [-Infinity, Infinity],
    jet(u: number, v: number): IAutoMovieSolidSurface.IJet {
      reused.p[0] = u;
      reused.p[1] = v;
      return reused;
    },
  };
  const mesh: AutoMovieSolidMesh.IMesh = AutoMovieSolidMesh.create();
  try {
    AutoMovieSolidMesh.face(mesh, {
      surface: source,
      stations: [0, 1, 2],
      phases: [0, 1, 2],
      loops: [],
    });
  } catch (error) {
    failures.push(`reused jet: ${String(error)}`);
    return;
  }
  for (let id: number = 0; id < mesh.positions.length / 3; id++)
    if (
      !nclose(mesh.positions[3 * id]!, mesh.coordinates[3 * id + 1]!, 1e-12) ||
      !nclose(mesh.positions[3 * id + 1]!, mesh.coordinates[3 * id + 2]!, 1e-12)
    )
      failures.push(`reused jet changed point ${id}`);
}

/** Independent affine plane with a regular finite jet. */
function plane(name: string): IAutoMovieSolidSurface {
  return { name, orientation: 1, jet: planeJet };
}

/** The exact six-vector jet of [u,v,0]. */
function planeJet(u: number, v: number): IAutoMovieSolidSurface.IJet {
  return {
    p: [u, v, 0],
    u: [1, 0, 0],
    v: [0, 1, 0],
    uu: [0, 0, 0],
    uv: [0, 0, 0],
    vv: [0, 0, 0],
  };
}

/** Shared IDs admit exact period lifts, never a nearby but different source coordinate. */
function inspectAuthority(failures: string[]): void {
  const source: IAutoMovieSolidSurface = HumanSolidShapes.cylinder("authority", [0, 0, 0], [0, 1, 0], [1, 0, 0], [0, 0, 1], 1);
  const period: number = 2 * Math.PI;
  for (const turns of [0, 1]) for (const noise of [0, 4 * Number.EPSILON]) {
    const mesh: AutoMovieSolidMesh.IMesh = AutoMovieSolidMesh.create();
    const owner: number = AutoMovieSolidMesh.owner(mesh, source);
    const first: [number, number][] = [[1, 0.5], [2, 0.5], [2, 1], [1, 1]];
    const firstIds: number[] = first.map(([u, v]: [number, number]): number => AutoMovieSolidMesh.vertex(mesh, source.jet(u, v).p, owner, u, v));
    const second: [number, number][] = [[2, 1 + turns * period + noise], [3, 1 + turns * period], [3, 1.5 + turns * period], [2, 1.5 + turns * period]];
    const secondIds: number[] = [firstIds[2]!, ...second.slice(1).map(([u, v]: [number, number]): number => AutoMovieSolidMesh.vertex(mesh, source.jet(u, v).p, owner, u, v))];
    const before: string = JSON.stringify(mesh);
    const reports: string[] = [];
    AutoMovieSolidMesh.face(mesh, { surface: source, stations: [0, 1, 2, 3, 4], phases: Array.from({ length: 16 }, (_: unknown, k: number): number => period * k / 16), loops: [{ kind: "hole", vertices: firstIds, chart: first }, { kind: "hole", vertices: secondIds, chart: second }], onFailure: (detail: string): void => { reports.push(detail); } });
    if (noise === 0) {
      if (reports.length !== 0 || mesh.indices.length === 0) failures.push(`exact shared authority/${turns}: ${reports.join(";")}`);
    } else if (reports.length !== 1 || !reports[0]!.includes("inconsistent face charts") || JSON.stringify(mesh) !== before) failures.push(`near-ULP shared authority/${turns}: ${reports.join(";")}`);
  }
}
