import { AutoMovieHumanHorizontalChain } from "../lofting/AutoMovieHumanHorizontalChain";
import { AutoMovieHumanLoftParameter } from "../lofting/AutoMovieHumanLoftParameter";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanEarConstruction } from "./AutoMovieHumanEarConstruction";
import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import type { IAutoMovieHumanHeadLoopLayer } from "./IAutoMovieHumanHeadLoopLayer";

/**
 * The auricle's closed loops and what is done with them in common: sampling a
 * loop at the uniform phases a chain's rule gives, the declared reflection of
 * a left-frame loop onto a side, and the chain a stack of loops makes. The
 * auricle's pieces (lobe, helix, rim, pocket) each draw their own loops and
 * hand them here, so none of them carries a left or right branch of its own.
 */
export namespace AutoMovieHumanHeadEarLoop {
  /**
   * Uniform phases of a closed loop under a chain's rule.
   *
   * @param rule The chain's phase correspondence rule.
   * @param loop The closed loop's points, `[x, z]` in the left frame.
   * @param order Control points of the chain's section.
   * @param mirrored Whether the chain is the reflected one (z negated for its phases).
   * @returns The ring at `order` uniform phases and the loop's own phases.
   */
  export function phased(
    rule: IAutoMovieHumanLoftChain["rule"],
    loop: readonly P2[],
    order: number,
    mirrored: boolean,
  ): { ring: P2[]; phases: number[] } {
    const t: number[] = AutoMovieHumanLoftParameter.phases(
      rule,
      mirrored ? loop.map((p: P2): P2 => [p[0], -p[1]]) : loop,
    );
    const two: number = 2 * Math.PI;
    const phases: number[] = t.map(
      (v: number): number => ((v % two) + two) % two,
    );
    const sorted: number[] = phases
      .map((_: number, i: number): number => i)
      .sort((a: number, b: number): number => phases[a]! - phases[b]!);
    const ring: P2[] = [];
    let c: number = 0;
    for (let j: number = 0; j < order; j++) {
      const target: number = (two * j) / order;
      while (c < sorted.length && phases[sorted[c]!]! < target) c++;
      const hi: number = sorted[c % sorted.length]!;
      const lo: number = sorted[(c + sorted.length - 1) % sorted.length]!;
      const b: number = phases[hi]! + (c >= sorted.length ? two : 0);
      const a: number = phases[lo]! - (c === 0 ? two : 0);
      const f: number = b - a < 1e-12 ? 0 : (target - a) / (b - a);
      ring.push(AutoMovieHumanHeadMath.mix(loop[lo]!, loop[hi]!, f));
    }
    return { ring, phases };
  }

  /**
   * Reflect a left-frame closed loop onto a side, keeping its sense: the
   * declared reflection of every loop in the head, z to -z with the phase
   * run backward, `t -> -t`, so sample `i` of the reflected loop is sample
   * `(n - i) mod n` of the canonical one and an arc `[a, b]` of phases on the
   * left is `[-b, -a]` on the right.
   *
   * @param loop The loop in the left frame.
   * @param sign 1 for the left side, -1 for the right.
   * @returns The loop on the side.
   */
  export function reflected(loop: readonly P2[], sign: 1 | -1): P2[] {
    const n: number = loop.length;
    return sign > 0
      ? [...loop]
      : loop.map((_: P2, i: number): P2 => {
          const p: P2 = loop[(n - i) % n]!;
          return [p[0], -p[1]];
        });
  }

  /**
   * A closed loop's chain from layers of loops.
   *
   * @param name The chain's name.
   * @param order Control points of its section.
   * @param rule Its phase correspondence rule.
   * @param mirrored Whether it is the reflected chain.
   * @param layers The loops by height, bottom first.
   * @returns The chain.
   */
  export function chainOf(
    name: string,
    order: number,
    rule: IAutoMovieHumanLoftChain["rule"],
    mirrored: boolean,
    layers: readonly IAutoMovieHumanHeadLoopLayer[],
  ): IAutoMovieHumanLoftChain {
    const chain: IAutoMovieHumanLoftChain = AutoMovieHumanHorizontalChain.build(
      { name, order, samples: order, rule },
      layers.map((l: IAutoMovieHumanHeadLoopLayer): Vec3[] =>
        (rule === "arclength"
          ? AutoMovieHumanEarConstruction.even(l.loop, order)
          : phased(rule, l.loop, order, mirrored).ring
        ).map((p: P2): Vec3 => [p[0], l.y, p[1]]),
      ),
    );
    return mirrored ? { ...chain, mirrored: true } : chain;
  }

  /**
   * The same layers on a side: every loop reflected by {@link reflected}.
   *
   * @param list The layers in the left frame.
   * @param sign 1 for the left side, -1 for the right.
   * @returns The layers on the side.
   */
  export function onSide(
    list: readonly IAutoMovieHumanHeadLoopLayer[],
    sign: 1 | -1,
  ): IAutoMovieHumanHeadLoopLayer[] {
    return list.map(
      (l: IAutoMovieHumanHeadLoopLayer): IAutoMovieHumanHeadLoopLayer => ({
        y: l.y,
        loop: reflected(l.loop, sign),
      }),
    );
  }
}

/** A point of a section. */
type P2 = [number, number];

/** A point. */
type Vec3 = [number, number, number];
