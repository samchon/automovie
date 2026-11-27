import type {
  AutoMovieVector2Tuple,
  AutoMovieVector3Tuple,
  IAutoMovieGridSolidMeshGrid,
  IAutoMovieGridSolidMeshSample,
  IAutoMovieSolidMesh,
  IAutoMovieSolidMeshConstraints,
  IAutoMovieSolidMeshLoop,
  IAutoMovieSolidMeshPlan,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieLoftAdmissionError } from "../../AutoMovieLoftAdmissionError";
import { AutoMovieSolidCycle } from "../../AutoMovieSolidCycle";
import { AutoMovieSolidMeshAuthorities } from "../../AutoMovieSolidMeshAuthorities";
import { AutoMovieSolidMeshConstraints } from "../../AutoMovieSolidMeshConstraints";
import { AutoMovieSolidMeshLoop } from "../../AutoMovieSolidMeshLoop";
import { AutoMovieSolidVector } from "../../AutoMovieSolidVector";
import { domainAutoMovieSolidMesh } from "./domainAutoMovieSolidMesh";

/*
 * Prepare a trimmed face's sampling grid without changing any mesh buffer.
 *
 * Surface jets are queried in station-major order and copied before the next
 * query can reuse a returned vector. Metric-margin corner selection is
 * retained, but a cell touching any trim segment's conservative chart bounding
 * box is left for residual triangulation. Original domain authorities prevent
 * unshared subdivision, while an exactly consumed full side or isolated
 * cell-corner contact can retain its cell. They are not cutting loops. This
 * prevents a small hole inside one cell from being filled merely because its
 * four corners are kept.
 *
 * Boundary points keep their original IDs and use ILoop.chart on this face,
 * independently of the coordinates their global mesh owner stores. Newly
 * reserved grid IDs remain local until a successful face plan is committed.
 * Source/grid/loop data must stay coherent during this synchronous preparation.
 * An explicit numeric physical2 admission failure is a named refusal; actual
 * source callback and ownership errors retain their original thrown identity.
 */
