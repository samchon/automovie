import { type IAutoMovieResolvedBone, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTouch } from "../compose/AutoMovieMotionHumanTouch";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { touchSite } from "./touchSite";

/**
 * Where the touch law reads a region at a second: on which bones, and moved
 * to which site.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read and the two things that decide it.
 * @evidence contracts/development/design.md#principled-representation One reader per plan, a function of the target and the posture so far, as the touch stroke asks for its region.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function; split from the touch law so each file holds one responsibility.
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
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `AutoMovieMotionHumanTouch.region` and `touchSite.of`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader closes over the bones, the shoulder and the fixed site.
   */
  export function reader(
    context: Pick<
      IHumanActionContext,
      "aim" | "body" | "prop" | "series" | "start"
    >,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: HumanHand.Side,
    target: AutoMovieMotionTarget,
    site: touchSite.ISite | undefined,
  ): (
    target: AutoMovieMotionTarget,
    legs: boolean,
  ) => (posture: IHumanPosture, seconds: number) => touchSite.IFrame {
    const body = context.body;
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
        aimed: AutoMovieMotionTarget,
        legs: boolean,
      ): ((posture: IHumanPosture, seconds: number) => touchSite.IFrame) =>
      (posture: IHumanPosture, seconds: number): touchSite.IFrame => {
        const frame: touchSite.IFrame = AutoMovieMotionHumanTouch.region(
          context,
          aimed,
          context.start + seconds,
          posture,
          legs && onLeg(body, aimed)
            ? poseBones(
                body,
                resolveHumanPosture(body, {
                  ...posture,
                  limbs: {
                    ...(posture.limbs.leftLeg === undefined
                      ? {}
                      : { leftLeg: posture.limbs.leftLeg }),
                    ...(posture.limbs.rightLeg === undefined
                      ? {}
                      : { rightLeg: posture.limbs.rightLeg }),
                  },
                }),
              )
            : bones,
        );
        if (sited === undefined || aimed !== target) return frame;
        return along === undefined
          ? sited(frame, shoulder)
          : {
              point: Vector3.add(frame.point, along(context.start + seconds)),
              normal: frame.normal,
            };
      };
  }
}

/** Whether a self region rides a leg, which a lean moves with the hips. */
function onLeg(
  body: IHumanActionContext["body"],
  target: AutoMovieMotionTarget,
): boolean {
  if (target.kind !== "self") return false;
  return /(UpperLeg|LowerLeg|Foot|Toes)$/.test(
    body.surfaces.regions[target.region].bone,
  );
}
