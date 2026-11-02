import { AutoMovieHumanLoftChain as Loft } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain as Chain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanThoracicCrossing as Crossing } from "./AutoMovieHumanThoracicCrossing";

/** Physical anterior surface courses between a side-neck boundary and a bust-span endpoint. */
export namespace AutoMovieHumanThoracicCourse {
  /** World coordinates in calibration millimetres. */
  export type Point = [number, number, number];

  /** Material station and lateral position; neither field contains a tape target. */
  export interface IAddress {
    /** Material station of the generating column; physical Y may differ because of lift. */
    station: number;
    /** Anatomical-left displacement in the column's registered frame, mm. */
    lateral: number;
  }

  /** Evaluated source points and their open three-dimensional polyline length. */
  export interface IReading {
    /** Every source point, in course order including both endpoints. */
    points: Point[];
    /** Physical polyline arclength, mm; not vertical separation or a projection. */
    length: number;
    /** Geometry-only guide for independent emitted-skin intersection. */
    addresses: IAddress[];
    /** Actual finite-graph route and cost, retained for numerical cause analysis. */
    graph: {
      /** Actual material station nodes, including every admitted owner key. */
      stations: number[];
      /** Sorted unique grid/key values before the roundoff merge. */
      ordered: number[];
      /** Original endpoint-dependent uniform grid interval count. */
      uniformCount: number;
      /** Actual owner choices per row, before route selection. */
      rowOwners: string[][];
      /** Actual open-interval owner, distinct from either boundary chart. */
      intervalOwners: string[];
      /** Candidate node count per actual station. */
      rowNodes: number[];
      /** Optimized coarse chord cost, distinct from refined physical length, mm. */
      cost: number;
      /** Actual selected coarse world nodes in their original owner charts. */
      route: { owner: string; station: number; phase: number; point: Point }[];
    };
  }

  /** A sampled actual source point with its generating chart address. */
  interface INode {
    /** Generating owner. */
    owner: Chain;
    /** Material station in millimetres. */
    station: number;
    /** Canonical phase, radians. */
    phase: number;
    /** Actual world source point. */
    point: Point;
  }

  /** One interval's physical chart and independently re-addressed boundary nodes. */
  interface IInterval {
    /** The actual owner of the open material interval. */
    owner: Chain;
    /** Previous row, transferred by world position rather than phase identity. */
    before: (INode | undefined)[];
    /** Next row in this same chart. */
    after: (INode | undefined)[];
    /** Complete failed inverse-address witnesses for this interval. */
    failures: object[];
  }

