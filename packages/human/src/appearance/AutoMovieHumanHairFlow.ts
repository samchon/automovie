import { AutoMovieHumanHairStyle } from "../typings/AutoMovieHumanHairStyle";
import { AutoMovieHumanHairCrown } from "./AutoMovieHumanHairCrown";
import { AutoMovieHumanHairFlowBobFall } from "./AutoMovieHumanHairFlowBobFall";
import { AutoMovieHumanHairFlowBobSweep } from "./AutoMovieHumanHairFlowBobSweep";
import { AutoMovieHumanHairFlowShortRest } from "./AutoMovieHumanHairFlowShortRest";
import { AutoMovieHumanHairFlowShortTop } from "./AutoMovieHumanHairFlowShortTop";
import { AutoMovieHumanHairFlowWeights } from "./AutoMovieHumanHairFlowWeights";
import { AutoMovieHumanHairParting } from "./AutoMovieHumanHairParting";
import { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * The direction field of each haircut over the head chart's unit sphere: the
 * way a root's hair is combed, before gravity bends it, assembled from the
 * style's own pieces.
 *
 * `crop` points away from the crown's whorl (`AutoMovieHumanHairCrown`);
 * `short` blends its combed top (`AutoMovieHumanHairFlowShortTop`) with its
 * falling rest (`AutoMovieHumanHairFlowShortRest`) by the larger of the top
 * and front weights; `bob` blends its sweep (`AutoMovieHumanHairFlowBobSweep`)
 * with its fall (`AutoMovieHumanHairFlowBobFall`) by the top weight times
 * the share of the head that is not the back
 * (`AutoMovieHumanHairFlowWeights`). Directions are in the chart's frame
 * (`+X` forward, `+Y` up, `+Z` the person's left); paired sides come from
 * the parting's signed side alone, so a symmetric style's field is
 * mirror-symmetric.
 */
export namespace AutoMovieHumanHairFlow {
  /** Downward unit vector. */
  export const DOWN: AutoMovieHumanSkinVector.Vec3 = [0, -1, 0];

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
    const upper: number = AutoMovieHumanHairFlowWeights.upper(u);
    const side: number = AutoMovieHumanHairParting.side(style, u);
    const front: number = AutoMovieHumanHairFlowWeights.front(u);
    if (style === AutoMovieHumanHairStyle.Short) {
      // The front of the head, temples included, is combed back like the top
      // rather than down over the forehead.
      const w: number = Math.max(upper, front);
      return AutoMovieHumanSkinVector.add(
        AutoMovieHumanSkinVector.scale(
          AutoMovieHumanHairFlowShortTop.direction(side),
          w,
        ),
        AutoMovieHumanSkinVector.scale(
          AutoMovieHumanHairFlowShortRest.direction(),
          1 - w,
        ),
      );
    }

    // Bob: the sweep over the top and front, the fall behind.
    const mix: number = upper * (1 - AutoMovieHumanHairFlowWeights.back(u));
    return AutoMovieHumanSkinVector.add(
      AutoMovieHumanSkinVector.scale(
        AutoMovieHumanHairFlowBobSweep.direction(front, side),
        mix,
      ),
      AutoMovieHumanSkinVector.scale(
        AutoMovieHumanHairFlowBobFall.direction(),
        1 - mix,
      ),
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
