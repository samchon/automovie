import type { AutoMovieHumanBodySurface as Surface } from "./AutoMovieHumanBodySurface";
import type { AutoMovieHumanSkinCorridor as Corridor } from "./AutoMovieHumanSkinCorridor";
import type { AutoMovieHumanThoracicCourse as Source } from "./AutoMovieHumanThoracicCourse";

/** Enforce the declared material direction inside an unchanged actual face corridor. */
export namespace AutoMovieHumanSkinDirectedPath {
  /** One original portal, parameterized by its actual edge fraction and directed material station. */
  interface IPortal { a: Source.Point; delta: Source.Point; start: number; span: number; low: number; high: number }

  /**
   * Keep an already admitted string-pull unchanged. Otherwise minimize the
   * convex sum of original-face segment lengths over ordered portal stations.
   * A coordinate and every prefix/suffix of an active equal-station block
   * can move; a constrained optimum need not be an unconstrained geodesic.
   * This finite descent neither changes the mesh nor substitutes its edge
   * path. Nonconvergence or an infeasible fixed corridor remains unavailable.
   */
  export function read(skin: Surface.IGeometry, seed: Corridor.IReading, coordinates: readonly number[]): Corridor.IReading {
    const direction: number = Math.sign(seed.stations.at(-1)! - seed.stations[0]!);
    const bottom: number = direction * seed.stations[0]!;
    const top: number = direction * seed.stations.at(-1)!;
    const admitted: boolean = seed.stations.every((station: number, index: number): boolean => {
      const bound: number = 512 * Number.EPSILON * Math.max(1, Math.abs(station), Math.abs(seed.stations[index - 1] ?? station), Math.abs(bottom), Math.abs(top));
      return Number.isFinite(station) && direction * station >= bottom - bound && direction * station <= top + bound && (index === 0 || direction * (station - seed.stations[index - 1]!) >= -bound);
    });
    if (admitted) return seed;

    const portals: IPortal[] = seed.bindings.map((binding: Corridor.IReading["bindings"][number], index: number): IPortal => {
      if (!("edge" in binding)) return { a: seed.points[index]!, delta: [0, 0, 0], start: direction * seed.stations[index]!, span: 0, low: direction * seed.stations[index]!, high: direction * seed.stations[index]! };
      const a: Source.Point = skin.mesh.positions.slice(3 * binding.edge[0], 3 * binding.edge[0] + 3) as Source.Point;
      const b: Source.Point = skin.mesh.positions.slice(3 * binding.edge[1], 3 * binding.edge[1] + 3) as Source.Point;
      const start: number = direction * coordinates[3 * binding.edge[0] + 1]!;
      const finish: number = direction * coordinates[3 * binding.edge[1] + 1]!;
      return { a, delta: b.map((value: number, axis: number): number => value - a[axis]!) as Source.Point, start, span: finish - start, low: Math.max(bottom, Math.min(start, finish)), high: Math.min(top, Math.max(start, finish)) };
    });
    const ceiling: number[] = new Array<number>(portals.length);
    let limit: number = top;
    for (let index: number = portals.length - 1; index >= 0; index--) { limit = Math.min(limit, portals[index]!.high); ceiling[index] = limit; }
    const values: number[] = [];
    const units: number[] = [];
    let previous: number = bottom;
    for (let index: number = 0; index < portals.length; index++) {
      const portal: IPortal = portals[index]!;
      const low: number = Math.max(previous, portal.low);
      const high: number = ceiling[index]!;
      if (low > high) throw new Error("An actual face corridor has no feasible directed material path", { cause: { index, low, high, previous, portal, stations: seed.stations, triangles: seed.triangles, units: "mm" } });
      const value: number = Math.max(low, Math.min(high, direction * seed.stations[index]!));
      values.push(value); units.push(portal.span === 0 && "edge" in seed.bindings[index]! ? (seed.bindings[index]! as { unit: number }).unit : portal.span === 0 ? 0 : (value - portal.start) / portal.span);
      previous = value;
    }
    const points: Source.Point[] = portals.map((portal: IPortal, index: number): Source.Point => position(portal, units[index]!));
    let scalarEvaluations: number = 0;
    let segmentEvaluations: number = 0;
    let total: number = length(points);
    for (let sweep: number = 0; sweep < 128; sweep++) {
      const before: number = total;
      for (let index: number = 1; index < portals.length - 1; index++) {
        if (portals[index]!.span === 0) update(index, index, true);
        else update(index, index, false);
      }
      for (let first: number = 1; first < portals.length - 1;) {
        let last: number = first;
        while (last + 1 < portals.length - 1 && values[last + 1] === values[first]) last++;
        if (last > first) {
          for (let end: number = first; end <= last; end++) update(first, end, false);
          for (let start: number = first + 1; start <= last; start++) update(start, last, false);
        }
        first = last + 1;
      }
      total = length(points);
      const arithmetic: number = 256 * Number.EPSILON * Math.max(1, before, total) * points.length;
      if (before - total <= arithmetic) {
        const stations: number[] = portals.map((portal: IPortal, index: number): number => direction * (portal.start + portal.span * units[index]!));
        const bindings: Corridor.IReading["bindings"] = seed.bindings.map((binding: Corridor.IReading["bindings"][number], index: number): Corridor.IReading["bindings"][number] => "edge" in binding ? { edge: binding.edge, unit: units[index]! } : binding);
        return { points, stations, bindings, triangles: seed.triangles, length: total, directedWork: { sweeps: sweep + 1, scalarEvaluations, segmentEvaluations, termination: "physical length descent at arithmetic resolution; independent first variation remains required" } };
      }
    }
    throw new Error("Directed physical corridor descent did not converge within its finite work budget", { cause: { points, stations: values, triangles: seed.triangles, length: total, sweeps: 128, work: { sweeps: 128, scalarEvaluations, segmentEvaluations, termination: "finite work budget exhausted; no admitted result" }, units: "mm and counts" } });

    /** Minimize one feasible block by convex one-dimensional interval reduction. */
    function update(first: number, last: number, edgeUnit: boolean): void {
      let low: number = edgeUnit ? 0 : values[first - 1]!;
      let high: number = edgeUnit ? 1 : values[last + 1]!;
      if (!edgeUnit) for (let index: number = first; index <= last; index++) { low = Math.max(low, portals[index]!.low); high = Math.min(high, portals[index]!.high); }
      if (!(high > low)) return;
      const changes: Source.Point[] = [];
      const speeds: number[] = [];
      let priorVelocity: Source.Point = [0, 0, 0];
      for (let index: number = first; index <= last + 1; index++) {
        const portal: IPortal = portals[index]!;
        const velocity: Source.Point = index > last || !edgeUnit && portal.span === 0 ? [0, 0, 0] : portal.delta.map((component: number): number => edgeUnit ? component : component / portal.span) as Source.Point;
        const change: Source.Point = velocity.map((component: number, axis: number): number => component - priorVelocity[axis]!) as Source.Point;
        changes.push(change); speeds.push(Math.hypot(...change)); priorVelocity = velocity;
      }
      const original: number = edgeUnit ? units[first]! : values[first]!;
      const initial: { value: number; left: number; right: number } = objective(original);
      let a: number = low;
      let b: number = high;
      let candidate: number = original;
      const lower: { value: number; left: number; right: number } = objective(low);
      const upper: { value: number; left: number; right: number } = objective(high);

      // The original algorithm overwrites its search with these same exact
      // boundary choices, in this order. Resolve them before doing searches
      // whose intermediate values cannot affect the returned point.
      if (lower.right >= 0 || upper.left <= 0) {
        if (lower.right >= 0) candidate = low;
        if (upper.left <= 0) candidate = high;
      } else {
        for (let iteration: number = 0; iteration < 80; iteration++) {
          const middle: number = a + (b - a) / 2;
          candidate = middle;
          if (middle === a || middle === b) break;
          const slope: { value: number; left: number; right: number } = objective(middle);
          if (slope.left <= 0 && slope.right >= 0) break;
          if (slope.right < 0) a = middle; else b = middle;
        }
      }
      const observed: { value: number; left: number; right: number } = objective(candidate);
      if (observed.value > initial.value) return;
      for (let index: number = first; index <= last; index++) {
        units[index] = edgeUnit ? candidate : portals[index]!.span === 0 ? units[index]! : (candidate - portals[index]!.start) / portals[index]!.span;
        if (!edgeUnit) values[index] = candidate;
        points[index] = position(portals[index]!, units[index]!);
      }

      /** Original physical segment lengths adjoining this block; no unfolded approximation. */
      function objective(value: number): { value: number; left: number; right: number } {
        scalarEvaluations++;
        let sum: number = 0;
        let priorX: number = points[first - 1]![0];
        let priorY: number = points[first - 1]![1];
        let priorZ: number = points[first - 1]![2];
        let slope: number = 0;
        let cusp: number = 0;
        for (let index: number = first; index <= last + 1; index++) {
          segmentEvaluations++;
          const portal: IPortal = portals[index]!;
          const unit: number = index > last ? units[index]! : edgeUnit ? value : portal.span === 0 ? units[index]! : (value - portal.start) / portal.span;
          const x: number = index > last ? points[index]![0] : portal.a[0] + unit * portal.delta[0];
          const y: number = index > last ? points[index]![1] : portal.a[1] + unit * portal.delta[1];
          const z: number = index > last ? points[index]![2] : portal.a[2] + unit * portal.delta[2];
          const dx: number = x - priorX;
          const dy: number = y - priorY;
          const dz: number = z - priorZ;
          const change: Source.Point = changes[index - first]!;
          const segment: number = Math.hypot(dx, dy, dz);
          sum += segment;
          if (segment === 0) cusp += speeds[index - first]!;
          else slope += ((0 + dx / segment * change[0]) + dy / segment * change[1]) + dz / segment * change[2];
          priorX = x; priorY = y; priorZ = z;
        }
        return { value: sum, left: slope - cusp, right: slope + cusp };
      }
    }
  }

  /** Point on one unchanged original indexed edge. */
  function position(portal: IPortal, unit: number): Source.Point { return portal.a.map((value: number, axis: number): number => value + unit * portal.delta[axis]!) as Source.Point; }
  /** Sum actual physical segments. */
  function length(points: readonly Source.Point[]): number { return points.reduce((sum: number, point: Source.Point, index: number): number => index === 0 ? sum : sum + distance(point, points[index - 1]!), 0); }
  /** Physical Euclidean distance, mm. */
  function distance(a: Source.Point, b: Source.Point): number { return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }
}
