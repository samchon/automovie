import type { AutoMovieHumanFootArc } from "./AutoMovieHumanFootArc";
import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import { AutoMovieHumanFootJunction } from "./AutoMovieHumanFootJunction";
import { AutoMovieHumanFootSectors } from "./AutoMovieHumanFootSectors";
import { AutoMovieHumanFootToeDorsalHalf } from "./AutoMovieHumanFootToeDorsalHalf";
import { AutoMovieHumanFootToePlantarHalf } from "./AutoMovieHumanFootToePlantarHalf";

/**
 * A toe's section in its own plane, composed of its two halves on one breadth:
 * the dorsal half ({@link AutoMovieHumanFootToeDorsalHalf}) and the plantar half
 * ({@link AutoMovieHumanFootToePlantarHalf}), four quintic pieces between the
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
    const dorsal: AutoMovieHumanFootToeDorsalHalf.IHalf = AutoMovieHumanFootToeDorsalHalf.of(jD, jR, jL, POINTS);
    const plantar: AutoMovieHumanFootToePlantarHalf.IHalf = AutoMovieHumanFootToePlantarHalf.of(jR, jP, jL, POINTS);
    const sectors: AutoMovieHumanFootSectors.ISectors = AutoMovieHumanFootSectors.join(
      [dorsal.lateral, plantar.lateral, plantar.medial, dorsal.medial].map(AutoMovieHumanFootSectors.piece),
      [count / 4, count / 4, count / 4, count / 4],
    );

    return Array.from({ length: count }, (_: unknown, m: number): G.Vec2 => sectors.at((G.TWO_PI * m) / count));
  }
}

/** Points of each piece before resampling. */
const POINTS: number = 64;
