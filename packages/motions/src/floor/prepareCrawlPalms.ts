import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanHand } from "../posture/HumanHand";
import { HumanHandTarget } from "../posture/HumanHandTarget";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";

/**
 * Prepare the crawl's two flat-palm frames. Each current palm is placed
 * once, and that actual wrist supplies both the original default elbow
 * search and the canonical contact-goal assembly.
 *
 * @param body The unchanged body and hand surfaces for this crawl plan.
 * @param forward Fixed world heading used by both flat palms; callbacks must not mutate it.
 * @param flat The crawl frame owner's immutable side-only flat digit shapes.
 * @returns A current-posture/palm-point writer preserving left-then-right order for actual native callbacks that keep current root/trunk/forward unchanged within the call, borrowing optional parent FK only during that call. Generic callbacks use crawlFrame.laid.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed hand/frame/shape inputs, world points, one actual wrist per side and original ordered current default-bend goals.
 * @evidence contracts/development/implementation.md#principled-implementation HumanHandTarget.prepareFrame owns the same upward-floor-normal/explicit-forward alignment and flat-hand wrist placement. Each actual wrist receives its native prepared Bend solve with the original hanging fallback, then ArmTarget.fromWrist emits the same contact datum and goal fields.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Two fixed frame readers precede the original ordered two-hand writes; one placed wrist connects its actual numerical bend and contact goal without constructing and re-placing an intermediate surface target.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every actual default elbow sweep, legality/ranking/refinement, fallback, flat finger entry and current palm input remains. No preset, sampled pose, target point, elbow answer, contact threshold or altered ROM replaces its computation.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed alignment/rotated offsets and lazy local contact datums prepare once per side. Each current palm needs one wrist placement rather than two, and a synchronous prepareBoth shares the actual unchanged empty-joint body frame/TRUNK geometry between sides. Both original bounded default bend searches remain; runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Unchanged body/hand surfaces, flat shapes, floor normal and explicit forward prove fixed plan geometry. Only current rootXYZ/yaw/pitch/roll matter to the original Bend chain, so ordered hand-goal/digit writes leave its bilateral source unchanged; every actual wrist still runs its own native search.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns two fixed frame readers and at most two private contact vectors until release, borrowing immutable flat shapes. Each synchronous call releases its bilateral contexts/source/FK, current postures and wrists except fresh returned goal payloads; no workspace, queried time or result history is retained.
 */
export function prepareCrawlPalms(
  body: IHumanBody,
  forward: IAutoMovieVector3,
  flat: Readonly<Record<"left" | "right", IHumanPosture["joints"]>>,
): (
  posture: IHumanPosture,
  palm: (side: "left" | "right") => IAutoMovieVector3,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
) => IHumanPosture {
  const frames: Record<
    "left" | "right",
    ReturnType<typeof HumanHandTarget.prepareFrame>
  > = {
    left: HumanHandTarget.prepareFrame(
      body,
      "left",
      { x: 0, y: 1, z: 0 },
      { surface: "palm", shape: "flat", forward },
    ),
    right: HumanHandTarget.prepareFrame(
      body,
      "right",
      { x: 0, y: 1, z: 0 },
      { surface: "palm", shape: "flat", forward },
    ),
  };
  const contacts: Partial<Record<"left" | "right", IAutoMovieVector3>> = {};
  return (
    posture: IHumanPosture,
    palm: (side: "left" | "right") => IAutoMovieVector3,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IHumanPosture => {
    const both: ReturnType<typeof AutoMovieMotionHumanBend.prepareBoth> =
      AutoMovieMotionHumanBend.prepareBoth({ body, posture }, resolution);
    let out: IHumanPosture = posture;
    for (const side of ["left", "right"] as const) {
      const point: IAutoMovieVector3 = palm(side);
      const frame: ReturnType<ReturnType<typeof HumanHandTarget.prepareFrame>> =
        frames[side](out);
      const wrist: HumanHand.IWrist = frame.place(point);
      const bend: IAutoMovieVector3 = both(side).solve({
        point: wrist.point,
        rotation: frame.rotation,
        fallback: "hang",
      });
      const contact: IAutoMovieVector3 = (contacts[side] ??= {
        ...HumanHand.offset(body, side, "palm", "flat").point,
      });
      out = {
        ...out,
        joints: { ...out.joints, ...flat[side] },
        limbs: {
          ...out.limbs,
          [`${side}Arm`]: AutoMovieMotionHumanArmTarget.fromWrist(wrist, bend, {
            ...contact,
          }),
        },
      };
    }
    return out;
  };
}
