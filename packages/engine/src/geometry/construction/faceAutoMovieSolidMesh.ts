import type {
  IAutoMovieGridSolidMeshGrid,
  IAutoMovieOpenSolidMeshResult,
  IAutoMovieSolidCycle,
  IAutoMovieSolidMesh,
  IAutoMovieSolidMeshConstraints,
  IAutoMovieSolidMeshPlan,
} from "@automovie/interface";

import { AutoMovieSolidCycle } from "./AutoMovieSolidCycle";
import { AutoMovieSolidMeshPlan } from "./AutoMovieSolidMeshPlan";
import { AutoMovieSolidMeshWrite } from "./AutoMovieSolidMeshWrite";
import { gridAutoMovieSolidMesh } from "./gridAutoMovieSolidMesh";
import { openAutoMovieSolidMesh } from "./openAutoMovieSolidMesh";

/**
 * Prepare one complete source partition, then append its admitted face
 * atomically.
 *
 * Named planning refusals call onFailure and return no face, or throw when no
 * callback was supplied. Source/keeps/callback exceptions propagate unchanged.
 * No mesh owner or buffer is appended until preparation and all diagnostics
 * have completed. Ordinary mutable arrays and coherent synchronous sources are
 * required; diagnostic callbacks must not mutate or reenter this mesh. Hostile
 * array proxies and allocation failure are not transactional.
 */
export function faceAutoMovieSolidMesh(
  mesh: IAutoMovieSolidMesh.IMesh,
  input: IAutoMovieSolidMesh.IFace,
): IAutoMovieSolidMesh.IOpen[] {
  return append(mesh, input);
}

/** Fixed-scope face publication for one append-only tessellation. */
export namespace faceAutoMovieSolidMesh {
  /**
   * Prepare the existing edge incidence for a batch of faces. The caller gives
   * this closure exclusive ownership of mesh index writes during the batch.
   * Each admitted face adds its edges to that same incidence.
   */
  export function prepare(
    mesh: IAutoMovieSolidMesh.IMesh,
  ): (input: IAutoMovieSolidMesh.IFace) => IAutoMovieSolidMesh.IOpen[] {
    const incidence: IIncidence = edgesOf(mesh.indices);
    return (input: IAutoMovieSolidMesh.IFace): IAutoMovieSolidMesh.IOpen[] =>
      append(mesh, input, incidence);
  }
}

