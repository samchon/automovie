import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

import { HumanContactWindow } from "../law/HumanContactWindow";
import { HumanPhysics } from "../law/HumanPhysics";
import { HumanSupportPatch } from "../posture/HumanSupportPatch";
import { prepareHumanTrunkBalance } from "./prepareHumanTrunkBalance";

/**
 * Turn the lumbar subtree against the currently bearing contact patches without
 * moving the pelvis.
 */
export function prepareBearingTrunkBalance(
  body: IAutoMovieMotionHumanBody,
  window: HumanPhysics.Window,
  duration: number,
  contacts: readonly IAutoMovieMotionHumanContactWindow[],
): IAutoMovieMotionHumanPrimitive["write"] {
  let trunk: ReturnType<typeof prepareHumanTrunkBalance> | undefined;
  return (posture, seconds, _before, resolution, projection) => {
    const weight: number = HumanPhysics.weightAt(window, seconds);
    if (weight === 0 || window === null) return posture;
    if (trunk === undefined) {
      const bearing: IAutoMovieMotionHumanContactWindow[] = contacts.filter(
        (contact) =>
          contact.to * duration >= window.from &&
          contact.from * duration <= window.to &&
          contact.load !== 0 &&
          (HumanContactWindow.BEARING.includes(contact.kind) ||
            contact.load !== undefined),
      );
      const bones: Set<AutoMovieHumanoidBone> = new Set(
        bearing.map((contact) => HumanSupportPatch.frame(body, contact).bone),
      );
      trunk = prepareHumanTrunkBalance(body, {
        bones,
        points: (frames, share) =>
          bearing.flatMap((contact) =>
            contact.from <= share && share <= contact.to
              ? HumanSupportPatch(body, frames, contact)
              : [],
          ),
      });
    }
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
