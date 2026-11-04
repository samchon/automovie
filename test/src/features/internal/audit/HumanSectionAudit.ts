import type { IAutoMovieHumanBodyCalibration } from "../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieLoftChain, AutoMovieLoftFrame, type IAutoMovieLoftChain } from "@automovie/engine";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanAnatomyShared } from "../HumanAnatomyShared";
import { HumanAnatomyVector } from "../HumanAnatomyVector";
import { HumanSeamObserver } from "../HumanSeamObserver";
import { HumanSectionReading } from "./HumanSectionReading";

type IRow = HumanAnatomyAudit.IRow;
type P2 = HumanSectionReading.P2;

/**
 * The section-curve invariants of #3057, one data-driven audit over every
 * section of every chain of a body: the same rules for the trunk, a limb, a
 * phalanx or an ear, read on the delivered chains by their own public
 * evaluator (`AutoMovieLoftChain.sampler`, `.frame`) and measured in
 * each section's own plane, so no rule names a part or recomputes a law.
 *
 * At every layer and midway between neighbouring layers each section is
 * read whole: closed, simple, its curvature continuous round the ring and,
 * on a part lofted from its views, touching its outline box at the four
 * guides with zero angular slope. At every station 2 mm apart it is read
 * star-shaped about its axis, and its breadth, depth and taut-tape girth
 * along the stations must be fair: no step or wobble sharper than the
 * catalog's crease bound lets a smooth outline make.
 */
export namespace HumanSectionAudit {
  /** Station step of the profiles, input mm (as `HumanCurveRings.STEP`). */
  export const STEP: number = 2;

  /** Phases per section; a 192-gon under-reads a circle's perimeter by 4.5e-5 of it. */
  export const PHASES: number = 192;

  /** Stations at each chain end left out of the profiles, where a ring closes to a pole or opens a join (as `HumanCurveRingAudit.ENDS`). */
  export const ENDS: number = 3;

  /**
   * Largest normal angle of a section at its guide, radians: the class A
   * surfacing limit of 0.1 degree (`HumanSeamObserver.rendered`), the least
   * mismatch a renderer's shading shows.
   */
  export const SLOPE: number = (0.1 * Math.PI) / 180;

  /**
   * Largest overhang of a section past its guide point, input mm: the least
   * error of a breadth or depth reading, ISO 20685-1:2018 Table 4 for head
   * and hand breadths (`HumanAnatomyShared.HEAD`), the finest the standard
   * resolves.
   */
  export const OVERHANG: number = HumanAnatomyShared.HEAD;

  /**
   * Largest second difference of a girth profile over 2 mm stations, input
   * mm: the crease bound (sagitta 1 mm over a 10 mm chord, meridian curvature
   * 0.08 /mm) run round the whole ring, `2 pi 0.08 2^2`, as CUR-3.
   */
  export const GIRTH: number = 2 * Math.PI * (8 / 100) * STEP ** 2;

  /**
   * Largest second difference of a breadth or depth profile over 2 mm
   * stations, input mm: both of the extent's outlines bending at the crease
   * curvature 0.08 /mm the same way, `2 0.08 2^2`.
   */
  export const EXTENT: number = 2 * (8 / 100) * STEP ** 2;

  /** How a body's chains are read. */
  export interface IOptions {
    /** Input mm per calibration mm. */
    k: number;

    /** Stature, input mm: the coordinates' magnitude for the closure's float32 limit. */
    stature: number;
  }

  /** Every invariant row of every chain of a body. */
  export function rows(person: string, body: IAutoMovieHumanBodyCalibration, options: IOptions): IRow[] {
    return body.chains.flatMap((c: IAutoMovieLoftChain): IRow[] => chain(person, c, options));
  }

