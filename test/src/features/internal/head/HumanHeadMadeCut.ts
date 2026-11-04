import { AutoMovieHumanHeadSection } from "../../../../../packages/human/src/generation/AutoMovieHumanHeadSection";
import type { IAutoMovieHumanHeadLayout } from "../../../../../packages/human/src/generation/IAutoMovieHumanHeadLayout";
import type { IAutoMovieHumanHeadSides } from "../../../../../packages/human/src/generation/IAutoMovieHumanHeadSides";
import type { HumanAnatomy } from "../HumanAnatomy";
import type { HumanHeadPiece } from "./HumanHeadPiece";
import type { HumanHeadSurfaceRows } from "./HumanHeadSurfaceRows";

type V3 = HumanAnatomy.V3;

/**
 * Made shapes for the red and green proofs of the head's surface rows, built
 * in memory on one person's landmarks: a correct shape every row must pass,
 * the smooth ellipsoid of the person's head length, breadth and height, and
 * defects of known size laid on it, each of which its row must fail.
 *
 * The ellipsoid is convex with its least radius of curvature `b^2 / a` (about
 * 50 mm for a head), whose sagitta over a 10 mm chord is 0.25 mm, so it
 * passes every crease limit; its median profile is one convex run.
 */
export namespace HumanHeadMadeCut {
  /** A point's change: the point, its station and its side's sign. */
  export type Change = (p: V3, station: number, sign: 1 | -1) => V3;

  /**
   * The ellipsoid head of a person: centred on the eye level's mid-depth
   * section, half the head length forward and back, half the head breadth
   * across, reaching from under the neck ring to the vertex.
   */
  export function ellipsoid(piece: HumanHeadPiece.IPiece): HumanHeadSurfaceRows.Cut {
    const plan: IAutoMovieHumanHeadLayout = piece.built.plan;
    const k: number = piece.scale;
    const g: V3 = piece.landmarks.glabella;
    const a: number = plan.length / 2;
    const b: number = plan.breadth / 2;
    const yc: number = (plan.vertex + plan.y0) / 2;
    const c: number = (plan.vertex - plan.y0) / 2 + 10 * k;
    const ox: number = g[0] - a;
    const n: number = AutoMovieHumanHeadSection.ANGLES;
    return (s: number): IAutoMovieHumanHeadSides => {
      const f: number = Math.sqrt(Math.max(0, 1 - ((s - yc) / c) ** 2));
      const side: (sign: 1 | -1) => V3[] = (sign: 1 | -1): V3[] =>
        Array.from({ length: n + 1 }, (_: unknown, j: number): V3 => {
          const theta: number = (Math.PI * j) / n;
          return [ox + a * f * Math.cos(theta), s, sign * b * f * Math.sin(theta)];
        });
      return { left: side(1), right: side(-1) };
    };
  }

  /** A cut with every point changed. */
  export function deform(cut: HumanHeadSurfaceRows.Cut, change: Change): HumanHeadSurfaceRows.Cut {
    return (s: number): IAutoMovieHumanHeadSides => {
      const c: IAutoMovieHumanHeadSides = cut(s);
      return {
        left: c.left.map((p: V3): V3 => change(p, s, 1)),
        right: c.right.map((p: V3): V3 => change(p, s, -1)),
      };
    };
  }

  /**
   * A cliff across the temple: every point between the ear and the eye
   * widened 6 percent over 3 mm of height at the exocanthion's level, about
   * 4 mm of half width, the eye-to-ear groove's form.
   */
  export function cliff(piece: HumanHeadPiece.IPiece): Change {
    const k: number = piece.scale;
    return (p: V3, s: number, sign: 1 | -1): V3 => {
      const ex: V3 = piece.landmarks.exocanthion[sign > 0 ? "left" : "right"];
      const ob: V3 = piece.landmarks.otobasion[sign > 0 ? "left" : "right"].superius;
      if (p[0] > ex[0] || p[0] < ob[0]) return p;
      return [p[0], p[1], p[2] * (1 + 0.06 * step((s - ex[1]) / (1.5 * k)))];
    };
  }

  /**
   * A shelf on the forehead: the front half pushed out 2 mm between 15 and
   * 25 mm over the glabella, with 1 mm edges, a plateau's two creases.
   */
  export function shelf(piece: HumanHeadPiece.IPiece, ox: number): Change {
    const k: number = piece.scale;
    const g: number = piece.landmarks.glabella[1];
    return (p: V3, s: number): V3 => {
      if (p[0] <= ox) return p;
      const w: number = step((s - g - 15 * k) / k) - step((s - g - 25 * k) / k);
      return [p[0] + 2 * k * w, p[1], p[2]];
    };
  }

  /** A step across the chin: every point beyond 15 mm of half width pushed out 1.5 mm over 1.4 mm. */
  export function jawStep(piece: HumanHeadPiece.IPiece): Change {
    const k: number = piece.scale;
    return (p: V3): V3 => [p[0], p[1], p[2] + Math.sign(p[2]) * 1.5 * k * step((Math.abs(p[2]) - 15 * k) / (0.7 * k))];
  }

  /** Waves under the chin: the front moved 1.2 mm in a sine of 20 mm wavelength below the menton. */
  export function waves(piece: HumanHeadPiece.IPiece): Change {
    const k: number = piece.scale;
    const plan: IAutoMovieHumanHeadLayout = piece.built.plan;
    return (p: V3, s: number): V3 => (s > plan.menton ? p : [p[0] + 1.2 * k * Math.sin((2 * Math.PI * (s - plan.y0)) / (20 * k)), p[1], p[2]]);
  }

  /** A smooth unit step, 0 far below zero and 1 far above. */
  function step(t: number): number {
    return 0.5 * (1 + Math.tanh(t));
  }
}
