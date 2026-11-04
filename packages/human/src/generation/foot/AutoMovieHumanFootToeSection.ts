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
  export function of(w: number, hd: number, hp: number, count: number): G.Vec2[] {
    const D: G.Vec2 = [0, hd];
    const R: G.Vec2 = [w, 0];
    const P: G.Vec2 = [0, -hp];
    const Lm: G.Vec2 = [-w, 0];
    const jet = (p: G.Vec2, t: G.Vec2, n: G.Vec2[]): AutoMovieHumanFootArc.IJet => ({
      point: p,
      tangent: t,
      curvature: AutoMovieHumanFootJunction.curvature(p, t, n),
    });
    const jD: AutoMovieHumanFootArc.IJet = jet(D, [1, 0], [R, Lm]);
    const jR: AutoMovieHumanFootArc.IJet = jet(R, [0, -1], [D, P]);
    const jP: AutoMovieHumanFootArc.IJet = jet(P, [-1, 0], [R, Lm]);
    const jL: AutoMovieHumanFootArc.IJet = jet(Lm, [0, 1], [P, D]);
    const sectors: AutoMovieHumanFootSectors.ISectors = AutoMovieHumanFootSectors.join(
      AutoMovieHumanFootArc.pieces(AutoMovieHumanFootArc.TOE, { dorsal: jD, lateral: jR, plantar: jP, medial: jL }, POINTS).map(AutoMovieHumanFootSectors.piece),
      [count / 4, count / 4, count / 4, count / 4],
    );

    return Array.from({ length: count }, (_: unknown, m: number): G.Vec2 => sectors.at((G.TWO_PI * m) / count));
  }
}

/** Points of each piece before resampling. */
const POINTS: number = 64;
