/**
 * Star-shaped closed section read in polar form about its area centroid,
 * the form a limb's construction works in: a neighbouring chain's ring
 * becomes the same radial function as the limb's own sections.
 */
export namespace AutoMovieHumanPolarSection {
  /** Polar measures of one closed polygon. */
  export interface ISection {
    /** Area centroid `[x, z]`, mm. */
    centre: [number, number];

    /** Radius of the circle of the same area, mm. */
    radius: number;
  }

  /** Area centroid and equivalent radius of a closed polygon `[x, z]`. */
  export function measure(
    polygon: readonly (readonly [number, number])[],
  ): ISection {
    let area: number = 0;
    let cx: number = 0;
    let cz: number = 0;
    polygon.forEach((a: readonly [number, number], i: number): void => {
      const b: readonly [number, number] = polygon[(i + 1) % polygon.length]!;
      const cross: number = a[0] * b[1] - b[0] * a[1];
      area += cross;
      cx += (a[0] + b[0]) * cross;
      cz += (a[1] + b[1]) * cross;
    });
    return {
      centre: [cx / (3 * area), cz / (3 * area)],
      radius: Math.sqrt(Math.abs(area / 2) / Math.PI),
    };
  }

  /**
   * Farthest crossing of a ray from a point with a closed polygon.
   *
   * @param polygon Polygon `[x, z]`.
   * @param origin Ray origin.
   * @param angle Ray direction, the polar angle from +x toward +z.
   * @returns Distance along the ray, 0 when it meets nothing.
   */
  export function radius(
    polygon: readonly (readonly [number, number])[],
    origin: readonly [number, number],
    angle: number,
  ): number {
    const dx: number = Math.cos(angle);
    const dz: number = Math.sin(angle);
    let best: number = 0;
    for (let i: number = 0; i < polygon.length; i++) {
      const a: readonly [number, number] = polygon[i]!;
      const b: readonly [number, number] = polygon[(i + 1) % polygon.length]!;
      const ex: number = b[0] - a[0];
      const ez: number = b[1] - a[1];
      const det: number = ez * dx - ex * dz;
      if (Math.abs(det) < 1e-12) continue;
      const sx: number = a[0] - origin[0];
      const sz: number = a[1] - origin[1];
      const t: number = (ez * sx - ex * sz) / det;
      const u: number = (dz * sx - dx * sz) / det;
      if (t > best && u >= 0 && u < 1) best = t;
    }
    return best;
  }

  /**
   * Perimeter of the convex hull of a radial function about the origin: what
   * a tape measures round a section, bridging its hollows.
   *
   * @param radii Radii at uniform polar angles.
   */
  export function girth(radii: readonly number[]): number {
    const points: [number, number][] = radii
      .map((r: number, j: number): [number, number] => {
        const t: number = (2 * Math.PI * j) / radii.length;
        return [r * Math.cos(t), r * Math.sin(t)];
      })
      .sort(
        (a: [number, number], b: [number, number]): number =>
          a[0] - b[0] || a[1] - b[1],
      );
    const half = (list: [number, number][]): [number, number][] => {
      const out: [number, number][] = [];
      for (const p of list) {
        while (out.length >= 2 && turn(out[out.length - 2]!, out[out.length - 1]!, p) <= 0)
          out.pop();
        out.push(p);
      }
      out.pop();
      return out;
    };
    const hull: [number, number][] = [
      ...half(points),
      ...half([...points].reverse()),
    ];
    let sum: number = 0;
    hull.forEach((p: [number, number], i: number): void => {
      const q: [number, number] = hull[(i + 1) % hull.length]!;
      sum += Math.hypot(q[0] - p[0], q[1] - p[1]);
    });
    return sum;
  }
}

/** Sign of the turn from `o` through `a` to `b`. */
function turn(
  o: readonly [number, number],
  a: readonly [number, number],
  b: readonly [number, number],
): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}
