import { AutoMovieEngineNaturalSpline } from "@automovie/engine";
import type {
  IAutoMovieHumanLegProfile,
  IAutoMovieHumanLegStations,
  IAutoMovieNaturalCubicSpline,
} from "@automovie/interface";

import { AutoMovieHumanLegStations } from "./AutoMovieHumanLegStations";

/**
 * A landmark table carried along the leg: rows at landmark stations (shares of
 * the thigh or the shank), and a channel of them read at any station as the
 * natural cubic spline (C2) through the rows, held at the end rows' values past
 * them.
 *
 * A neighbour's ring is a row too: the foot's ankle ring at the leg's first
 * station and the trunk's crotch ring at its last, each read off the ring at
 * its own station (an {@link IEnd}). A ring is the leg's own surface there, so
 * the table rows past it are dropped, and so is a row nearer to it than half
 * the pitch to that row's other neighbour: two rows that close cannot both be
 * met by one C2 curve without a wave between them, and the ring is the one that
 * binds. Every guide, sector and the girth law read the rings this way, so the
 * leg leaves each ring with the ring's own shape and the spans to the first
 * landmark rows carry the difference.
 *
 * Every guide's profile and every sector's fullness is one such channel, so a
 * piece file holds only its rows and what they mean; this module holds the one
 * rule that carries them.
 */
export namespace AutoMovieHumanLegProfile {
  /**
   * Knots with the end rings put in: knots on or past a ring dropped, a knot
   * nearer to a ring than half its pitch to its other neighbour dropped, the
   * ring added.
   *
   * @param knots The table's knots, increasing in station.
   * @param bottom The ring under the knots, or undefined.
   * @param top The ring above the knots, or undefined.
   * @returns Strictly increasing knots.
   */
  export function joined(
    knots: readonly IAutoMovieHumanLegProfile.IKnot[],
    bottom: IAutoMovieHumanLegProfile.IKnot | undefined,
    top: IAutoMovieHumanLegProfile.IKnot | undefined,
  ): IAutoMovieHumanLegProfile.IKnot[] {
    let out: IAutoMovieHumanLegProfile.IKnot[] = [...knots];
    if (bottom !== undefined) {
      out = out.filter(
        (k: IAutoMovieHumanLegProfile.IKnot): boolean => k.at > bottom.at,
      );
      while (
        out.length >= 2 &&
        out[0]!.at - bottom.at < (out[1]!.at - out[0]!.at) / 2
      )
        out.shift();
      out.unshift(bottom);
    }
    if (top !== undefined) {
      out = out.filter(
        (k: IAutoMovieHumanLegProfile.IKnot): boolean => k.at < top.at,
      );
      while (
        out.length >= 2 &&
        top.at - out[out.length - 1]!.at <
          (out[out.length - 1]!.at - out[out.length - 2]!.at) / 2
      )
        out.pop();
      out.push(top);
    }
    return out;
  }

  /**
   * One channel of a table as a function of the station.
   *
   * @param rows The table's rows; a thigh row and a shank row may be mixed.
   * @param bones The joints' heights, which place the rows.
   * @param k Index of the channel in each row's values.
   * @param ends The rings the table ends on.
   * @returns The natural spline through the rows by station, held past the end
   *   rows.
   * @throws {Error} When two rows stand at one height or a row lacks the
   *   channel.
   */
  export function channel(
    rows: readonly IAutoMovieHumanLegProfile.IRow[],
    bones: IAutoMovieHumanLegStations.IBones,
    k: number,
    ends: IAutoMovieHumanLegProfile.IEnds = {},
  ): IAutoMovieHumanLegProfile.Channel {
    const sorted: IAutoMovieHumanLegProfile.IKnot[] = rows
      .map(
        (
          r: IAutoMovieHumanLegProfile.IRow,
        ): IAutoMovieHumanLegProfile.IKnot => ({
          at: AutoMovieHumanLegStations.heightAt(bones, r.segment, r.share),
          value: r.values[k]!,
        }),
      )
      .sort(
        (
          a: IAutoMovieHumanLegProfile.IKnot,
          b: IAutoMovieHumanLegProfile.IKnot,
        ): number => a.at - b.at,
      );
    function end(
      e: IAutoMovieHumanLegProfile.IEnd | undefined,
    ): IAutoMovieHumanLegProfile.IKnot | undefined {
      return e === undefined ? undefined : { at: e.at, value: e.values[k]! };
    }
    const placed: IAutoMovieHumanLegProfile.IKnot[] = joined(
      sorted,
      end(ends.bottom),
      end(ends.top),
    );
    for (let i: number = 0; i < placed.length; i++) {
      if (!Number.isFinite(placed[i]!.value))
        throw new Error(`A landmark row lacks channel ${k}`);
      if (i > 0 && !(placed[i]!.at > placed[i - 1]!.at))
        throw new Error("Two landmark rows stand at one height");
    }
    const spline: IAutoMovieNaturalCubicSpline = AutoMovieEngineNaturalSpline.create(
      placed.map((p: IAutoMovieHumanLegProfile.IKnot): number => p.at),
      placed.map((p: IAutoMovieHumanLegProfile.IKnot): number => p.value),
    );
    const low: number = placed[0]!.at;
    const high: number = placed[placed.length - 1]!.at;
    return (s: number): number =>
      AutoMovieEngineNaturalSpline.evaluate(spline, Math.min(high, Math.max(low, s)));
  }

  /**
   * The span a ring's difference from the table is carried over: from the ring
   * to the first table row kept beside it.
   *
   * @param rows The table's rows.
   * @param bones The joints' heights.
   * @param at Station of the ring, mm.
   * @param side `bottom` for a ring under the rows, `top` for one above.
   * @returns Distance from the ring to its nearest kept row, mm.
   */
  export function reach(
    rows: readonly IAutoMovieHumanLegProfile.IRow[],
    bones: IAutoMovieHumanLegStations.IBones,
    at: number,
    side: "bottom" | "top",
  ): number {
    const sorted: IAutoMovieHumanLegProfile.IKnot[] = rows
      .map(
        (
          r: IAutoMovieHumanLegProfile.IRow,
        ): IAutoMovieHumanLegProfile.IKnot => ({
          at: AutoMovieHumanLegStations.heightAt(bones, r.segment, r.share),
          value: 0,
        }),
      )
      .sort(
        (
          a: IAutoMovieHumanLegProfile.IKnot,
          b: IAutoMovieHumanLegProfile.IKnot,
        ): number => a.at - b.at,
      );
    const ring: IAutoMovieHumanLegProfile.IKnot = { at, value: 0 };
    const placed: IAutoMovieHumanLegProfile.IKnot[] =
      side === "bottom"
        ? joined(sorted, ring, undefined)
        : joined(sorted, undefined, ring);
    return side === "bottom"
      ? placed[1]!.at - at
      : at - placed[placed.length - 2]!.at;
  }
}
