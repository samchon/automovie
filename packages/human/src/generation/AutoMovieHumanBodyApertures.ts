import { AutoMovieHumanLoftAperture } from "../lofting/AutoMovieHumanLoftAperture";
import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanApertureHoles } from "./AutoMovieHumanApertureHoles";
import { AutoMovieHumanEyelid } from "./AutoMovieHumanEyelid";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/** Openings prepared once: their margins, cut outlines and lids, and the rows refined near them. */
export namespace AutoMovieHumanBodyApertures {
  /** An aperture with its margin and projected cut outline evaluated once. */
  export interface IPrepared {
    /** Aperture data. */
    aperture: IAutoMovieHumanLoftAperture;

    /**
     * Projected outline of the cut: the margin itself, or for an eye the
     * outer edge of the lid band around it.
     */
    outline: AutoMovieHumanLoftAperture.IOutline;

    /**
     * Lid of an eye opening: the calibrated eye nearest the margin's centre
     * lies behind it; null for any other opening.
     */
    lid: AutoMovieHumanEyelid.ILid | null;

    /**
     * The points the skin is cut along, whose projection is {@link outline}:
     * the margin, or for an eye the lid band's outer edge, one point per lid
     * sample.
     */
    edge: AutoMovieHumanLoftAperture.Point[];
  }

  /** Station spacing where a chain's rings pass near an opening, mm. */
  const SPACING: number = 0.5;

  /** Distance around an opening's outline that still counts as near, mm. */
  const REACH: number = 2;

  /**
   * Evaluate each aperture's margin once and find the globe behind it.
   *
   * @param apertures Calibrated openings.
   * @param eyes Calibrated eye spheres.
   */
  export function prepare(
    apertures: readonly IAutoMovieHumanLoftAperture[],
    eyes: readonly IAutoMovieHumanBodyCalibration.IEye[],
  ): IPrepared[] {
    return apertures.map((aperture: IAutoMovieHumanLoftAperture): IPrepared => {
      const margin: AutoMovieHumanLoftAperture.Point[] =
        AutoMovieHumanLoftAperture.polyline(aperture);

      // A globe belongs to the opening whose margin centre lies within its
      // radius plus a margin of half that again.
      const centre: number[] = [0, 1, 2].map(
        (axis: number): number =>
          margin.reduce(
            (sum: number, p: AutoMovieHumanLoftAperture.Point): number =>
              sum + p[axis]!,
            0,
          ) / margin.length,
      );
      let globe: IAutoMovieHumanBodyCalibration.IEye | null = null;
      let best: number = Infinity;
      for (const eye of eyes) {
        const d: number = Math.hypot(
          eye.centre[0] - centre[0]!,
          eye.centre[1] - centre[1]!,
          eye.centre[2] - centre[2]!,
        );
        if (d < 1.5 * eye.radius && d < best) {
          best = d;
          globe = eye;
        }
      }
      if (globe === null)
        return {
          aperture,
          outline: AutoMovieHumanLoftAperture.outline(aperture, margin),
          lid: null,
          edge: margin,
        };

      // An eye is cut out to the lid band's outer edge.
      const lid: AutoMovieHumanEyelid.ILid = AutoMovieHumanEyelid.create(
        aperture,
        globe,
      );
      const edge: AutoMovieHumanLoftAperture.Point[] = lid.samples.map(
        (s: AutoMovieHumanEyelid.ISample): AutoMovieHumanLoftAperture.Point =>
          AutoMovieHumanEyelid.add(s.contact, AutoMovieHumanEyelid.scale(s.outward, AutoMovieHumanEyelid.rule.band)),
      );
      return {
        aperture,
        outline: AutoMovieHumanLoftAperture.outline(aperture, edge),
        lid,
        edge,
      };
    });
  }

