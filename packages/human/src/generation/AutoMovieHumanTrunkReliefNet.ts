import { AutoMovieEngineLoftRelief } from "@automovie/engine";
import type {
  IAutoMovieHumanTrunkFeature,
  IAutoMovieHumanTrunkReliefNet,
  IAutoMovieLoftRelief,
} from "@automovie/interface";

import { AutoMovieHumanSeamCarve } from "../lofting/AutoMovieHumanSeamCarve";
import { AutoMovieHumanSeamUnion } from "../lofting/AutoMovieHumanSeamUnion";
import { AutoMovieHumanTrunkFeatureFrame } from "./AutoMovieHumanTrunkFeatureFrame";

/**
 * The merge of a feature into the trunk: a relief window over the trunk's
 * chart whose control net is the feature's height sampled at the base surface.
 *
 * A window's net has its three outer rings zero (`IAutoMovieLoftRelief`), so
 * the relief's height, slope and curvature vanish at the window's edge (rule
 * J7). With n controls control k peaks at the window fraction `(k - 1) / (n -
 * 3)`, so the inner controls `3 .. n - 4` span `2 / (n - 3)` to `(n - 5) / (n -
 * 3)` of the window. The window is therefore the feature's footprint grown by
 * `2 / (n - 7)` of its length on each side, so the first and last inner
 * controls stand on the footprint's edge, where the feature's own profile
 * meets the wall C2, and no inner control is cut while the feature still
 * stands. Where the grown window would cross one of the chart's ends (the
 * crotch ring, the neck's ring, both shared with a neighbour), it stops there
 * and the feature is drawn toward its apex on that side, so its edge still
 * falls on the first inner control. The evaluated cubic B-spline of a sampled
 * net is a little lower than the samples, so the net is scaled until the
 * relief reaches the feature's extreme height at its apex.
 */
export namespace AutoMovieHumanTrunkReliefNet {
  /** Controls across each direction of a trunk window. */
  export const COUNT: number = 15;