  /**
   * Keep both physical endpoints and follow a guide on the anterior surface.
   * A shortest polygon through actual front-arc nodes selects the guide; its
   * chart segments are then evaluated on the actual loft at at most 0.5 mm
   * of station and pi/128 of phase. The coarse station pitch is at most 2 mm,
   * including owner keys. This finite graph is a model convention, not a
   * continuous geodesic, clinical registration or certified integration bound.
   * Linear lateral interpolation can be invalid on a narrowing surface: it can leave
   * a perfectly finite surface although both endpoints lie on that surface.
   * Missing owners and unreachable endpoints remain failures, not clamps.
   */
  export function read(chains: readonly Chain[], from: IAddress, to: IAddress): IReading {
    if (![from.station, from.lateral, to.station, to.lateral].every(Number.isFinite) || from.station === to.station)
      throw new Error("A thoracic course needs distinct finite stations and finite lateral endpoints");
    const sections: Map<Chain, Map<number, Crossing.IPrepared>> = new Map();

    /** One unchanged source section supplies every lateral and boundary query in this operation. */
    const crossing: typeof Crossing.read = (owner: Chain, station: number, lateral: number, stage: "start" | "end" | "interior" = "interior"): Crossing.IReading => {
      let stations: Map<number, Crossing.IPrepared> | undefined = sections.get(owner);
      if (stations === undefined) { stations = new Map(); sections.set(owner, stations); }
      let prepared: Crossing.IPrepared | undefined = stations.get(station);
      if (prepared === undefined) { prepared = Crossing.prepare(owner, station, stage, lateral); stations.set(station, prepared); }
      return prepared.read(lateral, stage);
    };
    const count: number = Math.max(1, Math.ceil(Math.abs(to.station - from.station) / 2));
    const ordered: number[] = [...new Set([
      ...Array.from({ length: count + 1 }, (_: unknown, index: number): number => from.station + index * (to.station - from.station) / count),
      ...chains.flatMap((chain: Chain): number[] => chain.layers.map((layer: Chain.ILayer): number => layer.y).filter((station: number): boolean => station > Math.min(from.station, to.station) && station < Math.max(from.station, to.station))),
    ])].sort((a: number, b: number): number => (a - b) * Math.sign(to.station - from.station));
    const stations: number[] = ordered.filter((station: number, index: number): boolean => index === 0 || index === ordered.length - 1 || Math.abs(station - ordered[index - 1]!) > 1e-9);
    const rows: INode[][] = stations.map((station: number, index: number): INode[] => {
      const owners: Chain[] = chains.filter((chain: Chain): boolean => station >= chain.layers[0]!.y - 1e-9 && station <= chain.layers.at(-1)!.y + 1e-9);
      if (owners.length === 0) throw new Error("A thoracic course station has no surface owner", { cause: { stage: index === 0 ? "start" : index === stations.length - 1 ? "end" : "interior", station, from, to, units: "mm", reason: "No actual generating interval contains the requested station" } });
      const endpoint: IAddress | undefined = index === 0 ? from : index === stations.length - 1 ? to : undefined;
      const candidates: INode[] = [];
      const ranges: { chain: string; range: [number, number]; extrema: Crossing.IPoint[] }[] = [];
      for (const owner of owners) {
        const sample: (phase: number) => Point = Loft.sampler(owner, station);
        if (endpoint === undefined) {
          const nodes: INode[] = Array.from({ length: PHASES + 1 }, (_: unknown, phaseIndex: number): INode => {
            const phase: number = Math.PI * phaseIndex / PHASES;
            const point: Point = sample(phase);
            if (!point.every(Number.isFinite)) throw new Error("A thoracic course evaluated a nonfinite source point", { cause: { stage: "interior", chain: owner.name, station, phase, coordinates: point, expected: "All physical coordinates finite", units: "mm" } });
            return { owner, station, phase, point };
          });
          const side: Crossing.IPoint = crossing(owner, station, 0).extrema.reduce((a: Crossing.IPoint, b: Crossing.IPoint): Crossing.IPoint => a.point[2] >= b.point[2] ? a : b);
          candidates.push(...nodes.filter((node: INode): boolean => node.phase < side.phase), { ...side, owner, station });
          continue;
        }
        const reading: Crossing.IReading = crossing(owner, station, endpoint.lateral, index === 0 ? "start" : "end");
        ranges.push({ chain: owner.name, range: reading.range, extrema: reading.extrema });
        candidates.push(...reading.crossings.map((point: Crossing.IPoint): INode => ({ ...point, owner, station })));
      }
      if (candidates.length === 0) throw new Error("A thoracic lateral endpoint does not meet its surface", { cause: { stage: index === 0 ? "start" : "end", station, targetCoordinate: endpoint?.lateral, owners: owners.map((owner: Chain): string => owner.name), phase: [0, Math.PI], ranges, observed: "No finite endpoint crossing", expected: "An actual surface crossing at the declared endpoint", units: "mm" } });
      return endpoint === undefined ? candidates : [candidates.reduce((a: INode, b: INode): INode => a.point[0] >= b.point[0] ? a : b)];
    });
    const boundaryPhases: number[] = [rows[0]![0]!.phase, rows.at(-1)![0]!.phase];
    // Distinct fitted charts generally agree at isolated actual intersections,
    // not at equal phases or every equal lateral coordinate. Add only verified
    // world intersections; a failed finite search is not global impossibility.
    rows.forEach((row: INode[], index: number): void => {
      const owners: Chain[] = [...new Set(row.map((node: INode): Chain => node.owner))];
      for (let a: number = 0; a < owners.length; a++)
        for (let b: number = a + 1; b < owners.length; b++)
          row.push(...intersections(owners[a]!, owners[b]!, stations[index]!, row, crossing));
    });
    for (let index: number = 1; index < rows.length - 1; index++) {
      const row: INode[] = rows[index]!;
      for (const owner of new Set(row.map((node: INode): Chain => node.owner))) {
        const side: number = Math.max(...row.filter((node: INode): boolean => node.owner === owner).map((node: INode): number => node.phase));
        for (const phase of boundaryPhases)
          if (phase <= side) row.push({ owner, station: stations[index]!, phase, point: Loft.sampler(owner, stations[index]!)(phase) });
      }
    }
    const intervals: IInterval[] = rows.slice(1).map((row: INode[], index: number): IInterval => {
      const midpoint: number = (stations[index]! + stations[index + 1]!) / 2;
      const owner: Chain | undefined = chains.find((chain: Chain): boolean => midpoint > chain.layers[0]!.y && midpoint < chain.layers.at(-1)!.y);
      if (owner === undefined) throw new Error("A thoracic course interval has no surface owner", { cause: { stage: "interior", interval: [stations[index], stations[index + 1]], midpoint, units: "mm" } });
      const failures: object[] = [];
      /** Transfer only an actual common world point; meshing tolerance is not a seam allowance. */
      const transfer: (node: INode) => INode | undefined = (node: INode): INode | undefined => {
        if (node.owner === owner) return node;
        const reading: Crossing.IReading = crossing(owner, node.station, node.point[2], "interior");
        const nearest: Crossing.IPoint | undefined = reading.crossings.reduce<Crossing.IPoint | undefined>((best: Crossing.IPoint | undefined, point: Crossing.IPoint): Crossing.IPoint => best === undefined || distance(point.point, node.point) < distance(best.point, node.point) ? point : best, undefined);
        const residual: number = nearest === undefined ? Infinity : distance(nearest.point, node.point);
        const arithmetic: number = 128 * Number.EPSILON * Math.max(1, ...node.point.map(Math.abs), ...(nearest?.point.map(Math.abs) ?? []));
        if (residual > arithmetic) {
          failures.push({ stage: "chart boundary", interval: [stations[index], stations[index + 1]], source: node.owner.name, owner: owner.name, station: node.station, phase: node.phase, coordinates: node.point, inversePhase: nearest?.phase, inverseCoordinates: nearest?.point, observed: residual, expected: 0, deviation: residual, tolerance: arithmetic, range: reading.range, targetCoordinate: node.point[2], units: "mm", reason: "No common actual world point was admitted; body mesher chord tolerance does not bound source seam mismatch" });
          return undefined;
        }
        return { ...nearest!, station: node.station, owner };
      };
      return { owner, before: rows[index]!.map(transfer), after: row.map(transfer), failures };
    });
    const costs: number[][] = [[0]];
    const previous: number[][] = [[-1]];
    for (let index: number = 1; index < rows.length; index++) {
      const back: number[] = [];
      const interval: IInterval = intervals[index - 1]!;
      costs.push(rows[index]!.map((_: INode, next: number): number => {
        let best: number = Infinity;
        let chosen: number = -1;
        const node: INode | undefined = interval.after[next];
        interval.before.forEach((before: INode | undefined, ordinal: number): void => {
          if (before === undefined || node === undefined) return;
          const candidate: number = costs[index - 1]![ordinal]! + distance(node.point, before.point);
          if (candidate < best) { best = candidate; chosen = ordinal; }
        });
        back.push(chosen); return best;
      }));
      previous.push(back);
      if (costs[index]!.every((value: number): boolean => !Number.isFinite(value))) throw new Error("A thoracic course has no admitted physical chart continuation", { cause: { stage: "chart boundary", chains: [interval.owner.name], interval: [stations[index - 1], stations[index]], observed: interval.failures, expected: "One continuous path through actual shared source positions", units: "mm and radians" } });
    }
    const route: INode[] = [];
    let chosen: number = 0;
    for (let index: number = rows.length - 1; index >= 0; index--) { route.push(rows[index]![chosen]!); chosen = previous[index]![chosen]!; }
    route.reverse();
    const points: Point[] = [route[0]!.point];
    const addresses: IAddress[] = [{ station: route[0]!.station, lateral: route[0]!.point[2] }];
    for (let index: number = 1; index < route.length; index++) {
      const interval: IInterval = intervals[index - 1]!;
      const a: INode = interval.before[rows[index - 1]!.indexOf(route[index - 1]!)]!;
      const b: INode = interval.after[rows[index]!.indexOf(route[index]!)]!;
      const steps: number = Math.max(1, Math.ceil(Math.abs(b.station - a.station) / 0.5), Math.ceil(Math.abs(b.phase - a.phase) * 128 / Math.PI));
      for (let step: number = 1; step <= steps; step++) {
        const unit: number = step / steps;
        const station: number = a.station + unit * (b.station - a.station);
        const owner: Chain = interval.owner;
        const point: Point = step === steps ? b.point : Loft.sampler(owner, station)(a.phase + unit * (b.phase - a.phase));
        if (!point.every(Number.isFinite)) throw new Error("A thoracic course evaluated a nonfinite source point", { cause: { stage: "interior", chain: owner.name, station, phase: a.phase + unit * (b.phase - a.phase), coordinates: point, units: "mm" } });
        points.push(point); addresses.push({ station, lateral: point[2] });
      }
    }
    const length: number = points.reduce((sum: number, point: Point, index: number): number => index === 0 ? sum : sum + Math.hypot(point[0] - points[index - 1]![0], point[1] - points[index - 1]![1], point[2] - points[index - 1]![2]), 0);
    if (!(length > 0) || !Number.isFinite(length)) throw new Error("A thoracic surface course has no finite positive length");
    let graph: IReading["graph"] | undefined;
    return { points, length, addresses,
      /** Numerical evidence is prepared only for an observer that actually requests it. */
      get graph(): IReading["graph"] {
        graph ??= { stations, ordered, uniformCount: count, rowOwners: rows.map((row: INode[]): string[] => [...new Set(row.map((node: INode): string => node.owner.name))]), intervalOwners: intervals.map((interval: IInterval): string => interval.owner.name), rowNodes: rows.map((row: INode[]): number => row.length), cost: costs.at(-1)![0]!, route: route.map((node: INode): { owner: string; station: number; phase: number; point: Point } => ({ owner: node.owner.name, station: node.station, phase: node.phase, point: node.point })) };
        return graph;
      },
    };
  }
}

