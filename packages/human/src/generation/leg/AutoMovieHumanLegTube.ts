import { AutoMovieHumanChordArc } from "../../lofting/AutoMovieHumanChordArc";
import { AutoMovieHumanPolarSector } from "../../lofting/AutoMovieHumanPolarSector";
import { AutoMovieHumanSeamCarve } from "../../lofting/AutoMovieHumanSeamCarve";
import { AutoMovieHumanSeamKnot } from "../../lofting/AutoMovieHumanSeamKnot";
import { AutoMovieHumanSeamUnion } from "../../lofting/AutoMovieHumanSeamUnion";
import { AutoMovieHumanRelief } from "../../network/AutoMovieHumanRelief";
import type { IAutoMovieHumanRelief } from "../../network/IAutoMovieHumanRelief";
import { AutoMovieHumanLegGuides } from "./AutoMovieHumanLegGuides";
import { AutoMovieHumanLegHull } from "./AutoMovieHumanLegHull";
import type { AutoMovieHumanLegStations } from "./AutoMovieHumanLegStations";

/**
 * The leg's tube: the section at a station, in the section's own chart about
 * the axis point (`x` forward, `z` lateral), assembled from the eight guides,
 * the eight sector arcs between them and the reliefs, scaled so its taut
 * girth is the girth law's.
 *
 * Each sector is a chord arc between its two guides' jets
 * (`AutoMovieHumanChordArc`) sampled at its 33 knots; each guide writes its
 * three control points exactly (`AutoMovieHumanSeamKnot.assemble`), so the
 * section is G2 across every guide. The shape is in units of the girth over
 * 2 pi, so the scale `K` that makes the section's hull (a taut tape)
 * measure the girth is solved on the very section emitted, reliefs included:
 * a girth input is honoured at its site on this surface with no ratio. The
 * guides and sectors are the base envelope; each relief joins it along the
 * knot's outward ray by the shared operators: a bump adds volume only
 * (AutoMovieHumanSeamUnion.bump), a declared recess removes it
 * (AutoMovieHumanSeamCarve.dent).
 */
export namespace AutoMovieHumanLegTube {
  /** What the tube is placed from. */
  export interface IInput {
    /** The joints' heights, which place the landmark rows. */
    bones: AutoMovieHumanLegStations.IBones;

    /** The girth the section asks for at a station, mm. */
    girth: (s: number) => number;

    /** The reliefs, their windows on the chart (station in mm, phase in radians) and their axes in the section frame. */
    reliefs: readonly IAutoMovieHumanRelief[];

    /** The neighbours' rings as the shape's first and last rows. */
    ends?: AutoMovieHumanLegGuides.IEnds;
  }

  /** One station's section. */
  export interface ISection {
    /** The scale from the unit shape to millimetres. */
    scale: number;

    /** The taut girth of the section, mm. */
    girth: number;

    /** The 264 knot points `[x, z]`, mm. */
    points: [number, number][];

    /** The spline section's coefficients `[x_0 .. x_263, z_0 .. z_263]`, mm. */
    controls: number[];
  }

  /** Control points of the section: eight sectors of 33 knot spans. */
  export const COUNT: number = 264;

  /** Knot spans of one sector. */
  export const SPANS: number = COUNT / AutoMovieHumanLegGuides.ANGLES.length;

