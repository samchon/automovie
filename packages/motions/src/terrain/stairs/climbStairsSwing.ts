import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanClearance,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditContact } from "../../audit/AutoMovieMotionHumanAuditContact";
import { AutoMovieMotionHumanClearance } from "../../compose/AutoMovieMotionHumanClearance";
import type { HumanFrame } from "../../posture/HumanFrame";

/**
 * Prepare a stair climb's swings (`climbStairs`): each swinging foot takes the
 * shortest path over the flight's profile (`AutoMovieMotionHumanClearance`),
 * travelled on minimum-jerk progress, and lifts before it travels, as a walking
 * foot does (`walkFoot`): its travel along the flight is held until the path
 * has lifted it over the floor's contact height
 * (`AutoMovieMotionHumanAuditContact.HEIGHT`) and released over as much arc
 * again on a minimum-jerk weight, so no sole slides while it is still on the
 * floor. Holding the foot back only keeps it farther from the riser it must
 * clear.
 *
 * @param framed The flight's frame, its local +Z along the climb.
 * @param required The least ankle height along the flight for a foot.
 * @returns The swing between a foot's two placements, read at its share in [0,
 *   1].
 */
export function climbStairsSwing(
  framed: HumanFrame.IPrepared,
  required: (side: AutoMovieHumanSide) => (z: number) => number,
): (
  side: AutoMovieHumanSide,
  a: IAutoMovieMotionHumanFoot.IPlacement,
  b: IAutoMovieMotionHumanFoot.IPlacement,
) => (s: number) => IAutoMovieMotionHumanFoot.IPlacement {
  return (
    side: AutoMovieHumanSide,
    a: IAutoMovieMotionHumanFoot.IPlacement,
    b: IAutoMovieMotionHumanFoot.IPlacement,
  ): ((s: number) => IAutoMovieMotionHumanFoot.IPlacement) => {
    const from: IAutoMovieVector3 = framed.local(a.ankle);
    const to: IAutoMovieVector3 = framed.local(b.ankle);
    const across: number = to.x - from.x;
    const forward: number = Math.max(1e-9, to.z - from.z);
    const path: AutoMovieMotionHumanClearance.IPath =
      AutoMovieMotionHumanClearance.path(
        { z: from.z, y: a.ankle.y },
        { z: to.z, y: b.ankle.y },
        required(side),
      );
    const lifted: number = path.lifted(AutoMovieMotionHumanAuditContact.HEIGHT);
    const span: number = Math.max(1e-9, Math.min(lifted, 1 - lifted));
    return (s: number): IAutoMovieMotionHumanFoot.IPlacement => {
      const share: number = AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, Math.max(0, s)));
      const at: IAutoMovieMotionHumanClearance.IPoint = path(share);
      const released: number =
        lifted >= 1
          ? 1
          : AutoMovieEngineMotionSampling.minimumJerkShare(
              Math.min(1, Math.max(0, (share - lifted) / span)),
            );
      const z: number = from.z + (at.z - from.z) * released;
      return {
        ankle: framed.point({
          x: from.x + (across * (z - from.z)) / forward,
          y: at.y,
          z,
        }),
        rotation: b.rotation,
      };
    };
  };
}
