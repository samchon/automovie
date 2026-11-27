import { AutoMovieLoftRelief } from "@automovie/engine";
import type {
  IAutoMovieHumanLegReliefWindow,
  IAutoMovieLoftRelief,
} from "@automovie/interface";

import { AutoMovieHumanLegStations } from "./AutoMovieHumanLegStations";

/**
 * The shared mathematics of the leg's relief windows: a named bump or hollow
 * in its own frame, with its own centre station and section angle, its own
 * extents and its own displacement axis, and a control net whose three outer
 * rings are zero, so its height, slope and curvature vanish at the window's
 * edge (rule J7) and it is C2 with the base wherever it stands.
 *
 * A window is declared in shares of the local radius (the section's girth over
 * 2 pi at its centre), so one declaration serves every person. The section
 * frame of the canonical left leg has `x` forward, `y` along the bone toward
 * the hip and `z` lateral; an axis is a unit direction in it, along which a
 * positive height moves the skin (a hollow is a positive height along the axis
 * that points into the leg).
 */
export namespace AutoMovieHumanLegReliefWindow {
  /** Controls across each direction of a window. */
  export const COUNT: number = 15;

  /**
   * A one-sided bump on [0, 1]: zero with zero slope at both ends, one at
   * `apex` with zero slope there, `(1 - r^2)^2` of the distance r from the
   * apex in each side's own length.
   */
  export function bump(u: number, apex: number): number {
    const r: number = u < apex ? (apex - u) / apex : (u - apex) / (1 - apex);
    return r >= 1 ? 0 : (1 - r * r) ** 2;
  }

  /**
   * The relief of a window on one leg.
   *
   * @param window The window's declaration.
   * @param input The joints and the local radius.
   * @returns The relief on the chart (station in mm, phase in radians) with its net scaled so the evaluated height at the centre is `height` radii.
   */
  export function create(
    window: IAutoMovieHumanLegReliefWindow.IWindow,
    input: IAutoMovieHumanLegReliefWindow.IInput,
  ): IAutoMovieLoftRelief {
    if (!(input.radius > 0))
      throw new Error(
        `The ${window.name} window needs a positive local radius`,
      );
    const n: number = COUNT;
    const centre: number =
      input.at ??
      AutoMovieHumanLegStations.heightAt(
        input.bones,
        window.segment,
        window.share,
      );
    const half: number = window.halfStation * input.radius;
    const stations: IAutoMovieLoftRelief.IRange = {
      start: centre - half,
      end: centre + half,
    };
    const first: number = wrap(window.angle - window.halfAngle);
    const phases: IAutoMovieLoftRelief.IRange = {
      start: first,
      end: first + 2 * window.halfAngle,
    };

    // Control k peaks at the window fraction (k - 1) / (n - 3), so the inner
    // controls sample the separable profile there; the outer three rings stay zero.
    const heights: number[] = [];
    for (let i: number = 0; i < n; i++)
      for (let j: number = 0; j < n; j++) {
        const inner: boolean = i >= 3 && i <= n - 4 && j >= 3 && j <= n - 4;
        heights.push(
          inner
            ? bump((i - 1) / (n - 3), 0.5) * bump((j - 1) / (n - 3), 0.5)
            : 0,
        );
      }
    const unit: IAutoMovieLoftRelief = {
      name: window.name,
      stations,
      phases,
      axis: window.axis,
      rows: n,
      columns: n,
      heights,
    };

    // Scale the net so the evaluated height at the centre is the declared one.
    const reached: number = AutoMovieLoftRelief.height(
      unit,
      centre,
      first + window.halfAngle,
    )[0];
    const gain: number =
      reached > 0 ? (window.height * input.radius) / reached : 0;
    return { ...unit, heights: heights.map((h: number): number => h * gain) };
  }
}

/*
 * Angle reduced to `[0, 2 pi)`.
 */
function wrap(t: number): number {
  const r: number = t % (2 * Math.PI);
  return r < 0 ? r + 2 * Math.PI : r;
}
