import { AutoMovieHumanNaturalSpline } from "../../lofting/AutoMovieHumanNaturalSpline";
import { AutoMovieHumanPolarSector } from "../../lofting/AutoMovieHumanPolarSector";
import { AutoMovieHumanSeam } from "../../lofting/AutoMovieHumanSeam";
import { AutoMovieHumanSeamKnot } from "../../lofting/AutoMovieHumanSeamKnot";
import { AutoMovieHumanRelief } from "../../network/AutoMovieHumanRelief";
import type { IAutoMovieHumanRelief } from "../../network/IAutoMovieHumanRelief";
import type { AutoMovieHumanArmAxis } from "./AutoMovieHumanArmAxis";
import { AutoMovieHumanArmGuides } from "./AutoMovieHumanArmGuides";

/**
 * The arm's tube: about the axis, in the plane square to the walk at each
 * walk length `s`, the skin's radius at the section angle `theta` is
 *
 * ```text
 * r(s, theta) = K(s) (rho(s, theta) + sum of reliefs d(s, theta))
 * ```
 *
 * with `rho` the polar sector section of the guides' and sectors' channels at
 * `s` (`AutoMovieHumanPolarSector`), the reliefs windows in `(s, theta)`
 * whose height, slope and curvature vanish at their edges, and `K(s)` the
 * scale that makes the section's hull, a taut tape, measure the girth the
 * span law asks for at `s`. So a girth input is honoured at its site on this
 * very surface, reliefs included. The angle runs from forward across the bone
 * (`f`, the world's +X with the walk's heading taken out) toward `g = h x f`,
 * lateral on the left side.
 */
export namespace AutoMovieHumanArmTube {
  /** A section's normalised shape at a walk length. */
  export interface IShape {
    /** The guides by increasing angle. */
    guides: AutoMovieHumanPolarSector.IGuide[];

    /** One per guide. */
    fullness: number[];
  }

  /** The tube. */
  export interface ITube {
    /** Its axis. */
    axis: AutoMovieHumanArmAxis.IAxis;

    /** Section axes `[f, g]` at a walk length. */
    frame(s: number): [Vec3, Vec3];

    /** Radius jet in the angle `[r, r_theta, r_thetatheta]` at a walk length. */
    radius(s: number, theta: number): [number, number, number];

    /** Skin point at a walk length and angle. */
    surface(s: number, theta: number): Vec3;

    /** The scale `K` at a walk length. */
    scale(s: number): number;

    /** Hull perimeter of the section square to the walk at a walk length, mm. */
    girth(s: number): number;
  }