  /**
   * A relief window from a feature.
   *
   * @param name The relief's name.
   * @param feature The feature in its own frame.
   * @param window Where the window lies on the chart.
   * @param base The chart's base surface.
   * @returns The relief; its axis is the feature's own.
   */
  export function fromFeature(
    name: string,
    feature: IAutoMovieHumanTrunkFeature,
    window: IAutoMovieHumanTrunkReliefNet.IWindow,
    base: IAutoMovieHumanTrunkReliefNet.Base,
  ): IAutoMovieLoftRelief {
    const n: number = COUNT;
    const grow: number = 2 / (n - 7);
    const first: number = 2 / (n - 3);
    const last: number = (n - 5) / (n - 3);
    const sLength: number = window.stations.end - window.stations.start;
    const tLength: number = window.phases.end - window.phases.start;
    const apexS: number = window.stations.start + window.apex.station * sLength;
    const apexT: number = window.phases.start + window.apex.phase * tLength;

    // The window: the footprint grown on each side, stopped at the chart's ends.
    const bounds: IAutoMovieHumanTrunkReliefNet.IStationBounds = base.bounds ?? {
      minimum: -Infinity,
      maximum: Infinity,
    };
    const stations: [number, number] = [
      Math.max(bounds.minimum, window.stations.start - grow * sLength),
      Math.min(bounds.maximum, window.stations.end + grow * sLength),
    ];

    // A paired feature's footprint lies on one side of the median plane, the
    // left's between the front and the back midline phases, and its mirror
    // takes the other side, so its window stays on its own side.
    const side: [number, number] =
      window.phases.start >= 0 && window.phases.end <= Math.PI
        ? [0, Math.PI]
        : [-Infinity, Infinity];
    const phases: [number, number] = [
      Math.max(side[0], window.phases.start - grow * tLength),
      Math.min(side[1], window.phases.end + grow * tLength),
    ];
    const sSpan: number = stations[1] - stations[0];
    const tSpan: number = phases[1] - phases[0];

    // The feature drawn toward its apex on a side a bound holds, so the
    // footprint's edge stands on that side's first inner control.
    const draw = (
      lo: number,
      hi: number,
      apex: number,
      held: readonly [number, number],
    ): ((x: number) => number) => {
      const innerLow: number = held[0] + first * (held[1] - held[0]);
      const innerHigh: number = held[0] + last * (held[1] - held[0]);
      const below: number =
        (apex - lo) / Math.max(Number.EPSILON, apex - innerLow);
      const above: number =
        (hi - apex) / Math.max(Number.EPSILON, innerHigh - apex);

      return (x: number): number =>
        apex + (x - apex) * (x < apex ? below : above);
    };
    const drawn: (s: number) => number = draw(
      window.stations.start,
      window.stations.end,
      apexS,
      stations,
    );
    const turned: (t: number) => number = draw(
      window.phases.start,
      window.phases.end,
      apexT,
      phases,
    );
    const heights: number[] = [];

    for (let i: number = 0; i < n; i++)
      for (let j: number = 0; j < n; j++) {
        const inner: boolean = i >= 3 && i <= n - 4 && j >= 3 && j <= n - 4;
        if (!inner) {
          heights.push(0);
          continue;
        }

        // The base point of this control's place, in the feature's frame; its
        // in-plane coordinates give the height the feature has there.
        const s: number = stations[0] + ((i - 1) / (n - 3)) * sSpan;
        const t: number = phases[0] + ((j - 1) / (n - 3)) * tSpan;
        const [u, v]: [number, number, number] =
          AutoMovieHumanTrunkFeatureFrame.local(
            feature.frame,
            base(drawn(s), turned(t)),
          );
        heights.push(feature.height(u, v));
      }
    const relief: IAutoMovieLoftRelief = {
      name,
      stations: { start: stations[0], end: stations[1] },
      phases: { start: phases[0], end: phases[1] },
      axis: feature.frame.axis,
      rows: n,
      columns: n,
      heights,
    };

    // Scale the net so the evaluated relief reaches the feature's height at the apex.
    const reached: number = AutoMovieEngineLoftRelief.height(relief, apexS, apexT)[0];
    const wanted: number = feature.height(feature.apex[0], feature.apex[1]);
    const gain: number = reached !== 0 ? wanted / reached : 0;
    const scaled: number[] = heights.map((h: number): number => h * gain);

    // A feature either adds volume to its base or carves it, never both: the
    // net's sign is the merge's, held by the shared operators (a bump's height
    // at least zero, a dent's depth at most zero), so the evaluated window, a
    // convex combination of the net, keeps that sign everywhere.
    const adds: boolean = scaled.some((h: number): boolean => h > 0);
    for (const h of scaled) {
      if (adds) AutoMovieHumanSeamUnion.bump(0, h);
      else AutoMovieHumanSeamCarve.dent(0, h);
    }

    return { ...relief, heights: scaled };
  }

  /**
   * A left window reflected onto the right (rule J6): phases `2 pi - t`, the
   * net's columns reversed, the axis' z negated.
   *
   * @param relief The left relief.
   * @param name The right relief's name.
   * @returns The right relief.
   */
  export function mirror(
    relief: IAutoMovieLoftRelief,
    name: string,
  ): IAutoMovieLoftRelief {
    const n: number = relief.columns;
    const heights: number[] = [];

    for (let i: number = 0; i < relief.rows; i++)
      for (let j: number = 0; j < n; j++)
        heights.push(relief.heights[i * n + (n - 1 - j)]!);

    return {
      ...relief,
      name,
      phases: {
        start: 2 * Math.PI - relief.phases.end,
        end: 2 * Math.PI - relief.phases.start,
      },
      axis: [relief.axis[0], relief.axis[1], -relief.axis[2]],
      heights,
    };
  }
}
