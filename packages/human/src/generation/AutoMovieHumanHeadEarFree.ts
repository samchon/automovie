import { AutoMovieHumanEarConstruction } from "./AutoMovieHumanEarConstruction";
import { AutoMovieHumanHeadEarRoots } from "./AutoMovieHumanHeadEarRoots";
import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import { AutoMovieHumanHeadSkin } from "./AutoMovieHumanHeadSkin";
import type { IAutoMovieHumanHeadEarSampler } from "./IAutoMovieHumanHeadEarSampler";
import type { IAutoMovieHumanHeadRoots } from "./IAutoMovieHumanHeadRoots";
import type { IAutoMovieHumanHeadSurface } from "./IAutoMovieHumanHeadSurface";

/**
 * The auricle's free loops: the loop the ear's path makes at a height when the
 * ear stands off the head by a share of its roots, and the profiles the
 * auricle's pieces share along its height (how far the ear has risen off the
 * head, how far the lobe has drawn in, how much of the anterior relief is
 * left, and the pocket under the helix's roll). One sampler per ear is the
 * pieces' only reach into the head's skin, so a piece is built from it alone.
 */
export namespace AutoMovieHumanHeadEarFree {
  /**
   * The sampler of one ear on one side of the head.
   *
   * @param surface The person's surface, cut once by station.
   * @param ear The ear placed on the head.
   * @param name The side's name.
   * @param sign 1 for the left side, -1 for the right.
   * @returns The ear's fixed input for its pieces.
   */
  export function sampler(
    surface: IAutoMovieHumanHeadSurface,
    ear: AutoMovieHumanEarConstruction.IEar,
    name: "left" | "right",
    sign: 1 | -1,
  ): IAutoMovieHumanHeadEarSampler {
    const side = (y: number): [number, number, number][] =>
      AutoMovieHumanHeadSkin.sides(surface, y)[name];

    /** A free loop at a height: the path closed, off the head by `f`. */
    const free = (y: number, f: number, folds: number): AutoMovieHumanEarConstruction.P2[] => {
      const r: IAutoMovieHumanHeadRoots = AutoMovieHumanHeadEarRoots.roots(ear, side(y), sign, y);
      const half: number = AutoMovieHumanEarConstruction.chord(ear, y);
      const mid: AutoMovieHumanEarConstruction.P2 = AutoMovieHumanHeadMath.mix(r.tip, r.rim, 0.5);
      const under: AutoMovieHumanEarConstruction.P2 = [
        mid[0] - ear.normal[0] * 0.5 * half,
        mid[1] - ear.normal[1] * 0.5 * half,
      ];
      const path: AutoMovieHumanEarConstruction.P2[] = AutoMovieHumanEarConstruction.path(
        ear,
        y,
        {
          front: AutoMovieHumanHeadMath.mix(r.front[1], r.tip, f),
          frontTangent: [(1 - f) * r.front[2][0], (1 - f) * r.front[2][1]],
          back: AutoMovieHumanHeadMath.mix(r.back[1], under, f),
          backTangent: [-(1 - f) * r.back[2][0], -(1 - f) * r.back[2][1]],
        },
        r.rim,
        folds,
      );
      return AutoMovieHumanEarConstruction.loop(ear, path, LOOP, 1 - f);
    };
    const span: number = ear.top - ear.upper;
    const rise = (y: number): number => AutoMovieHumanHeadMath.smooth((y - ear.upper) / span);
    const sink = (y: number): number =>
      AutoMovieHumanHeadMath.smooth((ear.lower - y) / (ear.lower - ear.bottom));
    const fold = (y: number): number =>
      1 - AutoMovieHumanHeadMath.smooth((y - ear.split) / (ear.top - ear.split));

    // The pocket opens in the anterior face at the pit and closes under the
    // rim: an oval along the skin it hangs from, shrinking toward the roof.
    const pit: number = Math.floor(LOOP * PIT);
    const pocketOval = (y: number): AutoMovieHumanEarConstruction.P2[] => {
      const l: AutoMovieHumanEarConstruction.P2[] = free(ear.split, rise(ear.split), 1);
      const c: AutoMovieHumanEarConstruction.P2 = l[pit]!;
      const size: number =
        1 - 0.92 * AutoMovieHumanHeadMath.smooth((y - ear.split) / (ear.roof - ear.split));
      const half: number = AutoMovieHumanEarConstruction.chord(ear, ear.split);
      const a: number = 0.24 * half * size;
      const b: number = 0.1 * half * size;
      const t: AutoMovieHumanEarConstruction.P2 = AutoMovieHumanEarConstruction.tangent(l, pit);
      const n: AutoMovieHumanEarConstruction.P2 = [t[1], -t[0]];
      const inset: number = b + 0.3 * half * (1 - size);
      return AutoMovieHumanEarConstruction.oval(
        [c[0] - n[0] * inset, c[1] - n[1] * inset],
        t,
        a,
        b,
        POCKET,
        -1,
        -Math.PI / 2,
      );
    };
    return { free, rise, sink, fold, pocketOval, ear };
  }

  /** Points of an ear's free loop: the density that carries the helix's roll and the concha's bowl. */
  export const LOOP: number = 200;

  /** Where along an ear's free loop the pit opens, as a share of the loop. */
  export const PIT: number = 0.28;

  /** Share of the helix chain over which the pit deepens, from its top. */
  export const PIT_FROM: number = 0.6;

  /** Points of the pocket's loop. */
  export const POCKET: number = 60;
}