export function gridAutoMovieSolidMesh(
  mesh: IAutoMovieSolidMesh.IMesh,
  input: IAutoMovieSolidMesh.IFace,
): IAutoMovieGridSolidMeshGrid | null | string {
  const { surface, stations, phases, loops }: IAutoMovieSolidMesh.IFace = input;
  const period: number | undefined = surface.period;
  if (
    mesh.positions.length % 3 !== 0 ||
    mesh.coordinates.length !== mesh.positions.length
  )
    return "face requires aligned indexed position/chart buffers";
  if (
    (period !== undefined && !(period > 0)) ||
    (surface.orientation !== 1 && surface.orientation !== -1)
  )
    return "face needs a positive finite period and a declared orientation sign";
  if (
    stations.some(
      (value: number, k: number): boolean =>
        k > 0 && !(value > stations[k - 1]!),
    ) ||
    phases.some(
      (value: number, k: number): boolean => k > 0 && !(value > phases[k - 1]!),
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
  const chart: Map<number, Readonly<AutoMovieVector2Tuple>> = new Map();
  const trim: IAutoMovieSolidMeshConstraints.ISegment[] | string =
    AutoMovieSolidMeshAuthorities.collect(mesh, loops, chart, period);
  if (typeof trim === "string") return trim;
  const domainAuthorities: IAutoMovieSolidMeshConstraints.ISegment[] | string =
    AutoMovieSolidMeshAuthorities.domainSegments(mesh, input, chart, period);
  if (typeof domainAuthorities === "string") return domainAuthorities;
  const barriers: IAutoMovieSolidMeshConstraints.ISegment[] =
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
  if (!(metric > 0)) return "face grid has no representable uniform metric";
  const samples: Map<number, IAutoMovieGridSolidMeshSample> = new Map();
  const reserved: Map<number, number> = new Map();
  const authorities: Map<string, number> = new Map();
  const coordinateKey: (u: number, v: number) => string = (
    u: number,
    v: number,
  ): string =>
    `${u}/${period === undefined ? v : v - period * Math.floor((v - phases[0]!) / period)}`;
  for (const entry of chart) {
    const [id, point]: [number, Readonly<AutoMovieVector2Tuple>] = entry;
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
    const point: Readonly<AutoMovieVector2Tuple> = [
      stations[i]!,
      phases[column]!,
    ];
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

  // A quadrilateral's own first fundamental form: the least-squares linear map from its four chart points to their skin points about
  // their centroids, `J = (sum dX dC^T)(sum dC dC^T)^-1`, read as the shear and scale of `J^T J` over its first entry.
  const point = (id: number): readonly number[] | undefined =>
    id < base
      ? [
          mesh.positions[3 * id]!,
          mesh.positions[3 * id + 1]!,
          mesh.positions[3 * id + 2]!,
        ]
      : samples.get(id)?.point;
  const local = (
    ids: readonly number[],
    charts: readonly Readonly<AutoMovieVector2Tuple>[],
  ): [number, number] => {
    const skins: (readonly number[] | undefined)[] = ids.map(point);
    if (
      skins.some((x: readonly number[] | undefined): boolean => x === undefined)
    )
      return [0, metric];
    const n: number = charts.length;
    const cu: number =
      charts.reduce(
        (s: number, c: Readonly<AutoMovieVector2Tuple>): number => s + c[0],
        0,
      ) / n;
    const cv: number =
      charts.reduce(
        (s: number, c: Readonly<AutoMovieVector2Tuple>): number => s + c[1],
        0,
      ) / n;
    const mean: number[] = [0, 1, 2].map(
      (a: number): number =>
        skins.reduce(
          (s: number, x: readonly number[] | undefined): number => s + x![a]!,
          0,
        ) / n,
    );
    let suu: number = 0;
    let suv: number = 0;
    let svv: number = 0;
    const xu: number[] = [0, 0, 0];
    const xv: number[] = [0, 0, 0];
    charts.forEach((c: Readonly<AutoMovieVector2Tuple>, k: number): void => {
      const du: number = c[0] - cu;
      const dv: number = c[1] - cv;
      suu += du * du;
      suv += du * dv;
      svv += dv * dv;
      for (let a: number = 0; a < 3; a++) {
        const dx: number = skins[k]![a]! - mean[a]!;
        xu[a] = xu[a]! + dx * du;
        xv[a] = xv[a]! + dx * dv;
      }
    });
    const det: number = suu * svv - suv * suv;
    if (!(det > 0)) return [0, metric];
    const su: number[] = [0, 1, 2].map(
      (a: number): number => (xu[a]! * svv - xv[a]! * suv) / det,
    );
    const sv: number[] = [0, 1, 2].map(
      (a: number): number => (xv[a]! * suu - xu[a]! * suv) / det,
    );
    const e: number = su[0]! ** 2 + su[1]! ** 2 + su[2]! ** 2;
    const f: number = su[0]! * sv[0]! + su[1]! * sv[1]! + su[2]! * sv[2]!;
    const g: number = sv[0]! ** 2 + sv[1]! ** 2 + sv[2]! ** 2;
    const shear: number = f / e;
    const scale: number = Math.sqrt(g / e - shear * shear);
    return scale > 0 ? [shear, scale] : [0, metric];
  };
  const classify: IAutoMovieSolidMeshLoop.Classifier =
    AutoMovieSolidMeshLoop.prepare(loops, period);
  const du: number[] = stations.map((u: number, i: number): number =>
    Math.min(
      ...[stations[i - 1], stations[i + 1]]
        .flatMap((value: number | undefined): number[] =>
          value === undefined ? [] : [value],
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
  const full: IAutoMovieSolidMeshPlan.ITriangle[] = [];
  const cuts: {
    a: number;
    b: number;
    c: number;
    d: number;
    wrap: number;
    choice: "first" | "other" | "tie";
    first: number;
    other: number;
  }[] = [];
  const boundary: Map<string, IAutoMovieSolidMeshConstraints.ISegment> =
    new Map();

  // The barriers each station interval can meet, in their own order: a
  // barrier whose station range misses an interval touches none of its cells,
  // so each cell reads only its interval's few instead of the face's all.
  const crossing: number[][] = Array.from(
    { length: Math.max(0, stations.length - 1) },
    (): number[] => [],
  );
  for (const [index, edge] of barriers.entries()) {
    const a: Readonly<AutoMovieVector2Tuple> | undefined = chart.get(edge.a);
    const b: Readonly<AutoMovieVector2Tuple> | undefined = chart.get(edge.b);
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

      // A full cell is cut from its first corner unless its other diagonal
      // bends the cell's two triangles against each other by well under half
      // as much (`BEND`). Cut always from its first corner, a cell sheared by
      // a chart whose phase lines wind round the part took the diagonal
      // across the skin's curve, and its two triangles stood at different
      // slopes in a check over the whole face (f1's deltoid). Cut by the sign
      // of the Delaunay test in the cell's own form, nearly square cells took
      // either diagonal by rounding, and where the choice changed a zigzag
      // line ran across the face (f1's upper lip).
      // A cell neither of whose splits is clearly flatter takes the diagonal its face's other such cells take, decided once for the face
      // below (`DIAGONAL`), so the rule reads the geometry alone and a chart and its mirror image cut mirror-image cells.
      const [pa, pb, pc, pd]: AutoMovieVector3Tuple[] = [
        jets[i]![j]!.p,
        jets[i + 1]![j]!.p,
        jets[i + 1]![next]!.p,
        jets[i]![next]!.p,
      ];
      const [first, other]: number[] = [
        bend(pa, pb, pc, pd),
        bend(pb, pc, pd, pa),
      ];
      cuts.push({
        a,
        b,
        c,
        d,
        wrap,
        choice:
          other < BEND * first
            ? "other"
            : first < BEND * other
              ? "first"
              : "tie",
        first: norm(sub(pc, pa)),
        other: norm(sub(pd, pb)),
      });
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

  // The face's undecided cells all take the diagonal family that is the shorter in sum over them (`DIAGONAL`). The sums are compared
  // relatively: on a face whose two families are equally long (a prism's or a cylinder's cells) they differ only by rounding, which
  // changes with the face's size, so an exact comparison cut the same face differently at two scales.
  const ties: { first: number; other: number }[] = cuts.filter(
    (cut: (typeof cuts)[number]): boolean => cut.choice === "tie",
  );
  const sums: { first: number; other: number } = {
    first: ties.reduce(
      (sum: number, cut: { first: number; other: number }): number =>
        sum + cut.first,
      0,
    ),
    other: ties.reduce(
      (sum: number, cut: { first: number; other: number }): number =>
        sum + cut.other,
      0,
    ),
  };
  const tie: "first" | "other" =
    sums.other < sums.first * (1 - DIAGONAL_ROUNDING) ? "other" : "first";
  for (const cut of cuts)
    if ((cut.choice === "tie" ? tie : cut.choice) === "other")
      full.push(
        { vertices: [cut.a, cut.b, cut.d], lifts: [0, 0, cut.wrap] },
        { vertices: [cut.b, cut.c, cut.d], lifts: [0, cut.wrap, cut.wrap] },
      );
    else
      full.push(
        { vertices: [cut.a, cut.b, cut.c], lifts: [0, 0, cut.wrap] },
        { vertices: [cut.a, cut.c, cut.d], lifts: [0, cut.wrap, cut.wrap] },
      );
  const readers: ((u: number, v: number) => boolean)[] = loops.map(
    (loop: IAutoMovieSolidMesh.ILoop): ((u: number, v: number) => boolean) =>
      AutoMovieSolidCycle.prepare(loop, period),
  );
  const source: (u: number, v: number) => boolean = (
    u: number,
    v: number,
  ): boolean =>
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
  const domain: IAutoMovieSolidMeshConstraints.ISegment[] | string =
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
    local,
  };
}

/*
 * Existing vector lengths and analytic chart-cross arithmetic.
 */
const { cross, norm, sub }: typeof AutoMovieSolidVector = AutoMovieSolidVector;

/*
 * Share of the first-corner split's bend below which a full cell takes its
 * other diagonal (`bend`). A cell whose two splits bend alike, as the nearly
 * square cells over f1's upper lip do, keeps its first corner, so a face is cut
 * alike wherever no split is clearly flatter. Compared on
 * `shoulder.high-oblique` and `head.front`: at 0.5 the deltoid's cap kept its
 * check; at 0.9 the check is gone but for a few cells at its top edge and the
 * lip is cut as it was before any cell was turned.
 *
 * A cell neither of whose splits bends under this share of the other's is
 * undecided, and all of a face's undecided cells take one diagonal family: the
 * one whose diagonals are the shorter in sum over them. Undecided cells had
 * kept their first corner, which is the chart's, not the skin's: a mirrored
 * chart runs its phases the other way, so its first corner is the original's
 * other one, and f1's -Z hand was cut unlike the +Z hand's mirror image (its
 * vertices 0.5 mm off, 2 mm once the fork fills slid along those edges). Read
 * on lengths summed over the face, a face cut alike stays cut alike and its
 * mirror is cut as its mirror image; only a face whose two families sum to
 * exactly the same length falls back to the first corner.
 */
const BEND: number = 0.9;

/*
 * Relative difference under which a face's two diagonal families count as
 * equally long, and its undecided cells keep the first corner. Summing some
 * thousands of lengths carries a relative rounding near 1e-13, so 1e-9 stands
 * four decades above the noise and far under any difference a face's shape
 * makes; `test_construction_determinism` realizes one assembly at two sizes and
 * requires the same cells.
 */
const DIAGONAL_ROUNDING: number = 1e-9;

/*
 * The angle between the unit normals of the two triangles a quadrilateral is
 * cut into along its diagonal `p`..`r`, radians, from `(p, q, r)` and `(p, r,
 * s)`; 0 for a planar or degenerate quadrilateral.
 */
function bend(
  p: AutoMovieVector3Tuple,
  q: AutoMovieVector3Tuple,
  r: AutoMovieVector3Tuple,
  s: AutoMovieVector3Tuple,
): number {
  const minus = (
    x: AutoMovieVector3Tuple,
    y: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple => [x[0] - y[0], x[1] - y[1], x[2] - y[2]];
  const n1: AutoMovieVector3Tuple = cross(minus(q, p), minus(r, p));
  const n2: AutoMovieVector3Tuple = cross(minus(r, p), minus(s, p));
  const l1: number = norm(n1);
  const l2: number = norm(n2);
  if (!(l1 > 0 && l2 > 0)) return 0;
  const cosine: number =
    (n1[0] * n2[0] + n1[1] * n2[1] + n1[2] * n2[2]) / (l1 * l2);
  return Math.acos(Math.max(-1, Math.min(1, cosine)));
}

/*
 * Copy one coherent reading before a subsequent source call can reuse its
 * storage.
 */
function copy(
  jet: IAutoMovieSolidSurface.IJet,
): IAutoMovieSolidSurface.IJet | string {
  const vectors: AutoMovieVector3Tuple[] = [
    jet.p,
    jet.u,
    jet.v,
    jet.uu,
    jet.uv,
    jet.vv,
  ];

  const values: AutoMovieVector3Tuple[] = vectors.map(
    (value: AutoMovieVector3Tuple): AutoMovieVector3Tuple => [
      value[0],
      value[1],
      value[2],
    ],
  );
  const length: number = norm(cross(values[1]!, values[2]!));
  if (!(length > 0))
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

/*
 * True cuts retain their conservative bound; exactly consumed domain sides do
 * not discard a source grid cell. `candidates` are the indices of the barriers
 * whose station range meets the cell's, in increasing order.
 */
function touches(
  chart: ReadonlyMap<number, Readonly<AutoMovieVector2Tuple>>,
  trim: readonly IAutoMovieSolidMeshConstraints.ISegment[],
  candidates: readonly number[],
  u0: number,
  u1: number,
  v0: number,
  v1: number,
  period: number | undefined,
  domainFrom: number,
): boolean | string {
  for (const index of candidates) {
    const edge: IAutoMovieSolidMeshConstraints.ISegment = trim[index]!;
    const a: Readonly<AutoMovieVector2Tuple> = chart.get(edge.a)!;
    const b: Readonly<AutoMovieVector2Tuple> = chart.get(edge.b)!;
    if (Math.max(a[0], b[0]) < u0 || Math.min(a[0], b[0]) > u1) continue;
    const nearest: number =
      period === undefined ? 0 : Math.round((v0 / 2 + v1 / 2 - a[1]) / period);
    for (const lift of period === undefined
      ? [0]
      : [nearest - 1, nearest, nearest + 1]) {
      const first: number = a[1] + lift * (period ?? 0);
      const last: number = b[1] + (lift + edge.turn) * (period ?? 0);
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

/*
 * Locate the closed grid interval used for residual sampling-cell exclusion.
 */
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
