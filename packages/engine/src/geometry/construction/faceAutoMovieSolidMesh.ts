import { AutoMovieSolidCycle } from "./AutoMovieSolidCycle";
import type { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";
import type { AutoMovieSolidMeshConstraints } from "./AutoMovieSolidMeshConstraints";
import { AutoMovieSolidMeshPlan } from "./AutoMovieSolidMeshPlan";
import { AutoMovieSolidMeshWrite } from "./AutoMovieSolidMeshWrite";
import { gridAutoMovieSolidMesh } from "./gridAutoMovieSolidMesh";
import { openAutoMovieSolidMesh } from "./openAutoMovieSolidMesh";

/**
 * Prepare one complete source partition, then append its admitted face atomically.
 *
 * Named planning refusals call onFailure and return no face, or throw when no
 * callback was supplied. Source/keeps/callback exceptions propagate unchanged.
 * No mesh owner or buffer is appended until preparation and all diagnostics
 * have completed. Ordinary mutable arrays and coherent synchronous sources are
 * required; diagnostic callbacks must not mutate or reenter this mesh. Hostile
 * array proxies and allocation failure are not transactional.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Retains untouched full cells, triangulates the remaining native constrained region with original shared IDs, validates exposed domain boundaries and emits one declared orientation for the complete face.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Grid/source preparation, index planning, open-boundary reading and final writes have explicit owners; one commit point follows all fallible geometry preparation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not omit a missing-grid source, weld boundary vertices, zip unrelated cycles or use foreign owner coordinates as this face's chart. Named failure without a callback throws rather than silently returning an empty skin.
 * @evidence contracts/development/common.md#meaningful-documentation States named versus thrown failure, buffer/owner atomicity, partial endpoint diagnostics, chart orientation and the ordinary-array/coherent-source premise.
 * @evidence contracts/development/implementation.md#efficient-algorithms Prior global triangles cost one numeric comparison each per face and keys only for the triangles appended or taken back since the last face of the same mesh (`incidence`), so F faces over T triangles cost O(F T) comparisons and O(T) keys instead of O(F T) keys. Then grid O(G(S+L)), constraint/bridge/ear/insertion/legalization work, every membership query's cost and O(T log T) ordering of T staged triples. Occupied pairs exclude new interior bridges/ears; full cells or inserted cavities conflicting with prior incidence are refused without an alternative search.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses copied station-major jets, original boundary indices and returned split provenance; each committed new vertex is inserted once on its first actual use. The edge incidence of earlier faces is read once per triangle and kept for the mesh's later faces.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Call-local state includes grid G, triangles T, split edges S and provenance P. One incidence ledger per mesh, O(E_existing) pair and directed-edge counts and a copy of the index buffer, is held in a WeakMap keyed by the mesh and is released with it; it is brought to the buffer's actual contents on every call, so a truncated or refilled buffer is never read stale. Otherwise only actual mesh owners, vertex/index numbers and caller-owned open records survive.
 */
export function faceAutoMovieSolidMesh(
  mesh: AutoMovieSolidMesh.IMesh,
  input: AutoMovieSolidMesh.IFace,
): AutoMovieSolidMesh.IOpen[] {
  const prepared: ReturnType<typeof gridAutoMovieSolidMesh> =
    gridAutoMovieSolidMesh(mesh, input);
  if (prepared === null) return [];
  if (typeof prepared === "string") return refuse(input, prepared);
  const constraints: AutoMovieSolidMeshConstraints.ISegment[] = [
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
  const { occupied, directed }: ILedger = incidence(mesh);
  const fresh: Set<string> = new Set();

  /** Last actual predicate reading; recording it neither changes nor repeats successful queries. */
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
  const plan: AutoMovieSolidMeshPlan.IPlan | string =
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
  const triangles: AutoMovieSolidMeshPlan.ITriangle[] = [
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
  const opened: ReturnType<typeof openAutoMovieSolidMesh> =
    openAutoMovieSolidMesh(
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
    (triangle: AutoMovieSolidMeshPlan.ITriangle): [number, number, number] => [
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
  const open: AutoMovieSolidMesh.IOpen[] = opened.cycles.map(
    (cycle: AutoMovieSolidMesh.IOpen): AutoMovieSolidMesh.IOpen => ({
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
      if ((directed.get(key) ?? 0) !== 0 || fresh.has(key))
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
  AutoMovieSolidMeshWrite.emit(
    mesh,
    indices,
    input.surface.orientation * (input.inverted === true ? -1 : 1),
    true,
  );
  return open;
}

/** A mesh's edge incidence as its faces read it, with the index prefix it was read from. */
interface ILedger {
  /** The mesh's indices as last read, a copy. */
  seen: number[];

  /** Unoriented endpoint pairs `minID/maxID` of the read triangles. */
  occupied: Set<string>;

  /** How many read triangles hold each unoriented pair, so a pair leaves `occupied` with its last triangle. */
  pairs: Map<string, number>;

  /** How many read triangles hold each directed edge `a/b`. */
  directed: Map<string, number>;
}

/** One ledger per mesh, released with the mesh. */
const LEDGERS: WeakMap<AutoMovieSolidMesh.IMesh, ILedger> = new WeakMap();

/**
 * The edge incidence of every triangle a mesh holds now.
 *
 * Each face needs the pairs and directed edges of all earlier faces. Reading them from the whole index buffer for every face cost the
 * triangle count once per face in string keys, most of a body's realization once it had dozens of faces. The ledger keeps what it read: it
 * finds the first index at which the buffer differs from its copy, takes back the triangles it read from there on, since a checkpoint
 * restore truncates the buffer and later faces refill it, and reads the triangles the buffer now holds from there. The comparison is one
 * pass of numbers; only changed triangles cost keys.
 */
function incidence(mesh: AutoMovieSolidMesh.IMesh): ILedger {
  let ledger: ILedger | undefined = LEDGERS.get(mesh);
  if (ledger === undefined) {
    ledger = { seen: [], occupied: new Set(), pairs: new Map(), directed: new Map() };
    LEDGERS.set(mesh, ledger);
  }
  const { seen, occupied, pairs, directed }: ILedger = ledger;
  const common: number = Math.min(seen.length, mesh.indices.length);
  let same: number = 0;
  while (same < common && seen[same] === mesh.indices[same]) ++same;
  same -= same % 3;
  for (let index: number = same; index < seen.length; index += 3)
    for (let corner: number = 0; corner < 3; corner++) {
      const a: number = seen[index + corner]!;
      const b: number = seen[index + ((corner + 1) % 3)]!;
      const pair: string = `${Math.min(a, b)}/${Math.max(a, b)}`;
      const held: number = pairs.get(pair)! - 1;
      if (held === 0) {
        pairs.delete(pair);
        occupied.delete(pair);
      } else pairs.set(pair, held);
      const key: string = `${a}/${b}`;
      const count: number = directed.get(key)! - 1;
      if (count === 0) directed.delete(key);
      else directed.set(key, count);
    }
  seen.length = same;
  for (let index: number = same; index < mesh.indices.length; index += 3)
    for (let corner: number = 0; corner < 3; corner++) {
      const a: number = mesh.indices[index + corner]!;
      const b: number = mesh.indices[index + ((corner + 1) % 3)]!;
      const pair: string = `${Math.min(a, b)}/${Math.max(a, b)}`;
      pairs.set(pair, (pairs.get(pair) ?? 0) + 1);
      occupied.add(pair);
      const key: string = `${a}/${b}`;
      directed.set(key, (directed.get(key) ?? 0) + 1);
    }
  for (let index: number = same; index < mesh.indices.length; index++) seen.push(mesh.indices[index]!);
  return ledger;
}

/** Explain a failed reading against the unchanged polyline source, without another surface jet or altered admission. */
function membership(
  input: AutoMovieSolidMesh.IFace,
  source: (u: number, v: number) => boolean,
  u: number,
  v: number,
): string {
  const loops: {
    index: number;
    kind: AutoMovieSolidMesh.ILoop["kind"];
    kept: boolean;
    centre: [number, number];
    foot: AutoMovieSolidCycle.IFoot | null;
    edge: [number, number][];
  }[] = input.loops.map(
    (
      loop: AutoMovieSolidMesh.ILoop,
      index: number,
    ): {
      index: number;
      kind: AutoMovieSolidMesh.ILoop["kind"];
      kept: boolean;
      centre: [number, number];
      foot: AutoMovieSolidCycle.IFoot | null;
      edge: [number, number][];
    } => {
      const kept: boolean = AutoMovieSolidCycle.kept(
        loop,
        u,
        v,
        input.surface.period,
      );
      const foot: AutoMovieSolidCycle.IFoot | null = kept
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

/** Named planning refusal differs from arbitrary user/source callback exceptions. */
function refuse(
  input: AutoMovieSolidMesh.IFace,
  detail: string,
): AutoMovieSolidMesh.IOpen[] {
  if (input.onFailure === undefined)
    throw new Error(`${input.surface.name}: ${detail}`);
  input.onFailure(detail);
  return [];
}
