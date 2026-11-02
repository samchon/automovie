/** Measurement of a leg's actual horizontal section through its loft. */
export namespace AutoMovieHumanLegTapes {
  /** World point in millimetres, forward, up, left. */
  export type V3 = readonly [number, number, number];

  /** One complete analytic section, with the same phases as its neighbours. */
  export interface IRing {
    /** Station used to generate the section, mm. */
    station: number;

    /** World positions in phase order; a bone-normal ring need not be level. */
    points: readonly V3[];
  }

  /** A height and the taut horizontal perimeter there. */
  export interface IReading {
    /** World height, mm. */
    height: number;

    /** Convex-hull circumference of the intersected loft, mm. */
    girth: number;

    /** Frontmost point of this horizontal section, mm. */
    front: number;
  }

  /**
   * Cut the triangles between adjacent analytic rings in a horizontal plane.
   * This reads the emitted loft rather than substituting a normal section's
   * size. Each edge crossing lies on the displayed piecewise linear surface.
   */
  export function horizontal(rings: readonly IRing[], height: number): IReading | null {
    const points: [number, number][] = [];
    for (let k: number = 1; k < rings.length; k++) {
      const a: readonly V3[] = rings[k - 1]!.points;
      const b: readonly V3[] = rings[k]!.points;
      if (a.length !== b.length) throw new Error("Neighbouring leg rings must share phases");
      if ((a.every((p: V3): boolean => p[1] <= height) && b.every((p: V3): boolean => p[1] <= height)) ||
          (a.every((p: V3): boolean => p[1] > height) && b.every((p: V3): boolean => p[1] > height))) continue;
      for (let i: number = 0; i < a.length; i++) {
        const j: number = (i + 1) % a.length;
        intersect(a[i]!, a[j]!, b[i]!, height, points);
        intersect(a[j]!, b[j]!, b[i]!, height, points);
      }
    }
    if (points.length < 3) return null;
    return { height, girth: perimeter(points), front: Math.max(...points.map((p: [number, number]): number => p[0])) };
  }

  /** Taut circumference of a planar outline; concavities are bridged. */
  export function perimeter(points: readonly (readonly [number, number])[]): number {
    return hull(points.map((p: readonly [number, number]): [number, number] => [p[0], p[1]]));
  }

  /**
   * Open a crotch corner with zero first and second derivatives at its root.
   * The rational approaches unit growth far from the existing corner size;
   * its positive derivative is d²(d² + 3c²)/(d² + c²)². This preserves the
   * shared root's C2 jet without adding a second transition-length constant.
   */
  export function cornerAdvance(depth: number, corner: number): number {
    return depth ** 3 / (depth * depth + corner * corner);
  }

  /** Largest horizontal section on a physical-height interval. */
  export function maximum(rings: readonly IRing[], low: number, high: number, step: number = 2): IReading | null {
    if (!(step > 0) || high < low) throw new Error("A tape scan needs an ordered interval and positive step");
    let found: IReading | null = null;
    for (let height: number = low; height <= high; height += step) {
      const current: IReading | null = horizontal(rings, height);
      if (current !== null && (found === null || current.girth > found.girth)) found = current;
    }
    const end: IReading | null = horizontal(rings, high);
    if (end !== null && (found === null || end.girth > found.girth)) found = end;
    return found;
  }

  /** Controls whose final horizontal measurements must answer named tapes. */
  export interface IConstraint {
    /** Required public input, mm. */
    target: number;

    /** Current positive size key, mm. */
    value(): number;

    /** Replace the size key before evaluating the assembled surface. */
    set(value: number): void;

    /** Read the published site on that surface, mm. */
    read(rings: readonly IRing[]): number;
  }

