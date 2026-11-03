import { AutoMovieHumanSeamCarve } from "../lofting/AutoMovieHumanSeamCarve";
import { AutoMovieHumanSeamUnion } from "../lofting/AutoMovieHumanSeamUnion";
import { AutoMovieHumanRelief } from "../network/AutoMovieHumanRelief";
import type { IAutoMovieHumanRelief } from "../network/IAutoMovieHumanRelief";
import { AutoMovieHumanTrunkFeatureFrame } from "./AutoMovieHumanTrunkFeatureFrame";
import type { IAutoMovieHumanTrunkFeature } from "./IAutoMovieHumanTrunkFeature";

/**
 * The merge of a feature into the trunk: a relief window over the trunk's
 * chart whose control net is the feature's height sampled at the base surface.
 *
 * A window's net has its three outer rings zero (`IAutoMovieHumanRelief`), so
 * the relief's height, slope and curvature vanish at the window's edge (rule
 * J7). With n controls control k peaks at the window fraction `(k - 1) / (n -
 * 3)`, so the inner controls `3 .. n - 4` sample the feature there. The
 * evaluated cubic B-spline of a sampled net is a little lower than the
 * samples, so the net is scaled until the relief reaches the feature's
 * extreme height at its apex.
 */
export namespace AutoMovieHumanTrunkReliefNet {
  /** Controls across each direction of a trunk window. */
  export const COUNT: number = 15;

  /** The chart's base surface: the body point at a station and a phase. */
  export type Base = (station: number, phase: number) => AutoMovieHumanTrunkFeatureFrame.V3;

  /** Where the window lies on the chart. */
  export interface IWindow {
    /** Station range, mm. */
    stations: [number, number];

    /** Phase range, radians, increasing. */
    phases: [number, number];

    /** The apex's place in the window as fractions of each range. */
    apex: [number, number];
  }

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
    window: IWindow,
    base: Base,
  ): IAutoMovieHumanRelief {
    const n: number = COUNT;
    const span: number = window.phases[1] - window.phases[0];
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
        const s: number = window.stations[0] + ((i - 1) / (n - 3)) * (window.stations[1] - window.stations[0]);
        const t: number = window.phases[0] + ((j - 1) / (n - 3)) * span;
        const [u, v]: [number, number, number] = AutoMovieHumanTrunkFeatureFrame.local(feature.frame, base(s, t));
        heights.push(feature.height(u, v));
      }
    const relief: IAutoMovieHumanRelief = {
      name,
      stations: window.stations,
      phases: window.phases,
      axis: feature.frame.axis,
      rows: n,
      columns: n,
      heights,
    };

    // Scale the net so the evaluated relief reaches the feature's height at the apex.
    const reached: number = AutoMovieHumanRelief.height(
      relief,
      window.stations[0] + window.apex[0] * (window.stations[1] - window.stations[0]),
      window.phases[0] + window.apex[1] * span,
    )[0];
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
  export function mirror(relief: IAutoMovieHumanRelief, name: string): IAutoMovieHumanRelief {
    const n: number = relief.columns;
    const heights: number[] = [];

    for (let i: number = 0; i < relief.rows; i++)
      for (let j: number = 0; j < n; j++) heights.push(relief.heights[i * n + (n - 1 - j)]!);

    return {
      ...relief,
      name,
      phases: [2 * Math.PI - relief.phases[1], 2 * Math.PI - relief.phases[0]],
      axis: [relief.axis[0], relief.axis[1], -relief.axis[2]],
      heights,
    };
  }
}
