import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import { AutoMovieSolidCycle } from "./AutoMovieSolidCycle";
import type { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";
import { AutoMovieSolidMeshAuthorities } from "./AutoMovieSolidMeshAuthorities";
import { AutoMovieSolidMeshConstraints } from "./AutoMovieSolidMeshConstraints";
import { AutoMovieSolidMeshLoop } from "./AutoMovieSolidMeshLoop";
import type { AutoMovieSolidMeshPlan } from "./AutoMovieSolidMeshPlan";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";
import { domainAutoMovieSolidMesh } from "./domainAutoMovieSolidMesh";

/** Native station/phase point. */
type Point = readonly [number, number];
/** World-space millimetre vector. */
type Vec3 = AutoMovieSolidVector.Vec3;
/** Existing vector lengths and analytic chart-cross arithmetic. */
const { cross, norm }: typeof AutoMovieSolidVector = AutoMovieSolidVector;

/** One locally evaluated, not yet published sampling point. */
interface Sample {
  /** Copied world point. */
  point: Vec3;

  /** Its owner-local chart. */
  chart: Point;
}

/** Face-local grid, source partition and provisional point catalogue. */
interface Grid {
  /** Existing global vertex count before any face write. */
  base: number;

  /** Face-specific charts, including foreign-owner shared source indices. */
  chart: Map<number, Point>;

  /** New provisional IDs and their evaluated source points. */
  samples: Map<number, Sample>;

  /** Original indexed trim segments. */
  trim: AutoMovieSolidMeshConstraints.ISegment[];

  /** Domain segments after authoritative-boundary precedence. */
  domain: AutoMovieSolidMeshConstraints.ISegment[];

  /** Retained full cells' complete directed boundary incidence. */
  boundary: AutoMovieSolidMeshConstraints.ISegment[];

  /** Retained full-cell triangles in positive native-chart order. */
  full: AutoMovieSolidMeshPlan.ITriangle[];

  /** Originally metric-kept sampling points not already part of a full cell/domain. */
  interior: number[];

  /** Original kept source, independent of the sampling margin. */
  source: (u: number, v: number) => boolean;

  /** Original source minus already retained full cells. */
  residual: (u: number, v: number) => boolean;

  /**
   * Phase scale of the face's uniform metric, length units per radian: the
   * mean first fundamental form over the grid jets without its shear term,
   * `sqrt(mean G / mean E)` with `E = |S_u|^2` and `G = |S_v|^2`. It carries
   * the length unit, so a body in another unit legalizes alike.
   */
  metric: number;
}

/**
 * Prepare a trimmed face's sampling grid without changing any mesh buffer.
 *
 * Surface jets are queried in station-major order and copied before the next
 * query can reuse a returned vector. Metric-margin corner selection is retained,
 * but a cell touching any trim segment's conservative chart bounding box is
 * left for residual triangulation. Original domain authorities prevent
 * unshared subdivision, while an exactly consumed full side or isolated
 * cell-corner contact can retain its cell. They are not cutting loops.
 * This prevents a small hole inside one cell
 * from being filled merely because its four corners are kept.
 *
 * Boundary points keep their original IDs and use ILoop.chart on this face,
 * independently of the coordinates their global mesh owner stores. Newly
 * reserved grid IDs remain local until a successful face plan is committed.
 * Source/grid/loop data must stay coherent during this synchronous preparation.
 * An explicit numeric physical2 admission failure is a named refusal; actual
 * source callback and ownership errors retain their original thrown identity.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Keeps the original analytic grid readings and point metric, excludes potentially cut full cells, and prepares original-source and residual membership separately from the sampling margin.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One local record carries provisional points, indexed constraints and full-cell triangles; domain assembly and residual triangulation have separate owners.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing retained grid is not an empty source. No trim index is reconstructed/welded, no full cell is admitted solely from corner flags and no mesh mutation occurs before all downstream planning succeeds.
 * @evidence contracts/development/common.md#meaningful-documentation States copied-jet lifetime, station-major exceptions, foreign-owner face charts, conservative cell exclusion and immutable-source premise. Periodic trim primitives use the local half-period family consumed by the existing kept-side reader.
 * @evidence contracts/development/implementation.md#efficient-algorithms Reads G grid jets once and performs O(G(S+L)) true-cut classification, conservative cell tests over only the barriers whose station range meets each cell's interval (bucketed once in O((S+D) R) for R intervals) and O(G(S+D)) boundary-contact scans for S cut segments, D domain authority segments and C cells. Domain work and the cost of each source predicate are additional, not constant-time assumptions.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares station/phase spacings, copied jets and grid-index reservations; source readers and full-cell lookup serve all residual queries within this face.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources O(G+S+L) grid/constraint/catalogue state is local; returned closures retain their source readers and cell table only until the caller finishes this face, with no global cache.
 */
export function gridAutoMovieSolidMesh(
  mesh: AutoMovieSolidMesh.IMesh,
  input: AutoMovieSolidMesh.IFace,
): Grid | null | string {
  const { surface, stations, phases, loops }: AutoMovieSolidMesh.IFace = input;
  const period: number | undefined = surface.period;
  if (
    mesh.positions.length % 3 !== 0 ||
    mesh.coordinates.length !== mesh.positions.length
  )
    return "face requires aligned indexed position/chart buffers";
  if (
    (period !== undefined && !(Number.isFinite(period) && period > 0)) ||
    (surface.orientation !== 1 && surface.orientation !== -1)
  )
    return "face needs a positive finite period and a declared orientation sign";
  if (
    stations.some(
      (value: number, k: number): boolean =>
        !Number.isFinite(value) || (k > 0 && !(value > stations[k - 1]!)),
    ) ||
    phases.some(
      (value: number, k: number): boolean =>
        !Number.isFinite(value) || (k > 0 && !(value > phases[k - 1]!)),
    )
  )
    return "face grid needs finite strictly increasing coordinates";
  if (stations.length < 2 || phases.length < 2) return null;
  if (
    period !== undefined &&
    (phases.length < 3 || !(phases[phases.length - 1]! - phases[0]! < period))
  )
    return "periodic face needs at least three phases inside one unrepeated period";
  const base: number = mesh.positions.length / 3;
  const chart: Map<number, Point> = new Map();
  const trim: AutoMovieSolidMeshConstraints.ISegment[] | string =
    AutoMovieSolidMeshAuthorities.collect(mesh, loops, chart, period);
  if (typeof trim === "string") return trim;
  const domainAuthorities: AutoMovieSolidMeshConstraints.ISegment[] | string =
    AutoMovieSolidMeshAuthorities.domainSegments(mesh, input, chart, period);
  if (typeof domainAuthorities === "string") return domainAuthorities;
  const barriers: AutoMovieSolidMeshConstraints.ISegment[] =
    domainAuthorities.length === 0 ? trim : [...trim, ...domainAuthorities];
  const jets: IAutoMovieSolidSurface.IJet[][] = [];
  for (const u of stations) {
    const row: IAutoMovieSolidSurface.IJet[] = [];
    for (const v of phases) {
      let read: IAutoMovieSolidSurface.IJet;
      try {
        read = surface.jet(u, v);
      } catch (error: unknown) {
        if (error instanceof AutoMovieLoftAdmissionError)
          return `face grid has unavailable source physical2: ${error.message}`;
        throw error;
      }
      const copied: IAutoMovieSolidSurface.IJet | string = copy(read);
      if (typeof copied === "string") return copied;
      row.push(copied);
    }
    jets.push(row);
  }
  // The uniform metric of residual legalization (George and Borouchaki 1998,
  // Delaunay Triangulation and Meshing): mean |S_u|^2 and |S_v|^2 over the
  // copied grid jets, unrounded so the scale follows the length unit.
  let first: number = 0;
  let second: number = 0;
  for (const row of jets)
    for (const jet of row) {
      first += norm(jet.u) ** 2;
      second += norm(jet.v) ** 2;
    }
  const metric: number = Math.sqrt(second / first);
  if (!(Number.isFinite(metric) && metric > 0))
    return "face grid has no representable uniform metric";
  const samples: Map<number, Sample> = new Map();
  const reserved: Map<number, number> = new Map();
  const authorities: Map<string, number> = new Map();
  const coordinateKey: (u: number, v: number) => string = (
    u: number,
    v: number,
  ): string =>
    `${u}/${period === undefined ? v : v - period * Math.floor((v - phases[0]!) / period)}`;
  for (const entry of chart) {
    const [id, point]: [number, Point] = entry;
    const key: string = coordinateKey(point[0], point[1]);
    const known: number | undefined = authorities.get(key);
    if (known !== undefined && known !== id)
      return "face has coincident distinct source authorities";
    authorities.set(key, id);
  }
  const at: (i: number, j: number) => number = (
    i: number,
    j: number,
  ): number => {
    const column: number = j % phases.length;
    const key: number = i * phases.length + column;
    const previous: number | undefined = reserved.get(key);
    if (previous !== undefined) return previous;
    const point: Point = [stations[i]!, phases[column]!];
    const authority: number | undefined = authorities.get(
      coordinateKey(point[0], point[1]),
    );
    const id: number = authority ?? base + samples.size;
    if (authority === undefined) {
      samples.set(id, { point: jets[i]![column]!.p, chart: point });
      chart.set(id, point);
    }
    reserved.set(key, id);
    return id;
  };
  const classify: ReturnType<typeof AutoMovieSolidMeshLoop.prepare> =
    AutoMovieSolidMeshLoop.prepare(loops, period);
  const du: number[] = stations.map((u: number, i: number): number =>
    Math.min(
      ...[stations[i - 1], stations[i + 1]]
        .filter(
          (value: number | undefined): value is number => value !== undefined,
        )
        .map((value: number): number => Math.abs(value - u)),
    ),
  );
  const dv: number[] = phases.map((v: number, j: number): number =>
    Math.abs(
      (phases[j + 1] ??
        (period === undefined ? phases[j - 1]! : phases[0]! + period)) - v,
    ),
  );
  if (
    period !== undefined &&
    dv.some((gap: number): boolean => gap > period / 2)
  )
    return "periodic face grid exceeds the local half-period family";
  const kept: boolean[][] = stations.map((u: number, i: number): boolean[] =>
    phases.map((v: number, j: number): boolean =>
      classify(
        u,
        v,
        jets[i]![j]!,
        0.5 *
          Math.min(
            norm(jets[i]![j]!.u) * du[i]!,
            norm(jets[i]![j]!.v) * dv[j]!,
          ),
      ),
    ),
  );
  const columns: number =
    period === undefined ? phases.length - 1 : phases.length;
  const cells: boolean[][] = Array.from(
    { length: stations.length - 1 },
    (): boolean[] => new Array<boolean>(columns).fill(false),
  );
  const full: AutoMovieSolidMeshPlan.ITriangle[] = [];
  const boundary: Map<string, AutoMovieSolidMeshConstraints.ISegment> =
    new Map();

  // The barriers each station interval can meet, in their own order: a
  // barrier whose station range misses an interval touches none of its cells,
  // so each cell reads only its interval's few instead of the face's all.
  const crossing: number[][] = Array.from(
    { length: Math.max(0, stations.length - 1) },
    (): number[] => [],
  );
  for (const [index, edge] of barriers.entries()) {
    const a: Point | undefined = chart.get(edge.a);
    const b: Point | undefined = chart.get(edge.b);
    // A barrier without both chart points is offered to every interval, so
    // the cell test meets it exactly as before.
    const low: number =
      a === undefined || b === undefined ? -Infinity : Math.min(a[0], b[0]);
    const high: number =
      a === undefined || b === undefined ? Infinity : Math.max(a[0], b[0]);
    for (let i: number = 0; i + 1 < stations.length; i++)
      if (!(high < stations[i]! || low > stations[i + 1]!))
        crossing[i]!.push(index);
  }
  for (let i: number = 0; i + 1 < stations.length; i++)
    for (let j: number = 0; j < columns; j++) {
      const next: number = (j + 1) % phases.length;
      if (
        !(
          kept[i]![j]! &&
          kept[i + 1]![j]! &&
          kept[i + 1]![next]! &&
          kept[i]![next]!
        )
      )
        continue;
      const touched: boolean | string = touches(
        chart,
        barriers,
        crossing[i]!,
        stations[i]!,
        stations[i + 1]!,
        phases[j]!,
        phases[j + 1] ?? phases[0]! + period!,
        period,
        trim.length,
      );
      if (typeof touched === "string") return touched;
      if (touched) continue;
      cells[i]![j] = true;
      const a: number = at(i, j);
      const b: number = at(i + 1, j);
      const c: number = at(i + 1, next);
      const d: number = at(i, next);
      const wrap: number = next === 0 ? 1 : 0;
      full.push(
        { vertices: [a, b, c], lifts: [0, 0, wrap] },
        { vertices: [a, c, d], lifts: [0, wrap, wrap] },
      );
      for (const edge of [
        { a, b, turn: 0 },
        { a: b, b: c, turn: wrap },
        { a: c, b: d, turn: 0 },
        { a: d, b: a, turn: -wrap },
      ]) {
        const key: string =
          edge.a < edge.b
            ? `${edge.a}/${edge.b}/${edge.turn}`
            : `${edge.b}/${edge.a}/${-edge.turn}`;
        if (boundary.has(key)) boundary.delete(key);
        else boundary.set(key, edge);
      }
    }
  const readers: ((u: number, v: number) => boolean)[] = loops.map(
    (loop: AutoMovieSolidMesh.ILoop): ((u: number, v: number) => boolean) =>
      AutoMovieSolidCycle.prepare(loop, period),
  );
  const source: (u: number, v: number) => boolean = (
    u: number,
    v: number,
  ): boolean =>
    Number.isFinite(u) &&
    Number.isFinite(v) &&
    u >= stations[0]! &&
    u <= stations[stations.length - 1]! &&
    (period !== undefined ||
      (v >= phases[0]! && v <= phases[phases.length - 1]!)) &&
    readers.every((reader: (u: number, v: number) => boolean): boolean =>
      reader(u, v),
    );
  const residual: (u: number, v: number) => boolean = (
    u: number,
    v: number,
  ): boolean => {
    if (
      !Number.isFinite(u) ||
      !Number.isFinite(v) ||
      u < stations[0]! ||
      u > stations[stations.length - 1]! ||
      (period === undefined &&
        (v < phases[0]! || v > phases[phases.length - 1]!))
    )
      return false;
    const phase: number =
      period === undefined
        ? v
        : v - period * Math.floor((v - phases[0]!) / period);
    if (
      cells[interval(stations, u)]![
        interval(phases, phase, period !== undefined)
      ] === true
    )
      return false;
    return source(u, v);
  };
  const domain: AutoMovieSolidMeshConstraints.ISegment[] | string =
    domainAutoMovieSolidMesh(chart, barriers, stations, phases, at, period);
  if (typeof domain === "string") return domain;
  const interior: number[] = [];
  for (let i: number = 0; i < stations.length; i++)
    for (let j: number = 0; j < phases.length; j++) {
      if (
        reserved.has(i * phases.length + j) ||
        !kept[i]![j]! ||
        !residual(stations[i]!, phases[j]!)
      )
        continue;
      const contact: boolean | string = AutoMovieSolidMeshConstraints.contains(
        chart,
        barriers,
        [stations[i]!, phases[j]!],
        period,
      );
      if (typeof contact === "string") return contact;
      if (!contact) interior.push(at(i, j));
    }
  return {
    base,
    chart,
    samples,
    trim,
    domain,
    boundary: [...boundary.values()],
    full,
    interior,
    source,
    residual,
    metric,
  };
}

/** Copy one coherent reading before a subsequent source call can reuse its storage. */
function copy(
  jet: IAutoMovieSolidSurface.IJet,
): IAutoMovieSolidSurface.IJet | string {
  const vectors: Vec3[] = [jet.p, jet.u, jet.v, jet.uu, jet.uv, jet.vv];
  if (
    !vectors.every(
      (value: Vec3): boolean =>
        value.length === 3 && value.every(Number.isFinite),
    )
  )
    return "face source jet must contain finite three-component vectors";
  const values: Vec3[] = vectors.map(
    (value: Vec3): Vec3 => [value[0], value[1], value[2]],
  );
  const length: number = norm(cross(values[1]!, values[2]!));
  if (!(Number.isFinite(length) && length > 0))
    return "face grid needs regular representable chart jets; a contracted pole needs its closure owner";
  return {
    p: values[0]!,
    u: values[1]!,
    v: values[2]!,
    uu: values[3]!,
    uv: values[4]!,
    vv: values[5]!,
  };
}

/** True cuts retain their conservative bound; exactly consumed domain sides do not discard a source grid cell. `candidates` are the indices of the barriers whose station range meets the cell's, in increasing order. */
function touches(
  chart: ReadonlyMap<number, Point>,
  trim: readonly AutoMovieSolidMeshConstraints.ISegment[],
  candidates: readonly number[],
  u0: number,
  u1: number,
  v0: number,
  v1: number,
  period: number | undefined,
  domainFrom: number,
): boolean | string {
  for (const index of candidates) {
    const edge: AutoMovieSolidMeshConstraints.ISegment = trim[index]!;
    const a: Point = chart.get(edge.a)!;
    const b: Point = chart.get(edge.b)!;
    if (Math.max(a[0], b[0]) < u0 || Math.min(a[0], b[0]) > u1) continue;
    const nearest: number =
      period === undefined ? 0 : Math.round((v0 / 2 + v1 / 2 - a[1]) / period);
    for (const lift of period === undefined
      ? [0]
      : [nearest - 1, nearest, nearest + 1]) {
      const first: number = a[1] + lift * (period ?? 0);
      const last: number = b[1] + (lift + edge.turn) * (period ?? 0);
      if (
        !Number.isSafeInteger(lift) ||
        !Number.isFinite(first) ||
        !Number.isFinite(last)
      )
        return "cell/trim cover is not representable";
      if (Math.max(first, last) >= v0 && Math.min(first, last) <= v1)
        if (
          index < domainFrom ||
          !AutoMovieSolidMeshAuthorities.consumedByCell(
            [a[0], first],
            [b[0], last],
            [u0, u1],
            [v0, v1],
          )
        )
          return true;
    }
  }
  return false;
}

/** Locate the closed grid interval used for residual sampling-cell exclusion. */
function interval(
  values: readonly number[],
  value: number,
  periodic: boolean = false,
): number {
  if (periodic && value >= values[values.length - 1]!) return values.length - 1;
  let first: number = 0;
  let last: number = values.length - 1;
  while (last - first > 1) {
    const middle: number = Math.floor((first + last) / 2);
    if (value < values[middle]!) last = middle;
    else first = middle;
  }
  return first;
}
