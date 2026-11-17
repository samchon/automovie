import type {
  AutoMovieVector2Tuple,
  IAutoMovieHumanFootArc,
  IAutoMovieHumanFootSectors,
} from "@automovie/interface";

import { AutoMovieHumanFootArc } from "./AutoMovieHumanFootArc";
import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import { AutoMovieHumanFootJunction } from "./AutoMovieHumanFootJunction";
import { AutoMovieHumanFootSectors } from "./AutoMovieHumanFootSectors";

/**
 * A toe's section in its own plane, composed of its two halves on one breadth:
 * the nail side and the pad side, four quintic pieces ({@link AutoMovieHumanFootArc.TOE}) between the
 * dorsal, lateral, plantar and medial points, each point's jet owning its
 * curvature from its neighbours, so the halves meet G2 at the side points, the
 * section's tightest turn. Each piece owns a quarter of the phases, from the
 * dorsal point toward the lateral side.
 */
export namespace AutoMovieHumanFootToeSection {
  /** `[across, up]` points of a section of half breadth `w` and half depths `hd` up and `hp` down. */
  export function of(
    w: number,
    hd: number,
    hp: number,
    count: number,
  ): AutoMovieVector2Tuple[] {
    const D: AutoMovieVector2Tuple = [0, hd];
    const R: AutoMovieVector2Tuple = [w, 0];
    const P: AutoMovieVector2Tuple = [0, -hp];
    const Lm: AutoMovieVector2Tuple = [-w, 0];
    const jet = (
      p: AutoMovieVector2Tuple,
      t: AutoMovieVector2Tuple,
      n: AutoMovieVector2Tuple[],
    ): IAutoMovieHumanFootArc.IJet => ({
      point: p,
      tangent: t,
      curvature: AutoMovieHumanFootJunction.curvature(p, t, n),
    });
    const jD: IAutoMovieHumanFootArc.IJet = jet(D, [1, 0], [R, Lm]);
    const jR: IAutoMovieHumanFootArc.IJet = jet(R, [0, -1], [D, P]);
    const jP: IAutoMovieHumanFootArc.IJet = jet(P, [-1, 0], [R, Lm]);
    const jL: IAutoMovieHumanFootArc.IJet = jet(Lm, [0, 1], [P, D]);
    const sectors: IAutoMovieHumanFootSectors.ISectors =
      AutoMovieHumanFootSectors.join(
        AutoMovieHumanFootArc.pieces(
          AutoMovieHumanFootArc.TOE,
          { dorsal: jD, lateral: jR, plantar: jP, medial: jL },
          POINTS,
        ).map(AutoMovieHumanFootSectors.piece),
        [count / 4, count / 4, count / 4, count / 4],
      );

    return Array.from(
      { length: count },
      (_: unknown, m: number): AutoMovieVector2Tuple =>
        sectors.at((G.TWO_PI * m) / count),
    );
  }
}

/** Points of each piece before resampling. */
const POINTS: number = 64;
