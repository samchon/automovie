import { AutoMovieHumanHairStyle } from "../typings/AutoMovieHumanHairStyle";
import { AutoMovieHumanHairCrown } from "./AutoMovieHumanHairCrown";
import { AutoMovieHumanHairFlowBobSweep } from "./AutoMovieHumanHairFlowBobSweep";
import { AutoMovieHumanHairFlowWeights } from "./AutoMovieHumanHairFlowWeights";
import { AutoMovieHumanHairParting } from "./AutoMovieHumanHairParting";
import { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * The direction field of each haircut over the head chart's unit sphere: the
 * way a root's hair is combed, before gravity bends it, assembled from the
 * style's own pieces.
 *
 * `crop` points away from the crown's whorl (`AutoMovieHumanHairCrown`);
 * `short` blends its combed top with its combed rest by the larger of the top
 * and front weights; `bob` blends its comb away from the parting
 * (`AutoMovieHumanHairFlowBobSweep`) with its fall by the share of the head
 * that is not the back (`AutoMovieHumanHairFlowWeights`), since the parting
 * runs from the hairline back to the crown. A top or a rest is the head
 * chart's own axes weighted by the style's comb ({@link COMB}): gravity's
 * `DOWN`, the head's backward axis and, on a combed top, the parting's side
 * axis; the tangent projection at each root ({@link tangent}) lays it on that
 * root's scalp, so the field follows the head's shape. Directions are in the
 * chart's frame (`+X` forward, `+Y` up, `+Z` the person's left); paired sides
 * come from the parting's signed side alone, so a symmetric style's field is
 * mirror-symmetric.
 */
export namespace AutoMovieHumanHairFlow {
  /** Downward unit vector: gravity in the head chart's frame. */
  export const DOWN: AutoMovieHumanSkinVector.Vec3 = [0, -1, 0];

  /** The head chart's backward unit axis. */
  export const BACK: AutoMovieHumanSkinVector.Vec3 = [-1, 0, 0];

  /** The head chart's unit axis toward the person's left. */
  export const LEFT: AutoMovieHumanSkinVector.Vec3 = [0, 0, 1];

  /** A combed style's comb, as weights of the chart's axes. */
  export interface IComb {
    /** Backward share of the rest's fall per unit of gravity. */
    restBack: number;

    /** Share of the top's comb toward the parting's side per unit of backward comb; null when the top falls like the rest. */
    topSide: number | null;
  }

  /**
   * Each combed style's comb (conventions of this prototype):
   *
   * - short: the back and sides combed down and slightly back, `0.4` back per
   *   unit down, tapering to a third of the length at the nape and sides
   *   (`AutoMovieHumanHairStrandBase`); the top and front combed back from the
   *   side parting toward the side the parting's ramp gives
   *   (`AutoMovieHumanHairParting.side`), `0.7` sideways per unit back, the
   *   front of the head, temples included, combed back like the top rather
   *   than down over the forehead.
   * - bob: the back and sides falling straight to the level cut, `0.3` back
   *   per unit down; the top is the comb away from the parting
   *   (`AutoMovieHumanHairFlowBobSweep`).
   */
  export const COMB: Readonly<Record<AutoMovieHumanHairStyle.Short | AutoMovieHumanHairStyle.Bob, IComb>> = {
    [AutoMovieHumanHairStyle.Short]: { restBack: 0.4, topSide: 0.7 },
    [AutoMovieHumanHairStyle.Bob]: { restBack: 0.3, topSide: null },
  };

  /**
   * Unnormalised style direction at a chart direction.
   *
   * @param style Haircut
   * @param u Unit chart direction
   * @returns Preferred growth direction before tangent projection
   */
  export function field(
    style: AutoMovieHumanHairStyle,
    u: AutoMovieHumanSkinVector.Vec3,
  ): AutoMovieHumanSkinVector.Vec3 {
    if (style === AutoMovieHumanHairStyle.Crop)
      return AutoMovieHumanHairCrown.flow(u);

    // Top hair stands in the style's combing; the sides and back fall.
    const comb: IComb = COMB[style];
    const upper: number = AutoMovieHumanHairFlowWeights.upper(u);
    const side: number = AutoMovieHumanHairParting.side(style, u);
    const front: number = AutoMovieHumanHairFlowWeights.front(u);
    const rest: AutoMovieHumanSkinVector.Vec3 = AutoMovieHumanSkinVector.add(DOWN, AutoMovieHumanSkinVector.scale(BACK, comb.restBack));
    if (comb.topSide !== null) {
      // The front of the head, temples included, is combed back like the top
      // rather than down over the forehead.
      const w: number = Math.max(upper, front);
      const top: AutoMovieHumanSkinVector.Vec3 = AutoMovieHumanSkinVector.add(BACK, AutoMovieHumanSkinVector.scale(LEFT, comb.topSide * side));

      return AutoMovieHumanSkinVector.add(AutoMovieHumanSkinVector.scale(top, w), AutoMovieHumanSkinVector.scale(rest, 1 - w));
    }

    // Bob: combed away from the parting in front of the back of the head,
    // falling behind it.
    const mix: number = 1 - AutoMovieHumanHairFlowWeights.back(u);
    return AutoMovieHumanSkinVector.add(
      AutoMovieHumanSkinVector.scale(AutoMovieHumanHairFlowBobSweep.direction(u, side), mix),
      AutoMovieHumanSkinVector.scale(rest, 1 - mix),
    );
  }

  /**
   * Component of a vector tangent to the sphere at a unit direction, unit
   * length; falls back to the downward tangent where the vector is radial.
   *
   * @param v Vector
   * @param n Unit normal
   * @returns Unit tangent
   */
  export function tangent(
    v: AutoMovieHumanSkinVector.Vec3,
    n: AutoMovieHumanSkinVector.Vec3,
  ): AutoMovieHumanSkinVector.Vec3 {
    const t: AutoMovieHumanSkinVector.Vec3 = AutoMovieHumanSkinVector.sub(
      v,
      AutoMovieHumanSkinVector.scale(n, AutoMovieHumanSkinVector.dot(v, n)),
    );
    if (AutoMovieHumanSkinVector.norm(t) > 1e-9)
      return AutoMovieHumanSkinVector.normalize(t);

    // A radial vector has no tangent part: take the downward tangent.
    const d: AutoMovieHumanSkinVector.Vec3 = AutoMovieHumanSkinVector.sub(
      DOWN,
      AutoMovieHumanSkinVector.scale(n, AutoMovieHumanSkinVector.dot(DOWN, n)),
    );
    return AutoMovieHumanSkinVector.norm(d) > 1e-9
      ? AutoMovieHumanSkinVector.normalize(d)
      : [1, 0, 0];
  }
}
