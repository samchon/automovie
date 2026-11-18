import { Vector3 } from "@automovie/engine";
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

import { AutoMovieMotionHumanTouch } from "../compose/AutoMovieMotionHumanTouch";
import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { touchSite } from "./touchSite";

/**
 * Where the touch law reads a region at a second: on which bones, and moved
 * to which site; and how far about that site a hand may land.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read and the two things that decide it.
 * @evidence contracts/development/design.md#principled-representation One reader per plan, a function of the target and the posture so far, as the touch stroke asks for its region.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two functions, the reader and the landing disc; split from the touch law so each file holds one responsibility.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the touch stroke's region resolver and the site owner; no region is named.
 */
export namespace touchRegion {
  /**
   * The reader of a touch's regions.
   *
   * A leg's region of the performer moves with the hips once the trunk
   * leans, so with `legs` it is read on the legs the posture so far places;
   * every other region is read on the given bones. The first hand's region
   * is moved to its site; a site along a prop's contact is read on the
   * prop's frame at the second, so it follows a prop that moves.
   *
   * @param context The action's context.
   * @param bones The body's bones at the entry, or with the other arm presented.
   * @param side The first hand.
   * @param target The first hand's target, the one a site applies to.
   * @param site The first hand's site; the region's own point when absent.
   * @returns For a target and whether a leg's region follows the legs, the region's frame at a posture and a second since the action's start.
   * @throws {HumanRefusal} When the site's radius is negative, or a site along a contact is given without a prop target, with a share outside [-0.5, 0.5], or on a contact without a length.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, which bones each region is read on, what the site moves and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A limb is solved after the trunk, so a leg's region under a lean is read on the legs alone re-solved on the posture so far; the site is fixed once, at plan time, against the first arm's shoulder at the entry.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One site, one shoulder, one closure over them.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The other hand's region is never moved by the first hand's site.
   * @evidence contracts/development/implementation.md#efficient-algorithms One leg resolve per frame, and only for a leg's region under a lean.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates region/site geometry to its owners. A caller may lend genuine same-body ROM metadata and exact FK to each current region observation. Fixed leaning-leg names prepare once; every actual leaning-leg query still runs its original fits and fresh selected-region read-back, no pose or time result is retained.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan reader closes over entry bones, shoulder, fixed site and at most one selected-bone set and genuine fixed-demand producer; borrowed ROM/FK remain within the current query until return or throw, and only the actual frame escapes.
   */
  export function reader(
    context: Pick<
      IAutoMovieMotionHumanActionContext,
      "aim" | "body" | "prop" | "series" | "start"
    >,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: AutoMovieHumanSide,
    target: IAutoMovieMotionTarget,
    site: IAutoMovieMotionHumanTouchSite.ISite | undefined,
  ): (
    target: IAutoMovieMotionTarget,
    legs: boolean,
  ) => IAutoMovieMotionHumanTouch.ITouch["region"] {
    const body: IAutoMovieMotionHumanBody = context.body;
    const sited: ReturnType<typeof touchSite.of> | undefined =
      site === undefined ? undefined : touchSite.of(context, site);
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
          ? new Set<AutoMovieHumanoidBone>([body.surfaces.regions[aimed.region].bone])
          : undefined;
      const frames: ReturnType<typeof poseBones.prepare> | undefined =
        requested === undefined ? undefined : poseBones.prepare(body, requested);
      return (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
        source?: Parameters<IAutoMovieMotionHumanTouch.ITouch["region"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanTouch.ITouch["region"]>[3],
      ): IAutoMovieMotionHumanTouchSite.IFrame => {
        const resolution: ReturnType<typeof prepareHumanPoseResolution> | undefined =
          requested === undefined ? undefined : prepareHumanPoseResolution(source);
        const frame: IAutoMovieMotionHumanTouchSite.IFrame = AutoMovieMotionHumanTouch.region(
          context,
          aimed,
          context.start + seconds,
          posture,
          requested !== undefined
            ? frames!(
                resolveHumanPosture.seeded(body, {
                  ...posture,
                  limbs: {
                    ...(posture.limbs.leftLeg === undefined
                      ? {}
                      : { leftLeg: posture.limbs.leftLeg }),
                    ...(posture.limbs.rightLeg === undefined
                      ? {}
                      : { rightLeg: posture.limbs.rightLeg }),
                  },
                }, undefined, {}, resolution, requested, projection).pose,
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
   * The radius about its site a hand may land within on its region: the
   * first hand's site's own radius (drawn or chosen within), else the
   * region's extent on the body it belongs to (a region is an area,
   * `AutoMovieHumanoidSurfaceRegions`); none for a prop or a point.
   *
   * @param context The action's context.
   * @param target The hand's target.
   * @param site The hand's site, the first hand's only.
   * @returns Metres, or `undefined`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three sources of the radius in their order and when there is none.
   * @evidence contracts/development/implementation.md#principled-implementation A site's own radius bounds where the hand lands about it; without one the region's own extent on its body does, read from the body's surface table.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Four guarded returns, one per source.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No radius is invented for a prop or a point.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The radius is the surface table's, read and not restated.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function disc(
    context: Pick<IAutoMovieMotionHumanActionContext, "body" | "performer">,
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
