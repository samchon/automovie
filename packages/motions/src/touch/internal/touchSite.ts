import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanTouchSite,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanVariationDraw } from "../../compose/internal/AutoMovieMotionHumanVariationDraw";
import { HumanBound } from "../../law/internal/HumanBound";
import { HumanRefusal } from "../../law/HumanRefusal";

/**
 * Fix a site for one plan.
 *
 * @param context The action's context, whose `site` series a drawn place is
 *   read from.
 * @param site The site.
 * @returns A function that moves a region's frame to the site, given the
 *   touching arm's shoulder in the world; the normal is kept.
 * @throws {HumanRefusal} When a radius is negative.
 */
export function touchSite(
  context: Pick<IAutoMovieMotionHumanActionContext, "series">,
  site: IAutoMovieMotionHumanTouchSite.ISite,
): (
  frame: IAutoMovieMotionHumanTouchSite.IFrame,
  shoulder: IAutoMovieVector3,
) => IAutoMovieMotionHumanTouchSite.IFrame {
  if ("draw" in site) HumanBound.least("site.draw", site.draw, 0, "m");
  if ("rule" in site) HumanBound.least("site.within", site.within, 0, "m");
  const drawn: [number, number] =
    "draw" in site
      ? (AutoMovieMotionHumanVariationDraw.uniforms(
          context.series("site"),
          2,
        ) as [number, number])
      : [0, 0];
  let polar: readonly [number, number] | undefined;
  if ("draw" in site) {
    const radius: number = site.draw * Math.sqrt(drawn[0]);
    const angle: number = 2 * Math.PI * drawn[1];
    polar = [radius * Math.cos(angle), radius * Math.sin(angle)];
  }
  return (
    frame: IAutoMovieMotionHumanTouchSite.IFrame,
    shoulder: IAutoMovieVector3,
  ): IAutoMovieMotionHumanTouchSite.IFrame => {
    const n: IAutoMovieVector3 = frame.normal;
    const lay = (v: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.subtract(v, Vector3.scale(n, Vector3.dot(v, n)));
    let offset: IAutoMovieVector3;
    if ("along" in site) offset = { x: 0, y: 0, z: 0 };
    else if ("rule" in site && !("draw" in site)) {
      const toward: IAutoMovieVector3 = lay(
        Vector3.subtract(shoulder, frame.point),
      );
      const length: number = Vector3.length(toward);
      offset = Vector3.scale(
        toward,
        length > site.within ? site.within / length : 1,
      );
    } else {
      const raised: IAutoMovieVector3 = lay({ x: 0, y: 1, z: 0 });
      const up: IAutoMovieVector3 = Vector3.normalize(
        Vector3.length(raised) > 1e-6 ? raised : lay({ x: 0, y: 0, z: 1 }),
      );
      const out: IAutoMovieVector3 = Vector3.cross(up, n);
      offset =
        "draw" in site
          ? Vector3.add(
              Vector3.scale(up, polar![0]),
              Vector3.scale(out, polar![1]),
            )
          : Vector3.add(
              Vector3.scale(up, site.up ?? 0),
              Vector3.scale(out, site.out ?? 0),
            );
    }
    return { point: Vector3.add(frame.point, offset), normal: n };
  };
}

/**
 * Where on a region a touch lands: a region is a patch of skin, not one point,
 * so a touch names a place on it. The place is stated by the author, drawn by
 * the seed, or chosen by a rule; on a prop's contact that has a length, it is a
 * share along that length (`along`, `span`).
 *
 * A place is an offset in the region's own surface: `up` along the surface
 * toward the head (the world's up laid into the surface) and `out` to the right
 * of someone facing the surface. On a level surface, where the world's up has
 * no direction in it, `up` is the world's forward.
 */
export namespace touchSite {
  /**
   * The displacement of a site along a prop's contact, at a film second.
   *
   * @param context The action's context, which reads the prop.
   * @param subject The prop's subject id.
   * @param id The contact's id, one of the prop's affordances.
   * @param share How far along the contact from its middle, a share of its
   *   length in [-0.5, 0.5].
   * @returns For a film second, the displacement from the contact's middle,
   *   world metres.
   * @throws {HumanRefusal} When the share lies outside [-0.5, 0.5], or the prop
   *   declares no such contact or no length for it.
   */
  export function span(
    context: Pick<IAutoMovieMotionHumanActionContext, "prop">,
    subject: string,
    id: string,
    share: number,
  ): (seconds: number) => IAutoMovieVector3 {
    HumanBound.within("site.along", share, -0.5, 0.5);
    const read: IAutoMovieMotionHumanPropReader = context.prop(subject);
    const found: IAutoMovieAffordance | undefined = (
      read.prop.affordances ?? []
    ).find((affordance: IAutoMovieAffordance): boolean => affordance.id === id);
    if (found === undefined || found.length === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "site",
        value: `${subject}.${id}`,
        feasible: {
          kind: "alternatives",
          values: (read.prop.affordances ?? [])
            .filter(
              (affordance: IAutoMovieAffordance): boolean =>
                affordance.length !== undefined,
            )
            .map((affordance: IAutoMovieAffordance): string => affordance.id),
        },
        reason: `${subject} declares no contact named ${id} with a length to lie along`,
        fix: "name a contact of the prop that has a length, or state the site as an offset",
      });
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      found.frame.rotation,
      { x: share * found.length, y: 0, z: 0 },
    );
    return (seconds: number): IAutoMovieVector3 =>
      Quaternion.rotateVector(read.frame(seconds).rotation, local);
  }
}