  /**
   * The tube from its axis, shape, reliefs and girth law.
   *
   * @param axis The walk.
   * @param shape Normalised section at a walk length.
   * @param reliefs Windows over `(s, theta)`, heights in shares of the scale.
   * @param target Girth the span law asks for at a walk length, mm.
   * @param from First walk length the scale is solved at; held before it.
   * @param to Last walk length the scale is solved at; held past it.
   * @param hulls Unit sections' hull perimeters by walk length, kept across
   *   builds of one shape: a hull is linear in the scale, so only the target
   *   changes between the hand's solve rounds, and the shape's hulls are read
   *   once.
   */
  export function build(
    axis: AutoMovieHumanArmAxis.IAxis,
    shape: (s: number) => IShape,
    reliefs: readonly IAutoMovieHumanRelief[],
    target: (s: number) => number,
    from: number,
    to: number,
    hulls: Map<number, number> = new Map(),
  ): ITube {
    // The normalised radius at a walk length and angle: the sectors' polar
    // section plus the reliefs' heights, with its first two angle derivatives
    // so a guide can publish its jet.
    const unitRadius = (s: number, theta: number): [number, number, number] => {
      const own: IShape = shape(s);
      const r: [number, number, number] = AutoMovieHumanPolarSector.radius(own.guides, own.fullness, theta);

      for (const relief of reliefs) {
        const j: number[] = AutoMovieHumanRelief.jet(relief, s, theta);
        r[0] += j[0]!;
        r[1] += j[2]!;
        r[2] += j[5]!;
      }

      return r;
    };

    // The hull perimeter of the normalised section times a scale: a taut tape
    // lies on the hull, and the hull is linear in the scale.
    const hullOf = (s: number, k: number): number =>
      hull(
        Array.from({ length: GIRTH_PHASES }, (_: unknown, i: number): [number, number] => {
          const t: number = (2 * Math.PI * i) / GIRTH_PHASES;
          const r: number = k * unitRadius(s, t)[0];

          return [r * Math.cos(t), r * Math.sin(t)];
        }),
      );

    // The unit hulls depend on the shape alone, so a rebuild with another
    // target (the hand's solve rounds) reads them from the cache.
    const unitHull = (s: number): number => {
      let h: number | undefined = hulls.get(s);

      if (h === undefined) {
        h = hullOf(s, 1);
        hulls.set(s, h);
      }

      return h;
    };

    // The scale on a grid of walk lengths, each solved exactly against its
    // section's hull, read between by the natural spline.
    const count: number = Math.max(2, Math.ceil((to - from) / GRID));
    const xs: number[] = Array.from({ length: count + 1 }, (_: unknown, i: number): number => from + ((to - from) * i) / count);
    const ks: number[] = xs.map((s: number): number => target(s) / unitHull(s));
    const spline: AutoMovieHumanNaturalSpline.ISpline = AutoMovieHumanNaturalSpline.create(xs, ks);
    const scale = (s: number): number => AutoMovieHumanNaturalSpline.evaluate(spline, Math.min(to, Math.max(from, s)));

    // The section's axes: forward across the heading, and the heading crossed
    // with forward, which is lateral on the left side.
    const frame = (s: number): [Vec3, Vec3] => {
      const h: Vec3 = axis.heading(s);
      const k: number = h[0];
      const f: Vec3 = unit([1 - k * h[0], -k * h[1], -k * h[2]]);

      return [f, cross(h, f)];
    };

    const radius = (s: number, theta: number): [number, number, number] => {
      const k: number = scale(s);
      const r: [number, number, number] = unitRadius(s, theta);

      return [k * r[0], k * r[1], k * r[2]];
    };

    return {
      axis,
      frame,
      radius,
      surface: (s: number, theta: number): Vec3 => {
        const c: Vec3 = axis.at(s);
        const [f, g]: [Vec3, Vec3] = frame(s);
        const r: number = radius(s, theta)[0];
        const x: number = r * Math.cos(theta);
        const z: number = r * Math.sin(theta);

        return [c[0] + x * f[0] + z * g[0], c[1] + x * f[1] + z * g[1], c[2] + x * f[2] + z * g[2]];
      },
      scale,
      girth: (s: number): number => hullOf(s, scale(s)),
    };
  }
  /**
   * The world control points of the tube's own section at a walk length, a
   * uniform periodic cubic B-spline of `count` control points in the phase
   * `theta`, assembled from its guides and sectors
   * (`AutoMovieHumanSeamKnot.assemble`): each guide, at the knot of its
   * angle, writes its published jet (point, tangent, curvature) exactly, and
   * each sector's own knots come from its curve.
   *
   * @param count Control points, a multiple of the guides' count.
   */
  export function controls(tube: ITube, s: number, count: number): Vec3[] {
    const knots: number = count / AutoMovieHumanArmGuides.ANGLES.length;
    if (!Number.isInteger(knots)) throw new Error(`An arm section of ${count} control points cannot hold its guides at knots`);
    const jet = (theta: number): AutoMovieHumanSeamKnot.Jet => AutoMovieHumanPolarSector.point(tube.radius(s, theta), theta);
    const guides: AutoMovieHumanSeamKnot.IGuide[] = AutoMovieHumanArmGuides.ANGLES.map(
      (angle: number, j: number): AutoMovieHumanSeamKnot.IGuide => {
        const [p, d1, d2] = jet(angle);
        const published = AutoMovieHumanSeam.publish(p, d1, d2);
        return {
          knot: j * knots,
          jet: published,
          speed: Math.hypot(d1[0]!, d1[1]!),
          acceleration: d2[0]! * published.tangent[0]! + d2[1]! * published.tangent[1]!,
        };
      },
    );
    const sectors: AutoMovieHumanSeamKnot.ISector[] = AutoMovieHumanArmGuides.ANGLES.map(
      (_: number, j: number): AutoMovieHumanSeamKnot.ISector => ({ name: `arm sector ${j}`, jet }),
    );
    const flat: number[] = AutoMovieHumanSeamKnot.assemble(count, guides, sectors);
    const c: Vec3 = tube.axis.at(s);
    const [f, g] = tube.frame(s);
    return Array.from({ length: count }, (_: unknown, m: number): Vec3 => {
      const x: number = flat[m]!;
      const z: number = flat[count + m]!;
      return [c[0] + x * f[0] + z * g[0], c[1] + x * f[1] + z * g[1], c[2] + x * f[2] + z * g[2]];
    });
  }
}

/** A point or direction. */
type Vec3 = [number, number, number];

/** Spacing of the scale's grid along the walk, mm. */
const GRID: number = 2;

/** Angles of a section's hull. */
const GIRTH_PHASES: number = 256;

function unit(a: Vec3): Vec3 {
  const l: number = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/** Perimeter of the convex hull of points in a plane (monotone chain): a taut tape. */
function hull(points: readonly [number, number][]): number {
  const p: [number, number][] = [...points].sort(
    (u: [number, number], v: [number, number]): number => u[0] - v[0] || u[1] - v[1],
  );
  if (p.length < 3) return 0;
  const turn = (o: [number, number], a: [number, number], b: [number, number]): number =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const chain = (list: [number, number][]): [number, number][] => {
    const out: [number, number][] = [];
    for (const q of list) {
      while (out.length >= 2 && turn(out[out.length - 2]!, out[out.length - 1]!, q) <= 0) out.pop();
      out.push(q);
    }
    return out;
  };
  const ring: [number, number][] = [...chain(p).slice(0, -1), ...chain([...p].reverse()).slice(0, -1)];
  let sum: number = 0;
  ring.forEach((q: [number, number], i: number): void => {
    const r: [number, number] = ring[(i + 1) % ring.length]!;
    sum += Math.hypot(r[0] - q[0], r[1] - q[1]);
  });
  return sum;
}
