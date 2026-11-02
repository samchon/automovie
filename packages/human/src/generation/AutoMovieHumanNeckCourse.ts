/** The neck's declared four-contact surface course, in physical millimetres. */
export namespace AutoMovieHumanNeckCourse {
  /** World point, forward, up and left in millimetres. */
  export type Vec3 = [number, number, number];

  /**
   * Axial course height at a world polar angle. The four contacts supply
   * values and centred first derivatives of one periodic cubic Hermite law.
   */
  export function height(contacts: readonly [number, number, number, number], angle: number): number {
    const period: number = 2 * Math.PI;
    const address: number = 4 * (((angle % period) + period) % period) / period;
    const i: number = Math.floor(address);
    const t: number = address - i;
    const a: number = contacts[(i + 3) % 4]!;
    const b: number = contacts[i]!;
    const c: number = contacts[(i + 1) % 4]!;
    const d: number = contacts[(i + 2) % 4]!;
    return (2 * t ** 3 - 3 * t ** 2 + 1) * b + (t ** 3 - 2 * t ** 2 + t) * (c - a) / 2 + (-2 * t ** 3 + 3 * t ** 2) * c + (t ** 3 - t ** 2) * (d - b) / 2;
  }

  /** Closed three-dimensional surface-course length, never a projected hull. */
  export function length(points: readonly Vec3[]): number {
    return points.reduce((sum: number, point: Vec3, i: number): number => {
      const next: Vec3 = points[(i + 1) % points.length]!;
      return sum + Math.hypot(next[0] - point[0], next[1] - point[1], next[2] - point[2]);
    }, 0);
  }

  /** Actual cardinal ray intersections of a closed, star-shaped collar curve. */
  export function contacts(points: readonly Vec3[], origin: Vec3): [Vec3, Vec3, Vec3, Vec3] {
    return [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2].map((angle: number): Vec3 => {
      const dx: number = Math.cos(angle);
      const dz: number = Math.sin(angle);
      let nearest: number = Infinity;
      let selected: Vec3 | undefined;
      for (let i: number = 0; i < points.length; i++) {
        const a: Vec3 = points[i]!;
        const b: Vec3 = points[(i + 1) % points.length]!;
        const ex: number = b[0] - a[0];
        const ez: number = b[2] - a[2];
        const determinant: number = dx * ez - dz * ex;
        if (Math.abs(determinant) < 1e-12) continue;
        const ax: number = a[0] - origin[0];
        const az: number = a[2] - origin[2];
        const distance: number = (ax * ez - az * ex) / determinant;
        const fraction: number = (ax * dz - az * dx) / determinant;
        if (distance < 0 || distance >= nearest || fraction < -1e-10 || fraction > 1 + 1e-10) continue;
        nearest = distance;
        selected = [origin[0] + distance * dx, a[1] + fraction * (b[1] - a[1]), origin[2] + distance * dz];
      }
      if (selected === undefined) throw new Error("A collar course must meet all four cardinal rays");
      return selected;
    }) as [Vec3, Vec3, Vec3, Vec3];
  }

  /** Build the shared boundary from fixed cardinal heights before sizing. */
  export function register(points: readonly Vec3[], origin: Vec3): Vec3[] {
    const cardinal: [Vec3, Vec3, Vec3, Vec3] = contacts(points, origin);
    const heights: [number, number, number, number] = cardinal.map((point: Vec3): number => point[1] - origin[1]) as [number, number, number, number];
    return points.map((point: Vec3): Vec3 => [point[0], origin[1] + height(heights, Math.atan2(point[2] - origin[2], point[0] - origin[0])), point[2]]);
  }

  /** Size a fixed-height course through its complete three-dimensional length. */
  export function scale(target: number, points: readonly Vec3[], origin: Vec3): number {
    const sized: (value: number) => Vec3[] = (value: number): Vec3[] => points.map((point: Vec3): Vec3 => [origin[0] + value * (point[0] - origin[0]), point[1], origin[2] + value * (point[2] - origin[2])]);
    if (!(target > length(sized(0)))) throw new Error("A neck course target must exceed its fixed axial travel");
    let low: number = 0;
    let high: number = 1;
    for (let k: number = 0; length(sized(high)) < target; k++) {
      if (k === 32) throw new Error("A neck course has no finite scale bracket");
      high *= 2;
    }
    for (let k: number = 0; k < 32; k++) {
      const mid: number = (low + high) / 2;
      if (length(sized(mid)) < target) low = mid;
      else high = mid;
    }
    return (low + high) / 2;
  }
}