/** Append through the same admission path for isolated and grouped faces. */
function append(
  mesh: IAutoMovieSolidMesh.IMesh,
  input: IAutoMovieSolidMesh.IFace,
  incidence?: IIncidence,
): IAutoMovieSolidMesh.IOpen[] {
  const prepared: IAutoMovieGridSolidMeshGrid | null | string =
    gridAutoMovieSolidMesh(mesh, input);
  if (prepared === null) return [];
  if (typeof prepared === "string") return refuse(input, prepared);
  const constraints: IAutoMovieSolidMeshConstraints.ISegment[] = [
    ...prepared.trim,
    ...prepared.domain,
    ...prepared.boundary,
  ];
  const active: Map<number, readonly [number, number]> = new Map();
  for (const edge of constraints) {
    active.set(edge.a, prepared.chart.get(edge.a)!);
    active.set(edge.b, prepared.chart.get(edge.b)!);
  }
  for (const id of prepared.interior) active.set(id, prepared.chart.get(id)!);
  const { occupied, directed }: IIncidence = incidence ?? edgesOf(mesh.indices);
  const fresh: Set<string> = new Set();

  /**
   * Last actual predicate reading; recording it neither changes nor repeats
   * successful queries.
   */
  const reading: { u: number; v: number; kept: boolean } = {
    u: NaN,
    v: NaN,
    kept: false,
  };
  const keeps: (u: number, v: number) => boolean = (
    u: number,
    v: number,
  ): boolean => {
    const kept: boolean = prepared.residual(u, v);
    reading.u = u;
    reading.v = v;
    reading.kept = kept;
    return kept;
  };
  const plan: IAutoMovieSolidMeshPlan.IPlan | string =
    AutoMovieSolidMeshPlan.triangulate(
      active,
      constraints,
      keeps,
      input.surface.period,
      true,
      occupied,
      prepared.metric,
      prepared.local,
    );
  if (typeof plan === "string") {
    const detail: string =
      plan.includes("left the kept source partition") && !reading.kept
        ? `${plan}; membership ${membership(input, prepared.source, reading.u, reading.v)}`
        : plan;
    return refuse(input, detail);
  }
  const triangles: IAutoMovieSolidMeshPlan.ITriangle[] = [
    ...prepared.full,
    ...plan.triangles,
  ];
  const projected: Map<string, number> = new Map();
  const period: number | undefined = input.surface.period;
  for (const triangle of triangles) {
    if (period !== undefined) {
      const phases: number[] = triangle.vertices.map(
        (id: number, k: number): number =>
          prepared.chart.get(id)![1] + triangle.lifts[k]! * period,
      );
      if (
        !phases.every(Number.isFinite) ||
        Math.max(...phases) - Math.min(...phases) >= period / 2
      )
        return refuse(
          input,
          "indexed triangle has no unique sub-half-period cover",
        );
    }
    for (let k: number = 0; k < 3; k++) {
      const next: number = (k + 1) % 3;
      const a: number = triangle.vertices[k]!;
      const b: number = triangle.vertices[next]!;
      const pair: string = `${Math.min(a, b)}/${Math.max(a, b)}`;
      const turn: number =
        (triangle.lifts[next]! - triangle.lifts[k]!) * (a < b ? 1 : -1);
      const known: number | undefined = projected.get(pair);
      if (known !== undefined && known !== turn)
        return refuse(
          input,
          "distinct cover edges project onto one straight global mesh edge",
        );
      projected.set(pair, turn);
    }
  }
  const opened: IAutoMovieOpenSolidMeshResult | string = openAutoMovieSolidMesh(
    prepared.chart,
    triangles,
    plan.constraints,
    prepared.trim.length,
    prepared.domain.length,
    input.stations[0]!,
    input.stations[input.stations.length - 1]!,
    input.surface.period,
  );
  if (typeof opened === "string") return refuse(input, opened);
  if (opened.partial) {
    if (input.onFailure === undefined)
      throw new Error(
        `${input.surface.name}: partial periodic endpoint boundary cannot be capped or bridged`,
      );
    input.onFailure(
      "partial periodic endpoint boundary cannot be capped or bridged; admitted face remains partial",
    );
  }

  // Stage every mapping and tuple before the first mutation of public buffers.
  const ids: Map<number, number> = new Map();
  const added: number[] = [];
  const resolve: (id: number) => number = (id: number): number => {
    if (id < prepared.base) return id;
    const previous: number | undefined = ids.get(id);
    if (previous !== undefined) return previous;
    const assigned: number = prepared.base + added.length;
    ids.set(id, assigned);
    added.push(id);
    return assigned;
  };
  const indices: [number, number, number][] = triangles.map(
    (triangle: IAutoMovieSolidMeshPlan.ITriangle): [number, number, number] => [
      resolve(triangle.vertices[0]),
      resolve(triangle.vertices[1]),
      resolve(triangle.vertices[2]),
    ],
  );

  // Publish one index order independently of commuting ear removals. Only fresh
  // global index triples rotate; native covers, vertex insertion and geometry stay fixed.
  for (const triangle of indices) {
    const [a, b, c]: [number, number, number] = triangle;
    if (b < a && b < c) {
      triangle[0] = b;
      triangle[1] = c;
      triangle[2] = a;
    } else if (c < a && c < b) {
      triangle[0] = c;
      triangle[1] = a;
      triangle[2] = b;
    }
  }
  indices.sort(
    (a: [number, number, number], b: [number, number, number]): number =>
      a[0] - b[0] || a[1] - b[1] || a[2] - b[2],
  );
  const open: IAutoMovieSolidMesh.IOpen[] = opened.cycles.map(
    (cycle: IAutoMovieSolidMesh.IOpen): IAutoMovieSolidMesh.IOpen => ({
      ...cycle,
      vertices: cycle.vertices.map(resolve),
    }),
  );
  const positive: boolean =
    input.surface.orientation * (input.inverted === true ? -1 : 1) > 0;
  for (const triangle of indices)
    for (let corner: number = 0; corner < 3; corner++) {
      const a: number = triangle[corner]!;
      const b: number = triangle[(corner + 1) % 3]!;
      const key: string = positive ? `${a}/${b}` : `${b}/${a}`;
      if (directed.has(key) || fresh.has(key))
        return refuse(
          input,
          "published global edge already has this directed incidence",
        );
      fresh.add(key);
    }
  for (const id of added)
    if (!prepared.samples.has(id))
      return refuse(input, "planned vertex has no prepared source point");
  if (indices.length === 0 && open.length === 0) return [];

  const owner: number = AutoMovieSolidMeshWrite.owner(mesh, input.surface);
  for (const id of added) {
    const sample: NonNullable<ReturnType<typeof prepared.samples.get>> =
      prepared.samples.get(id)!;
    AutoMovieSolidMeshWrite.vertex(
      mesh,
      sample.point,
      owner,
      sample.chart[0],
      sample.chart[1],
    );
  }
  const start: number = mesh.indices.length;
  AutoMovieSolidMeshWrite.emit(
    mesh,
    indices,
    input.surface.orientation * (input.inverted === true ? -1 : 1),
    true,
  );
  if (incidence !== undefined) addEdges(incidence, mesh.indices, start);
  return open;
}

