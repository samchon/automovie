/**
 * The arm's root strip: the transition between the trunk's shoulder ring, which
 * the trunk owns, and the arm's first own section below it
 * (`docs/techniques/surface-composition.md`, Transition strips).
 *
 * At each phase the strip is the cubic Hermite in its cross parameter `w` from
 * the ring's point `C`, leaving it along the trunk's own downward tangent
 * there, to the first section's point `A`, arriving along the arm's own
 * direction there; both tangents are scaled by the chord `|A - C|`. So the strip
 * copies the ring (G0) and the trunk's tangent plane across it (G1), and meets
 * the arm in its tangent plane (G1), with no fade of either piece. A ring point
 * is where the ray from the ring's centre toward the first section's point in
 * the level plane meets the ring's outline, so the strip's columns keep the
 * arm's phases.
 *
 * The strip reads the ring, the first section's points and directions and the
 * square plane of the arm's walk there; it reads no tube.
 */
export namespace AutoMovieHumanArmRootStrip {
  /** The trunk's ring as the arm reads it, left frame. */
  export interface IRing {
    /** Centre of the arm's arc. */
    centre: Vec3;

    /** Points of the arc, closed, in the ring's level plane. */
    points: Vec3[];

    /** The trunk's unit tangent at each point, continuing down across the ring. */
    down: Vec3[];
  }

  /** What the strip is built from. */
  export interface IInputs {
    /** The trunk's ring. */
    ring: IRing;

    /** The arm's first own section, one point per phase. */
    own: Vec3[];

    /** The arm's unit direction at each of those points, down the arm. */
    along: Vec3[];

    /** Unit heading of the walk at the first section, away from the shoulder. */
    heading: Vec3;
  }

  /** The strip. */
  export interface IStrip {
    /** Points at a cross parameter, one per phase: 0 the ring, 1 the first section. */
    ring(w: number): Vec3[];

    /** Normal of the layer plane at a cross parameter, toward the shoulder. */
    normal(w: number): Vec3;
  }

  /**
   * The strip from the ring to the first section.
   *
   * @param input The ring and the first section.
   */
  export function strip(input: IInputs): IStrip {
    const { ring, own, along } = input;
    const start: { point: Vec3; down: Vec3 }[] = own.map((a: Vec3): { point: Vec3; down: Vec3 } => meet(ring, a));
    const level: Vec3 = [0, 1, 0];
    const square: Vec3 = scale(input.heading, -1);

    return {
      ring: (w: number): Vec3[] => {
        const h00: number = 2 * w ** 3 - 3 * w ** 2 + 1;
        const h10: number = w ** 3 - 2 * w ** 2 + w;
        const h01: number = -2 * w ** 3 + 3 * w ** 2;
        const h11: number = w ** 3 - w ** 2;

        return own.map((a: Vec3, m: number): Vec3 => {
          const c: Vec3 = start[m]!.point;
          const l: number = norm(sub(a, c));
          const dc: Vec3 = scale(start[m]!.down, l);
          const da: Vec3 = scale(along[m]!, l);

          return [0, 1, 2].map((k: number): number => h00 * c[k]! + h10 * dc[k]! + h01 * a[k]! + h11 * da[k]!) as Vec3;
        });
      },
      normal: (w: number): Vec3 => {
        const x: number = smooth(w);

        return unit([
          level[0] + x * (square[0] - level[0]),
          level[1] + x * (square[1] - level[1]),
          level[2] + x * (square[2] - level[2]),
        ]);
      },
    };
  }

  /**
   * Where the ray from the ring's centre toward a point's level projection
   * meets the outline, and the trunk's tangent there.
   *
   * @param ring The trunk's ring.
   * @param toward A point of the first section.
   */
  function meet(ring: IRing, toward: Vec3): { point: Vec3; down: Vec3 } {
    const c: Vec3 = ring.centre;
    const dx: number = toward[0] - c[0];
    const dz: number = toward[2] - c[2];
    const l: number = Math.hypot(dx, dz) || 1;
    const ux: number = dx / l;
    const uz: number = dz / l;
    const n: number = ring.points.length;
    let best: number = -1;
    let found: { point: Vec3; down: Vec3 } = { point: ring.points[0]!, down: ring.down[0]! };

    for (let i: number = 0; i < n; i++) {
      const p: Vec3 = ring.points[i]!;
      const q: Vec3 = ring.points[(i + 1) % n]!;
      const ex: number = q[0] - p[0];
      const ez: number = q[2] - p[2];
      const den: number = ux * ez - uz * ex;

      if (Math.abs(den) < 1e-12) continue;

      const r: number = ((p[0] - c[0]) * ez - (p[2] - c[2]) * ex) / den;
      const f: number = ((p[0] - c[0]) * uz - (p[2] - c[2]) * ux) / den;

      if (r > 0 && f >= 0 && f <= 1 && r > best) {
        best = r;

        const d0: Vec3 = ring.down[i]!;
        const d1: Vec3 = ring.down[(i + 1) % n]!;

        found = {
          point: [p[0] + f * ex, p[1] + f * (q[1] - p[1]), p[2] + f * ez],
          down: unit([d0[0] + f * (d1[0] - d0[0]), d0[1] + f * (d1[1] - d0[1]), d0[2] + f * (d1[2] - d0[2])]),
        };
      }
    }

    return found;
  }
}

/** A point or direction. */
type Vec3 = [number, number, number];

/** Smoothstep clamped to `[0, 1]`: the layer plane turns from level to square over the strip. */
function smooth(x: number): number {
  const t: number = Math.min(1, Math.max(0, x));

  return t * t * (3 - 2 * t);
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

function norm(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2]);
}

function unit(a: Vec3): Vec3 {
  const l: number = norm(a) || 1;

  return [a[0] / l, a[1] / l, a[2] / l];
}