  /**
   * The tube.
   *
   * @param input The joints, the girth law and the reliefs.
   * @returns The section at a station.
   */
  export function of(input: IInput): (s: number) => ISection {
    const shape: (s: number) => AutoMovieHumanLegGuides.IShape = AutoMovieHumanLegGuides.shape(input.bones, input.ends);
    const h: number = (2 * Math.PI) / COUNT;
    return (s: number): ISection => {
      const own: AutoMovieHumanLegGuides.IShape = shape(s);
      const ends: AutoMovieHumanChordArc.IEnd[] = own.guides.map(
        (g: AutoMovieHumanPolarSector.IGuide): AutoMovieHumanChordArc.IEnd => AutoMovieHumanPolarSector.publish(g),
      );
      const count: number = ends.length;

      // The unit shape at the knots: each sector's arc between its guides.
      const unit: [number, number][] = Array.from({ length: COUNT }, (_: unknown, m: number): [number, number] => {
        const j: number = Math.floor(m / SPANS);
        const p: number[] = AutoMovieHumanChordArc.jet(ends[j]!, ends[(j + 1) % count]!, own.fullness[j]!, (m - j * SPANS) / SPANS)[0];
        return [p[0]!, p[1]!];
      });

      // Each relief's radial height at the knot: its height along its own axis
      // read on the knot's outward ray. A relief whose axis points out of the
      // leg at its centre adds volume, one whose axis points in is a declared
      // recess.
      const rise: number[] = new Array<number>(COUNT).fill(0);
      const sink: number[] = new Array<number>(COUNT).fill(0);
      unit.forEach((p: [number, number], m: number): void => {
        const length: number = Math.hypot(p[0], p[1]);
        const e: [number, number] = [p[0] / length, p[1] / length];
        for (const r of input.reliefs) {
          const height: number = AutoMovieHumanRelief.height(r, s, m * h)[0];
          if (height === 0) continue;
          const middle: number = r.phases[0] + (r.phases[1] - r.phases[0]) / 2;
          const additive: boolean = r.axis[0] * Math.cos(middle) + r.axis[2] * Math.sin(middle) > 0;
          const radial: number = height * (r.axis[0] * e[0] + r.axis[2] * e[1]);
          if (additive) rise[m] = rise[m]! + Math.max(0, radial);
          else sink[m] = sink[m]! + Math.min(0, radial);
        }
      });

      // The scale that makes the emitted section's taut girth the law's. The
      // base is the guides' envelope; the reliefs join it by the shared
      // operators, the bumps by adding volume only and the recesses by
      // removing it, along each knot's own ray. They are fixed in millimetres,
      // so the hull is not linear in K and a fixed point settles it.
      const target: number = input.girth(s);
      const place: (k: number) => [number, number][] = (k: number): [number, number][] =>
        unit.map((p: [number, number], m: number): [number, number] => {
          const base: number = k * Math.hypot(p[0], p[1]);
          const r: number = AutoMovieHumanSeamCarve.dent(AutoMovieHumanSeamUnion.bump(base, rise[m]!), sink[m]!);
          return [(p[0] * r) / Math.hypot(p[0], p[1]), (p[1] * r) / Math.hypot(p[0], p[1])];
        });
      let scale: number = target / AutoMovieHumanLegHull.girth(unit);
      for (let i: number = 0; i < 8; i++) scale *= target / AutoMovieHumanLegHull.girth(place(scale));
      const points: [number, number][] = place(scale);

      // The spline's control points: the guides write their jets exactly, scaled.
      const chord: (j: number) => number = (j: number): number => {
        const a: readonly number[] = ends[j]!.point;
        const b: readonly number[] = ends[(j + 1) % count]!.point;
        return Math.hypot(b[0]! - a[0]!, b[1]! - a[1]!);
      };
      const guides: AutoMovieHumanSeamKnot.IGuide[] = ends.map((e: AutoMovieHumanChordArc.IEnd, j: number): AutoMovieHumanSeamKnot.IGuide => ({
        knot: j * SPANS,
        jet: {
          point: e.point.map((v: number): number => scale * v),
          tangent: [...e.tangent],
          curvature: e.curvature.map((v: number): number => v / scale),
        },
        speed: (scale * (chord(j) + chord((j + count - 1) % count))) / 2 / (SPANS * h),
      }));
      const sectors: AutoMovieHumanSeamKnot.ISector[] = ends.map((_: AutoMovieHumanChordArc.IEnd, j: number): AutoMovieHumanSeamKnot.ISector => ({
        name: `leg sector ${j}`,
        jet: (t: number): AutoMovieHumanSeamKnot.Jet => {
          const xi: number = (t - j * SPANS * h) / (SPANS * h);
          const [p, d1, d2]: AutoMovieHumanChordArc.Jet = AutoMovieHumanChordArc.jet(ends[j]!, ends[(j + 1) % count]!, own.fullness[j]!, xi);
          const speed: number = SPANS * h;
          return [
            p.map((v: number): number => scale * v),
            d1.map((v: number): number => (scale * v) / speed),
            d2.map((v: number): number => (scale * v) / (speed * speed)),
          ];
        },
      }));
      const flat: number[] = AutoMovieHumanSeamKnot.assemble(COUNT, guides, sectors);

      // The reliefs are smooth fields: added at the control points' knots, as
      // the emitted points' offset from the bare envelope.
      const controls: number[] = flat.map((v: number, i: number): number => {
        const m: number = i % COUNT;
        const c: 0 | 1 = i < COUNT ? 0 : 1;
        return v + points[m]![c] - scale * unit[m]![c];
      });
      return { scale, girth: AutoMovieHumanLegHull.girth(points), points, controls };
    };
  }
}
