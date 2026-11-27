import {
  AutoMovieEnginePlanarHull,
  AutoMovieLoftRelief,
  AutoMovieNaturalSpline,
  AutoMoviePolarSector,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanArmAxis,
  IAutoMovieHumanArmTube,
  IAutoMovieHumanSeamKnot,
  IAutoMovieLoftRelief,
  IAutoMovieNaturalCubicSpline,
} from "@automovie/interface";

import { AutoMovieHumanSeam } from "../lofting/AutoMovieHumanSeam";
import { AutoMovieHumanSeamKnot } from "../lofting/AutoMovieHumanSeamKnot";
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
 * `s` (`AutoMoviePolarSector`), the reliefs windows in `(s, theta)`
 * whose height, slope and curvature vanish at their edges, and `K(s)` the
 * scale that makes the section's hull, a taut tape, measure the girth the
 * span law asks for at `s`. So a girth input is honoured at its site on this
 * very surface, reliefs included. The angle runs from forward across the bone
 * (`f`, the world's +X with the walk's heading taken out) toward `g = h x f`,
 * lateral on the left side.
 */
export namespace AutoMovieHumanArmTube {
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
    axis: IAutoMovieHumanArmAxis.IAxis,
    shape: IAutoMovieHumanArmTube.BuildShape,
    reliefs: readonly IAutoMovieLoftRelief[],
    target: IAutoMovieHumanArmTube.BuildTarget,
    from: number,
    to: number,
    hulls: Map<number, number> = new Map(),
  ): IAutoMovieHumanArmTube.ITube {
    // The normalised radius at a walk length and angle: the sectors' polar
    // section plus the reliefs' heights, with its first two angle derivatives
    // so a guide can publish its jet.
    const unitRadius = (s: number, theta: number): [number, number, number] => {
      const own: IAutoMovieHumanArmTube.IShape = shape(s);
      const r: [number, number, number] = AutoMoviePolarSector.radius(
        own.guides,
        own.fullness,
        theta,
      );

      for (const relief of reliefs) {
        const j: number[] = AutoMovieLoftRelief.jet(relief, s, theta);
        r[0] += j[0]!;
        r[1] += j[2]!;
        r[2] += j[5]!;
      }

      return r;
    };

    // The hull perimeter of the normalised section times a scale: a taut tape
    // lies on the hull, and the hull is linear in the scale.
    const hullOf = (s: number, k: number): number =>
      AutoMovieEnginePlanarHull.perimeter(
        Array.from(
          { length: GIRTH_PHASES },
          (_: unknown, i: number): [number, number] => {
            const t: number = (2 * Math.PI * i) / GIRTH_PHASES;
            const r: number = k * unitRadius(s, t)[0];

            return [r * Math.cos(t), r * Math.sin(t)];
          },
        ),
        0,
        1,
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
    const xs: number[] = Array.from(
      { length: count + 1 },
      (_: unknown, i: number): number => from + ((to - from) * i) / count,
    );
    const ks: number[] = xs.map((s: number): number => target(s) / unitHull(s));
    const spline: IAutoMovieNaturalCubicSpline = AutoMovieNaturalSpline.create(
      xs,
      ks,
    );
    const scale = (s: number): number =>
      AutoMovieNaturalSpline.evaluate(spline, Math.min(to, Math.max(from, s)));

    // The section's axes: forward across the heading, and the heading crossed
    // with forward, which is lateral on the left side.
    const frame = (
      s: number,
    ): [AutoMovieVector3Tuple, AutoMovieVector3Tuple] => {
      const h: AutoMovieVector3Tuple = axis.heading(s);
      const k: number = h[0];
      const f: AutoMovieVector3Tuple = unit([
        1 - k * h[0],
        -k * h[1],
        -k * h[2],
      ]);

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
      surface: (s: number, theta: number): AutoMovieVector3Tuple => {
        const c: AutoMovieVector3Tuple = axis.at(s);
        const [f, g]: [AutoMovieVector3Tuple, AutoMovieVector3Tuple] = frame(s);
        const r: number = radius(s, theta)[0];
        const x: number = r * Math.cos(theta);
        const z: number = r * Math.sin(theta);

        return [
          c[0] + x * f[0] + z * g[0],
          c[1] + x * f[1] + z * g[1],
          c[2] + x * f[2] + z * g[2],
        ];
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
  export function controls(
    tube: IAutoMovieHumanArmTube.ITube,
    s: number,
    count: number,
  ): AutoMovieVector3Tuple[] {
    const knots: number = count / AutoMovieHumanArmGuides.ANGLES.length;
    if (!Number.isInteger(knots))
      throw new Error(
        `An arm section of ${count} control points cannot hold its guides at knots`,
      );
    const jet = (theta: number): IAutoMovieHumanSeamKnot.Jet =>
      AutoMoviePolarSector.point(tube.radius(s, theta), theta);
    const guides: IAutoMovieHumanSeamKnot.IGuide[] =
      AutoMovieHumanArmGuides.ANGLES.map(
        (angle: number, j: number): IAutoMovieHumanSeamKnot.IGuide => {
          const [p, d1, d2] = jet(angle);
          const published = AutoMovieHumanSeam.publish(p, d1, d2);
          return {
            knot: j * knots,
            jet: published,
            speed: Math.hypot(d1[0]!, d1[1]!),
            acceleration:
              d2[0]! * published.tangent[0]! + d2[1]! * published.tangent[1]!,
          };
        },
      );
    const sectors: IAutoMovieHumanSeamKnot.ISector[] =
      AutoMovieHumanArmGuides.ANGLES.map(
        (_: number, j: number): IAutoMovieHumanSeamKnot.ISector => ({
          name: `arm sector ${j}`,
          jet,
        }),
      );
    const flat: number[] = AutoMovieHumanSeamKnot.assemble(
      count,
      guides,
      sectors,
    );
    const c: AutoMovieVector3Tuple = tube.axis.at(s);
    const [f, g] = tube.frame(s);
    return Array.from(
      { length: count },
      (_: unknown, m: number): AutoMovieVector3Tuple => {
        const x: number = flat[m]!;
        const z: number = flat[count + m]!;
        return [
          c[0] + x * f[0] + z * g[0],
          c[1] + x * f[1] + z * g[1],
          c[2] + x * f[2] + z * g[2],
        ];
      },
    );
  }
}

/** Spacing of the scale's grid along the walk, mm. */
const GRID: number = 2;

/** Angles of a section's hull. */
const GIRTH_PHASES: number = 256;

function unit(a: AutoMovieVector3Tuple): AutoMovieVector3Tuple {
  const l: number = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
}

function cross(
  a: AutoMovieVector3Tuple,
  b: AutoMovieVector3Tuple,
): AutoMovieVector3Tuple {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