  /** Every invariant row of one chain. */
  export function chain(person: string, c: IAutoMovieLoftChain, options: IOptions): IRow[] {
    const out: IRow[] = [];
    const k: number = options.k;
    const row: (site: string, value: number, low: number, high: number, unit: string) => void = (site: string, value: number, low: number, high: number, unit: string): void => {
      out.push({ person, site: `${c.name} ${site}`, value, low, high, unit });
    };
    const framed: boolean = c.layers[0]!.frame !== undefined;
    const closure: number = options.stature * 2 ** -24;

    // Whole-section readings at every layer and midway between layers. A
    // layer the view operator drew carries its box (`ILayer.view`); a
    // midway section is guided when both of its layers are.
    const whole: [string, number, IAutoMovieLoftChain.IView | null, boolean][] = [];
    c.layers.forEach((l: IAutoMovieLoftChain.ILayer, i: number): void => {
      whole.push([`/${i}`, l.y, l.view ?? null, l.view !== undefined]);
      const next: IAutoMovieLoftChain.ILayer | undefined = c.layers[i + 1];
      if (next !== undefined) whole.push([`/${i}.5`, (l.y + next.y) / 2, null, l.view !== undefined && next.view !== undefined]);
    });
    for (const [label, s, view, guided] of whole) {
      const curve: HumanSectionReading.Curve = section(c, s);
      const points: P2[] = HumanSectionReading.sample(curve, PHASES);
      const perimeter: number = HumanSectionReading.perimeter(points) * k;

      // A section shrunk to its pole has no shape to read.
      if (!(perimeter > 0.01)) continue;
      row(`${label} closure: gap between phase 0 and 2 pi`, HumanSectionReading.closure(curve) * k, 0, closure, "mm");
      row(`${label} self-crossings`, HumanSectionReading.crossings(points), 0, 0, "pairs");

      // The visible curvature jump: 0.1 degree of normal over one of the chain's own vertex spacings.
      const j: HumanSectionReading.IJump = HumanSectionReading.jump(curve, PHASES);
      const limit: number = HumanSeamObserver.rendered(options.stature, perimeter / c.samples).curvature;
      row(`${label} curvature jump round the section, at phase ${j.at.toFixed(3)}`, j.jump / k, 0, limit, "1/mm");

      // A view-lofted section touches its box about the plane's origin, the part's axis.
      if (guided)
        HumanSectionReading.touch(curve, [0, 0], PHASES).forEach((t: HumanSectionReading.ITouch, g: number): void => {
          const deg: string = ((t.guide * 180) / Math.PI).toFixed(0);
          row(`${label} guide ${deg} deg: normal angle to the guide's ray`, t.slope, 0, SLOPE, "rad");
          row(`${label} guide ${deg} deg: overhang past the guide point`, t.overhang * k, 0, OVERHANG, "mm");
          if (view !== null) row(`${label} guide ${deg} deg: guide radius less the box's declared half extent`, Math.abs(t.radius - view.extents[g]!) * k, 0, OVERHANG, "mm");
        });
    }

    // Profiles every 2 mm, the last station at the chain's end.
    const first: number = c.layers[0]!.y;
    const last: number = c.layers[c.layers.length - 1]!.y;
    const count: number = Math.max(1, Math.round(((last - first) * k) / STEP));
    const breadth: number[] = [];
    const depth: number[] = [];
    const girth: number[] = [];
    const stations: number[] = [];
    let backward: number = 0;
    let where: number = first;
    for (let i: number = 0; i <= count; i++) {
      const s: number = first + ((last - first) * i) / count;
      const points: P2[] = HumanSectionReading.sample(section(c, s), PHASES);
      if (!(HumanSectionReading.perimeter(points) * k > 0.01)) continue;
      const [b, d]: P2 = HumanSectionReading.extents(points);
      stations.push(s);
      breadth.push(b * k);
      depth.push(d * k);
      girth.push(HumanAnatomyVector.hull(points) * k);
      const turned: number = HumanSectionReading.backward(points, framed ? [0, 0] : HumanSectionReading.centroid(points));
      if (turned > backward) {
        backward = turned;
        where = s;
      }
    }
    row(`star-shaped about its axis: most points turning backward, at station ${(where * k).toFixed(0)} mm`, backward, 0, 0, "points");
    for (const [name, values, high] of [
      ["breadth", breadth, EXTENT],
      ["depth", depth, EXTENT],
      ["girth", girth, GIRTH],
    ] as [string, number[], number][]) {
      const worst: { value: number; at: number } = secondDifference(values);
      if (values.length > 2 * ENDS + 2) row(`${name} profile: largest second difference over 2 mm stations, at station ${((stations[worst.at] ?? first) * k).toFixed(0)} mm`, worst.value, 0, high, "mm");
    }
    return out;
  }

  /**
   * One station's section in its own plane: the chain's world points at that
   * station projected on the station's frame, so a lift out of the plane is
   * dropped and the planar shape is what is read.
   */
  export function section(c: IAutoMovieLoftChain, s: number): HumanSectionReading.Curve {
    const f: AutoMovieLoftFrame.IFrame = AutoMovieLoftChain.frame(c, s);
    const point: (t: number) => [number, number, number] = AutoMovieLoftChain.sampler(c, s);
    return (t: number): P2 => AutoMovieLoftFrame.local(f, point(t));
  }

  /** The largest absolute second difference of a profile away from its ends, and its index. */
  function secondDifference(values: readonly number[]): { value: number; at: number } {
    let value: number = 0;
    let at: number = 0;
    for (let i: number = 1 + ENDS; i + 1 + ENDS < values.length; i++) {
      const d: number = Math.abs(values[i + 1]! - 2 * values[i]! + values[i - 1]!);
      if (d > value) {
        value = d;
        at = i;
      }
    }
    return { value, at };
  }
}
