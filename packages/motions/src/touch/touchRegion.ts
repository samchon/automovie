import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTouch,
  IAutoMovieMotionHumanTouchSite,
  IAutoMovieMotionTarget,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { touchRegionFrame } from "../compose/touchRegionFrame";
import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { touchSite } from "./touchSite";

/** The alternatives of `DiscContext`'s site. */
type DiscContext = "body" | "performer";

/** The alternatives of `ReaderContext`'s site. */
type ReaderContext = "aim" | "body" | "prop" | "series" | "start";

/**
 * Where the touch law reads a region at a second: on which bones, and moved to
 * which site; and how far about that site a hand may land.
 */
export namespace touchRegion {
  /**
   * The reader of a touch's regions.
   *
   * A leg's region of the performer moves with the hips once the trunk leans,
   * so with `legs` it is read on the legs the posture so far places; every
   * other region is read on the given bones. The first hand's region is moved
   * to its site; a site along a prop's contact is read on the prop's frame at
   * the second, so it follows a prop that moves.
   *
   * @param context The action's context.
   * @param bones The body's bones at the entry, or with the other arm
   *   presented.
   * @param side The first hand.
   * @param target The first hand's target, the one a site applies to.
   * @param site The first hand's site; the region's own point when absent.
   * @returns For a target and whether a leg's region follows the legs, the
   *   region's frame at a posture and a second since the action's start.
   * @throws {HumanRefusal} When the site's radius is negative, or a site along
   *   a contact is given without a prop target, with a share outside [-0.5,
   *   0.5], or on a contact without a length.
   */
  export function reader(
    context: Pick<IAutoMovieMotionHumanActionContext, ReaderContext>,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: AutoMovieHumanSide,
    target: IAutoMovieMotionTarget,
    site: IAutoMovieMotionHumanTouchSite.ISite | undefined,
  ): (
    target: IAutoMovieMotionTarget,
    legs: boolean,
  ) => IAutoMovieMotionHumanTouch.ITouch["region"] {
    const body: IAutoMovieMotionHumanBody = context.body;
    const sited: ReturnType<typeof touchSite> | undefined =
      site === undefined ? undefined : touchSite(context, site);
    const shoulder: IAutoMovieVector3 = bones.get(
      `${side}UpperArm`,
    )!.worldPosition;

    // A site along a prop's contact moves with the prop.
    let along: ((seconds: number) => IAutoMovieVector3) | undefined;
    if (site !== undefined && "along" in site) {
      if (target.kind !== "prop")
        throw new HumanRefusal({
          kind: "affordance",
          axis: "site",
          value: target.kind,
          feasible: { kind: "alternatives", values: ["prop"] },
          reason: "a site along a contact is stated on a prop's contact",
          fix: "aim the touch at a prop's contact, or state the site as an offset",
        });
      along = touchSite.span(context, target.subject, target.point, site.along);
    }
    return (
      aimed: IAutoMovieMotionTarget,
      legs: boolean,
    ): IAutoMovieMotionHumanTouch.ITouch["region"] => {
      const requested: ReadonlySet<AutoMovieHumanoidBone> | undefined =
        legs && aimed.kind === "self" && onLeg(body, aimed)
          ? new Set<AutoMovieHumanoidBone>([
              body.surfaces.regions[aimed.region].bone,
            ])
          : undefined;
      const frames: ReturnType<typeof poseBones.prepare> | undefined =
        requested === undefined
          ? undefined
          : poseBones.prepare(body, requested);

      // Self-contact on a limb that is neither leaning nor part of the trunk
      // already uses the entry or presented-arm bone for the entire phrase.
      const surface =
        aimed.kind === "self" ? body.surfaces.regions[aimed.region] : undefined;
      if (
        requested === undefined &&
        surface !== undefined &&
        !AutoMovieMotionHumanTarget.TRUNK.has(surface.bone)
      ) {
        const at: IAutoMovieMotionHumanTouchSite.IFrame =
          resolveAutoMovieHumanoidSurfaces.place(
            surface,
            bones.get(surface.bone)!,
          );
        const fixed: IAutoMovieMotionHumanTouchSite.IFrame =
          aimed === target && sited !== undefined ? sited(at, shoulder) : at;
        return (): IAutoMovieMotionHumanTouchSite.IFrame => ({
          point: { ...fixed.point },
          normal: { ...fixed.normal },
        });
      }

      return (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
        source?: Parameters<IAutoMovieMotionHumanTouch.ITouch["region"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanTouch.ITouch["region"]>[3],
      ): IAutoMovieMotionHumanTouchSite.IFrame => {
        const resolution:
          | ReturnType<typeof prepareHumanPoseResolution>
          | undefined =
          requested === undefined
            ? undefined
            : prepareHumanPoseResolution(source);
        const frame: IAutoMovieMotionHumanTouchSite.IFrame = touchRegionFrame(
          context,
          aimed,
          context.start + seconds,
          posture,
          requested !== undefined
            ? frames!(
                resolveHumanPosture.seeded(
                  body,
                  {
                    ...posture,
                    limbs: {
                      ...(posture.limbs.leftLeg === undefined
                        ? {}
                        : { leftLeg: posture.limbs.leftLeg }),
                      ...(posture.limbs.rightLeg === undefined
                        ? {}
                        : { rightLeg: posture.limbs.rightLeg }),
                    },
                  },
                  undefined,
                  {},
                  resolution,
                  requested,
                  projection,
                ).pose,
                resolution?.(),
              )
            : bones,
          resolution ?? source,
        );
        if (sited === undefined || aimed !== target) return frame;
        return along === undefined
          ? sited(frame, shoulder)
          : {
              point: Vector3.add(frame.point, along(context.start + seconds)),
              normal: frame.normal,
            };
      };
    };
  }

  /**
   * The radius about its site a hand may land within on its region: the first
   * hand's site's own radius (drawn or chosen within), else the region's extent
   * on the body it belongs to (a region is an area,
   * `AutoMovieHumanoidSurfaceRegions`); none for a prop or a point.
   *
   * @param context The action's context.
   * @param target The hand's target.
   * @param site The hand's site, the first hand's only.
   * @returns Metres, or `undefined`.
   */
  export function disc(
    context: Pick<IAutoMovieMotionHumanActionContext, DiscContext>,
    target: IAutoMovieMotionTarget,
    site: IAutoMovieMotionHumanTouchSite.ISite | undefined,
  ): number | undefined {
    if (site !== undefined && "draw" in site) return site.draw;
    if (site !== undefined && "within" in site) return site.within;
    if (target.kind === "self")
      return context.body.surfaces.regions[target.region].radius;
    if (target.kind === "person")
      return context.performer(target.subject).body.surfaces.regions[
        target.region
      ].radius;
    return undefined;
  }
}

/** Whether a self region rides a leg, which a lean moves with the hips. */
function onLeg(
  body: IAutoMovieMotionHumanActionContext["body"],
  target: IAutoMovieMotionTarget,
): boolean {
  if (target.kind !== "self") return false;
  return /(UpperLeg|LowerLeg|Foot|Toes)$/.test(
    body.surfaces.regions[target.region].bone,
  );
}
