import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanVariationDraw } from "../compose/AutoMovieMotionHumanVariationDraw";
import { HumanBound } from "../law/HumanBound";
import type { IHumanActionContext } from "../law/IHumanActionContext";

/**
 * Where on a region a touch lands (#3357): a region is a patch of skin, not
 * one point, so a touch names a place on it. The place is stated by the
 * author, drawn by the seed, or chosen by a rule.
 *
 * A place is an offset in the region's own surface: `up` along the surface
 * toward the head (the world's up laid into the surface) and `out` to the
 * right of someone facing the surface. On a level surface, where the world's
 * up has no direction in it, `up` is the world's forward.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a site is, its three forms and the two directions an offset is read in.
 * @evidence contracts/development/design.md#principled-representation An offset in the tangent plane of the region's frame, which every region has, so one record serves a person's region, the performer's own and a point.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The site record and the function that fixes it for a plan; read by the touch law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No region is named and no body is special-cased; a negative radius is refused.
 */
export namespace touchSite {
  /**
   * A site on a region: an offset stated in metres, a place drawn by the
   * seed within a radius, or the place within a radius the rule chooses.
   * `reach` is the place nearest the touching arm's shoulder, the shortest
   * reach (#3357's reach rule).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three forms, the unit and what the one rule chooses.
   * @evidence contracts/development/design.md#principled-representation The three ways a site is chosen as one closed union: fixed, drawn, ruled.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three forms, each read by `of`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The radius is the author's, in metres, because a region's frame carries no extent to read one from.
   */
  export type ISite =
    | {
        /** Along the surface toward the head, metres; 0 when absent. */
        up?: number;

        /** To the right of someone facing the surface, metres; 0 when absent. */
        out?: number;
      }
    | {
        /** The radius the seed draws the place within, metres, uniform over the disc. */
        draw: number;
      }
    | {
        /** The rule. */
        rule: "reach";

        /** The radius the rule chooses within, metres. */
        within: number;
      };

  /** A region's point and outward unit normal. */
  export type IFrame = Pick<
    AutoMovieMotionHumanTarget.IPlace,
    "point" | "normal"
  >;

  /**
   * Fix a site for one plan.
   *
   * @param context The action's context, whose `site` series a drawn place is read from.
   * @param site The site.
   * @returns A function that moves a region's frame to the site, given the touching arm's shoulder in the world; the normal is kept.
   * @throws {HumanRefusal} When a radius is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, what the returned function takes and keeps, and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The draw is taken once, at plan time, so the place is one place through the touch; the offset is laid in the tangent plane the normal defines, and the reach rule is the shoulder's foot in that plane brought inside the radius.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One draw, one basis, one branch per form.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is clamped silently: the rule's radius is the stated bound, and a negative radius throws.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the variation owner's uniform draws.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per frame.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The returned function closes over two drawn numbers.
   */
  export function of(
    context: Pick<IHumanActionContext, "series">,
    site: ISite,
  ): (frame: IFrame, shoulder: IAutoMovieVector3) => IFrame {
    if ("draw" in site) HumanBound.least("site.draw", site.draw, 0, "m");
    if ("rule" in site) HumanBound.least("site.within", site.within, 0, "m");
    const drawn: [number, number] =
      "draw" in site
        ? (AutoMovieMotionHumanVariationDraw.uniforms(
            context.series("site"),
            2,
          ) as [number, number])
        : [0, 0];
    return (frame: IFrame, shoulder: IAutoMovieVector3): IFrame => {
      const n: IAutoMovieVector3 = frame.normal;
      const lay = (v: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.subtract(v, Vector3.scale(n, Vector3.dot(v, n)));
      const raised: IAutoMovieVector3 = lay({ x: 0, y: 1, z: 0 });
      const up: IAutoMovieVector3 = Vector3.normalize(
        Vector3.length(raised) > 1e-6 ? raised : lay({ x: 0, y: 0, z: 1 }),
      );
      const out: IAutoMovieVector3 = Vector3.cross(up, n);
      let offset: IAutoMovieVector3;
      if ("draw" in site) {
        const radius: number = site.draw * Math.sqrt(drawn[0]);
        const angle: number = 2 * Math.PI * drawn[1];
        offset = Vector3.add(
          Vector3.scale(up, radius * Math.cos(angle)),
          Vector3.scale(out, radius * Math.sin(angle)),
        );
      } else if ("rule" in site) {
        const toward: IAutoMovieVector3 = lay(
          Vector3.subtract(shoulder, frame.point),
        );
        const length: number = Vector3.length(toward);
        offset = Vector3.scale(
          toward,
          length > site.within ? site.within / length : 1,
        );
      } else
        offset = Vector3.add(
          Vector3.scale(up, site.up ?? 0),
          Vector3.scale(out, site.out ?? 0),
        );
      return { point: Vector3.add(frame.point, offset), normal: n };
    };
  }
}