  /**
   * Stations refined wherever a chain's rings pass through a detail box,
   * at the same SPACING as around openings: a colour boundary drawn per
   * vertex, such as the lips', is otherwise sampled on triangles several
   * millimetres tall and shows as steps.
   *
   * @param boxes World boxes `[min, max]` in mm.
   * @param target Chain being lofted.
   * @param heights Increasing stations.
   * @param phases Probe phases, the chain's own ring phases.
   */
  export function detail(
    boxes: readonly [[number, number, number], [number, number, number]][],
    target: IAutoMovieHumanLoftChain,
    heights: readonly number[],
    phases: readonly number[],
  ): number[] {
    if (!boxes.length) return [...heights];
    const near: (s: number) => boolean = (s: number): boolean =>
      AutoMovieHumanLoftChain.ring(target, s, phases).some(
        (p: [number, number, number]): boolean =>
          boxes.some(
            ([lo, hi]: [
              [number, number, number],
              [number, number, number],
            ]): boolean =>
              p[0] >= lo[0] &&
              p[0] <= hi[0] &&
              p[1] >= lo[1] &&
              p[1] <= hi[1] &&
              p[2] >= lo[2] &&
              p[2] <= hi[2],
          ),
      );
    return split(heights, near);
  }

  /**
   * Stations refined wherever a chain's rings pass near an opening.
   *
   * An interval between consecutive stations is split into SPACING mm steps
   * when its end or middle ring has a point within REACH of an opening's
   * cut outline, so the cut is traced finely whatever the bisection chose
   * and whatever the orientation of the chain's sections.
   *
   * @param apertures Prepared openings.
   * @param target Chain being lofted.
   * @param heights Increasing stations from the bisection.
   * @param phases Probe phases, the chain's own ring phases.
   */
  export function refine(
    apertures: readonly IPrepared[],
    target: IAutoMovieHumanLoftChain,
    heights: readonly number[],
    phases: readonly number[],
  ): number[] {
    if (!apertures.length) return [...heights];
    const near: (s: number) => boolean = (s: number): boolean =>
      AutoMovieHumanLoftChain.ring(target, s, phases).some(
        (p: [number, number, number]): boolean =>
          apertures.some(
            (a: IPrepared): boolean =>
              AutoMovieHumanLoftAperture.signed(a.outline, p, REACH) < REACH,
          ),
      );

    // Between two rows a skin point near an opening rises by at most half
    // the opening's own thickness (`AutoMovieHumanApertureHoles`), so every
    // column crosses it in at least two rows and no row bridges it: a tilted
    // section's front points rise faster than its station.
    const half: number[] = apertures.map((a: IPrepared): number => AutoMovieHumanApertureHoles.thickness(a.outline) / 2);
    const count = (a: number, b: number): number => {
      const lo: [number, number, number][] = AutoMovieHumanLoftChain.ring(target, a, phases);
      const hi: [number, number, number][] = AutoMovieHumanLoftChain.ring(target, b, phases);
      let steps: number = Math.ceil((b - a) / SPACING);
      for (let i: number = 0; i < lo.length; i++)
        apertures.forEach((p: IPrepared, k: number): void => {
          if (half[k]! > 0 && AutoMovieHumanLoftAperture.signed(p.outline, lo[i]!, REACH) < REACH)
            steps = Math.max(steps, Math.ceil(Math.abs(hi[i]![1] - lo[i]![1]) / half[k]!));
        });
      return steps;
    };
    return split(heights, near, count);
  }

  /**
   * Split every interval whose end or middle ring is near into SPACING mm
   * steps.
   */
  function split(
    heights: readonly number[],
    near: (s: number) => boolean,
    count: (a: number, b: number) => number = (a: number, b: number): number => Math.ceil((b - a) / SPACING),
  ): number[] {
    const out: number[] = [heights[0]!];
    const marked: boolean[] = heights.map(near);
    for (let k: number = 0; k + 1 < heights.length; k++) {
      const a: number = heights[k]!;
      const b: number = heights[k + 1]!;
      // An interval no longer than the spacing whose ends are not near is not
      // near in the middle either: the reach round an opening is wider.
      if (marked[k] || marked[k + 1] || (b - a > SPACING && near((a + b) / 2))) {
        const steps: number = count(a, b);
        for (let i: number = 1; i < steps; i++) out.push(a + ((b - a) * i) / steps);
      }
      out.push(b);
    }
    return out;
  }
}