/** Euclidean world discrepancy; never a difference between unrelated chart phases. */
function distance(a: AutoMovieHumanThoracicCourse.Point, b: AutoMovieHumanThoracicCourse.Point): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** Actual front-arc intersections of two boundary splines, with both chart addresses. */
function intersections(a: Chain, b: Chain, station: number, seeds: readonly { point: AutoMovieHumanThoracicCourse.Point }[], crossing: typeof Crossing.read): { owner: Chain; station: number; phase: number; point: AutoMovieHumanThoracicCourse.Point }[] {
  const rangeA: Crossing.IReading = crossing(a, station, 0, "interior");
  const rangeB: Crossing.IReading = crossing(b, station, 0, "interior");
  const low: number = Math.max(0, rangeA.range[0], rangeB.range[0]);
  const high: number = Math.min(rangeA.range[1], rangeB.range[1]);
  if (!(low <= high)) return [];
  /** Highest-forward crossing selects this model's anterior arc, without a target tape. */
  const front: (owner: Chain, lateral: number) => Crossing.IPoint | undefined = (owner: Chain, lateral: number): Crossing.IPoint | undefined => crossing(owner, station, lateral, "interior").crossings.reduce<Crossing.IPoint | undefined>((best: Crossing.IPoint | undefined, point: Crossing.IPoint): Crossing.IPoint => best === undefined || point.point[0] > best.point[0] ? point : best, undefined);
  const laterals: number[] = [...new Set([low, high, ...seeds.map((node: { point: AutoMovieHumanThoracicCourse.Point }): number => node.point[2]).filter((lateral: number): boolean => lateral > low && lateral < high), ...Array.from({ length: PHASES - 1 }, (_: unknown, index: number): number => low + (high - low) * (index + 1) / PHASES)])].sort((x: number, y: number): number => x - y);
  const result: { owner: Chain; station: number; phase: number; point: AutoMovieHumanThoracicCourse.Point }[] = [];
  let previous: { lateral: number; difference: number } | undefined;
  for (const lateral of laterals) {
    const pa: Crossing.IPoint | undefined = front(a, lateral);
    const pb: Crossing.IPoint | undefined = front(b, lateral);
    if (pa === undefined || pb === undefined) { previous = undefined; continue; }
    let x: Crossing.IPoint = pa;
    let y: Crossing.IPoint = pb;
    const difference: number = x.point[0] - y.point[0];
    if (previous !== undefined && previous.difference * difference < 0) {
      let left: number = previous.lateral;
      let right: number = lateral;
      let sign: number = previous.difference;
      for (let iteration: number = 0; iteration < 48; iteration++) {
        const middle: number = (left + right) / 2;
        const ma: Crossing.IPoint | undefined = front(a, middle);
        const mb: Crossing.IPoint | undefined = front(b, middle);
        if (ma === undefined || mb === undefined) break;
        x = ma; y = mb;
        const delta: number = x.point[0] - y.point[0];
        if (delta === 0) break;
        if (sign * delta <= 0) right = middle;
        else { left = middle; sign = delta; }
      }
    }
    const arithmetic: number = 128 * Number.EPSILON * Math.max(1, ...x.point.map(Math.abs), ...y.point.map(Math.abs));
    if (distance(x.point, y.point) <= arithmetic) result.push({ ...x, owner: a, station }, { ...y, owner: b, station });
    previous = { lateral, difference };
  }
  return result;
}

/** Reproducible coarse guide nodes; endpoint admission uses exact spline extrema instead. */
const PHASES: number = 64;