/** Edge incidence occupied by the current append-only output. */
interface IIncidence {
  /** Unoriented endpoint pairs `minID/maxID` of the published triangles. */
  occupied: Set<string>;
  /** Directed edges `a/b` of the same published triangles. */
  directed: Set<string>;
}

/** Build the incidence once from the operation's exact starting triangles. */
function edgesOf(indices: readonly number[]): IIncidence {
  const result: IIncidence = { occupied: new Set(), directed: new Set() };
  addEdges(result, indices, 0);
  return result;
}

/** Add the oriented and unoriented edges of newly admitted triangles. */
function addEdges(
  incidence: IIncidence,
  indices: readonly number[],
  start: number,
): void {
  for (let index: number = start; index < indices.length; index += 3)
    for (let corner: number = 0; corner < 3; corner++) {
      const a: number = indices[index + corner]!;
      const b: number = indices[index + ((corner + 1) % 3)]!;
      incidence.occupied.add(`${Math.min(a, b)}/${Math.max(a, b)}`);
      incidence.directed.add(`${a}/${b}`);
    }
}

/**
 * Explain a failed reading against the unchanged polyline source, without
 * another surface jet or altered admission.
 */
function membership(
  input: IAutoMovieSolidMesh.IFace,
  source: (u: number, v: number) => boolean,
  u: number,
  v: number,
): string {
  const loops: {
    index: number;
    kind: IAutoMovieSolidMesh.ILoop["kind"];
    kept: boolean;
    centre: [number, number];
    foot: IAutoMovieSolidCycle.IFoot | null;
    edge: [number, number][];
  }[] = input.loops.map(
    (
      loop: IAutoMovieSolidMesh.ILoop,
      index: number,
    ): {
      index: number;
      kind: IAutoMovieSolidMesh.ILoop["kind"];
      kept: boolean;
      centre: [number, number];
      foot: IAutoMovieSolidCycle.IFoot | null;
      edge: [number, number][];
    } => {
      const kept: boolean = AutoMovieSolidCycle.kept(
        loop,
        u,
        v,
        input.surface.period,
      );
      const foot: IAutoMovieSolidCycle.IFoot | null = kept
        ? null
        : AutoMovieSolidCycle.foot(loop, u, v, input.surface.period);
      return {
        index,
        kind: loop.kind,
        kept,
        centre: AutoMovieSolidCycle.centre(loop),
        foot,
        edge:
          foot === null
            ? []
            : [
                loop.chart[foot.segment]!,
                loop.chart[(foot.segment + 1) % loop.chart.length]!,
              ],
      };
    },
  );
  return JSON.stringify({
    query: [u, v],
    source: source(u, v),
    residual: false,
    stationDomain: [
      input.stations[0],
      input.stations[input.stations.length - 1],
    ],
    phaseDomain: [input.phases[0], input.phases[input.phases.length - 1]],
    period: input.surface.period,
    loops,
  });
}

/**
 * Named planning refusal differs from arbitrary user/source callback
 * exceptions.
 */
function refuse(
  input: IAutoMovieSolidMesh.IFace,
  detail: string,
): IAutoMovieSolidMesh.IOpen[] {
  if (input.onFailure === undefined)
    throw new Error(`${input.surface.name}: ${detail}`);
  input.onFailure(detail);
  return [];
}