  /**
   * Close the small coupled tape system against the assembled loft. A finite
   * difference Jacobian includes normal tilt and neighbouring keys. Newton's
   * step is backtracked until the largest absolute tape error falls; no fit
   * ratio remains after closure. The 0.01 mm residual is numerical precision,
   * below the polygonal surface's discretization error.
   */
  export function close(constraints: readonly IConstraint[], surface: () => readonly IRing[]): void {
    const readings: () => number[] = (): number[] => {
      const rings: readonly IRing[] = surface();
      return constraints.map((c: IConstraint): number => c.read(rings));
    };
    const residual: (values: readonly number[]) => number = (values: readonly number[]): number =>
      Math.max(...values.map((v: number, i: number): number => Math.abs(v - constraints[i]!.target)));
    let values: number[] = readings();
    for (let iteration: number = 0; iteration < 12 && residual(values) > 0.01; iteration++) {
      const base: number[] = constraints.map((c: IConstraint): number => c.value());
      const matrix: number[][] = constraints.map((): number[] => []);
      for (let j: number = 0; j < constraints.length; j++) {
        const h: number = Math.max(0.01, base[j]! * 0.0001);
        constraints[j]!.set(base[j]! + h);
        const changed: number[] = readings();
        constraints[j]!.set(base[j]!);
        for (let i: number = 0; i < constraints.length; i++) matrix[i]!.push((changed[i]! - values[i]!) / h);
      }
      const delta: number[] | null = solve(matrix, values.map((v: number, i: number): number => constraints[i]!.target - v));
      if (delta === null) break;
      let accepted: boolean = false;
      for (let factor: number = 1; factor >= 1 / 128; factor /= 2) {
        for (let j: number = 0; j < constraints.length; j++) constraints[j]!.set(Math.max(0.01, base[j]! + factor * delta[j]!));
        const next: number[] = readings();
        if (residual(next) < residual(values)) {
          values = next;
          accepted = true;
          break;
        }
      }
      if (!accepted) {
        constraints.forEach((c: IConstraint, i: number): void => c.set(base[i]!));
        break;
      }
    }
  }
}

/** Partial-pivot elimination of the tiny coupled tape Jacobian. */
function solve(matrix: readonly (readonly number[])[], rhs: readonly number[]): number[] | null {
  const rows: number[][] = matrix.map((row: readonly number[], i: number): number[] => [...row, rhs[i]!]);
  const count: number = rows.length;
  for (let j: number = 0; j < count; j++) {
    let pivot: number = j;
    for (let k: number = j + 1; k < count; k++) if (Math.abs(rows[k]![j]!) > Math.abs(rows[pivot]![j]!)) pivot = k;
    if (!Number.isFinite(rows[pivot]![j]!) || Math.abs(rows[pivot]![j]!) < 1e-9) return null;
    [rows[j], rows[pivot]] = [rows[pivot]!, rows[j]!];
    const scale: number = rows[j]![j]!;
    for (let k: number = j; k <= count; k++) rows[j]![k] = rows[j]![k]! / scale;
    for (let i: number = 0; i < count; i++) {
      if (i === j) continue;
      const multiplier: number = rows[i]![j]!;
      for (let k: number = j; k <= count; k++) rows[i]![k] = rows[i]![k]! - multiplier * rows[j]![k]!;
    }
  }
  return rows.map((row: number[]): number => row[count]!);
}

/** Crossings of one triangle's three edges, with half-open vertex ownership. */
function intersect(a: AutoMovieHumanLegTapes.V3, b: AutoMovieHumanLegTapes.V3, c: AutoMovieHumanLegTapes.V3, height: number, points: [number, number][]): void {
  const triangle: readonly AutoMovieHumanLegTapes.V3[] = [a, b, c];
  for (let k: number = 0; k < 3; k++) {
    const p: AutoMovieHumanLegTapes.V3 = triangle[k]!;
    const q: AutoMovieHumanLegTapes.V3 = triangle[(k + 1) % 3]!;
    if ((p[1] <= height && q[1] > height) || (q[1] <= height && p[1] > height)) {
      const t: number = (height - p[1]) / (q[1] - p[1]);
      points.push([p[0] + t * (q[0] - p[0]), p[2] + t * (q[2] - p[2])]);
    }
  }
}

/** Perimeter of the planar convex hull, bridging hollows as a taut tape does. */
function hull(points: [number, number][]): number {
  const ordered: [number, number][] = points.sort((a: [number, number], b: [number, number]): number => a[0] - b[0] || a[1] - b[1]);
  const half: (list: [number, number][]) => [number, number][] = (list: [number, number][]): [number, number][] => {
    const out: [number, number][] = [];
    for (const p of list) {
      while (out.length >= 2 && turn(out[out.length - 2]!, out[out.length - 1]!, p) <= 0) out.pop();
      out.push(p);
    }
    out.pop();
    return out;
  };
  const outline: [number, number][] = [...half(ordered), ...half([...ordered].reverse())];
  return outline.reduce((sum: number, p: [number, number], i: number): number => {
    const q: [number, number] = outline[(i + 1) % outline.length]!;
    return sum + Math.hypot(p[0] - q[0], p[1] - q[1]);
  }, 0);
}

/** Signed planar turn used by the monotone-chain hull. */
function turn(o: [number, number], a: [number, number], b: [number, number]): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}
