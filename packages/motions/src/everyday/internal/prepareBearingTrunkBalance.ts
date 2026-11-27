import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

import { HumanContactWindow } from "../../law/internal/HumanContactWindow";
import { HumanPhysics } from "../../law/internal/HumanPhysics";
import { HumanSupportPatch } from "../../posture/internal/HumanSupportPatch";
import { prepareHumanTrunkBalance } from "./prepareHumanTrunkBalance";

/*
 * Turn the lumbar subtree against the currently bearing contact patches without
 * moving the pelvis. The bearing contacts inside the balance window and the
 * trunk balance over them are prepared here, so a write only reads them.
 * Parameter body: The body.
 * Parameter window: The balance window; none leaves every posture as it is.
 * Parameter duration: The action's seconds.
 * Parameter contacts: The action's contact windows, shares of the action.
 * Returns: The primitive's write.
 */
export function prepareBearingTrunkBalance(
  body: IAutoMovieMotionHumanBody,
  window: HumanPhysics.Window,
  duration: number,
  contacts: readonly IAutoMovieMotionHumanContactWindow[],
): IAutoMovieMotionHumanPrimitive["write"] {
  if (window === null)
    return (
      posture: Parameters<IAutoMovieMotionHumanPrimitive["write"]>[0],
    ): ReturnType<IAutoMovieMotionHumanPrimitive["write"]> => posture;
  const bearing: IAutoMovieMotionHumanContactWindow[] = contacts.filter(
    (contact: IAutoMovieMotionHumanContactWindow): boolean =>
      contact.to * duration >= window.from &&
      contact.from * duration <= window.to &&
      contact.load !== 0 &&
      (HumanContactWindow.BEARING.includes(contact.kind) ||
        contact.load !== undefined),
  );
  const bones: Set<AutoMovieHumanoidBone> = new Set(
    bearing.map(
      (contact: IAutoMovieMotionHumanContactWindow): AutoMovieHumanoidBone =>
        HumanSupportPatch.frame(body, contact).bone,
    ),
  );
  const trunk: ReturnType<typeof prepareHumanTrunkBalance> =
    prepareHumanTrunkBalance(body, {
      bones,
      points: (
        frames: Parameters<typeof HumanSupportPatch>[1],
        share: number,
      ): ReturnType<typeof HumanSupportPatch> =>
        bearing.flatMap(
          (
            contact: IAutoMovieMotionHumanContactWindow,
          ): ReturnType<typeof HumanSupportPatch> =>
            contact.from <= share && share <= contact.to
              ? HumanSupportPatch(body, frames, contact)
              : [],
        ),
    });
  return (
    ...args: Parameters<IAutoMovieMotionHumanPrimitive["write"]>
  ): ReturnType<IAutoMovieMotionHumanPrimitive["write"]> => {
    const [posture, seconds, , resolution, projection] = args;
    const weight: number = HumanPhysics.weightAt(window, seconds);
    if (weight === 0) return posture;
    return trunk(
      posture,
      weight,
      resolution,
      projection,
      undefined,
      seconds / duration,
    );
  };
}
