import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmTarget } from "../../compose/internal/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { HumanHand } from "../../posture/internal/HumanHand";
import { HumanHandTarget } from "../../posture/internal/HumanHandTarget";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";

/*
 * Prepare the crawl's two flat-palm frames. Each current palm is placed once,
 * and that actual wrist supplies both the original default elbow search and the
 * canonical contact-goal assembly; the goal names the searched elbow place
 * (`elbow: "placed"`), so the arm's fit takes it rather than searching again.
 * Parameter body: The unchanged body and hand surfaces for this crawl plan.
 * Parameter forward: Fixed world heading used by both flat palms; callbacks must
 * not mutate it.
 * Parameter flat: The crawl frame owner's immutable side-only flat digit shapes.
 * Returns: A current-posture/palm-point writer preserving left-then-right order
 * for actual native callbacks that keep current root/trunk/forward unchanged
 * within the call, borrowing optional parent FK only during that call.
 * Generic callbacks use crawlFrame.laid.
 */
export function prepareCrawlPalms(
  body: IAutoMovieMotionHumanBody,
  forward: IAutoMovieVector3,
  flat: Readonly<
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanPosture["joints"]>
  >,
): (
  posture: IAutoMovieMotionHumanPosture,
  palm: (side: AutoMovieHumanSide) => IAutoMovieVector3,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
) => IAutoMovieMotionHumanPosture {
  const frames: Record<
    AutoMovieHumanSide,
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
  const contacts: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: { ...HumanHand.offset(body, "left", "palm", "flat").point },
    right: { ...HumanHand.offset(body, "right", "palm", "flat").point },
  };
  return (
    posture: IAutoMovieMotionHumanPosture,
    palm: (side: AutoMovieHumanSide) => IAutoMovieVector3,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieMotionHumanPosture => {
    const both: ReturnType<typeof AutoMovieMotionHumanBend.prepareBoth> =
      AutoMovieMotionHumanBend.prepareBoth({ body, posture }, resolution);
    let out: IAutoMovieMotionHumanPosture = posture;
    for (const side of ["left", "right"] as const) {
      const point: IAutoMovieVector3 = palm(side);
      const frame: ReturnType<ReturnType<typeof HumanHandTarget.prepareFrame>> =
        frames[side](out);
      const wrist: IAutoMovieMotionHumanHand.IWrist = frame.place(point);
      const bend: IAutoMovieVector3 = both(side).solve({
        point: wrist.point,
        rotation: frame.rotation,
        fallback: "hang",
      });
      const contact: IAutoMovieVector3 = contacts[side];
      out = {
        ...out,
        joints: { ...out.joints, ...flat[side] },
        limbs: {
          ...out.limbs,
          // The bend is the elbow's place this search chose, so the fit
          // starts there and does not search the circle again.
          [`${side}Arm`]: {
            ...AutoMovieMotionHumanArmTarget.fromWrist(wrist, bend, {
              ...contact,
            }),
            elbow: "placed",
          },
        },
      };
    }
    return out;
  };
}
