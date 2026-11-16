import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanBalance } from "../everyday/HumanBalance";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { StrikingTarget } from "../striking/StrikingTarget";

/**
 * Prepare the entry geometry that all speeds in one recovery-limit search
 * share: the original posture's centre, heading axes, displayed feet, sole
 * extents and centre-relative sole points.
 * The owning operation keeps this body and complete entry unchanged.
 *
 * @param body The fixed body.
 * @param entry The exact fixed entry used by every receiving pendulum.
 * @returns World centre/feet, unit floor axes, sole spans in metres and per-side relative outlines with exact placement snapshots.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed complete-entry/body premises, world-metre centre/placements, unit axes and operation lifetime.
 * @evidence contracts/development/implementation.md#principled-implementation Runs HumanBalance.centre's original canonical mass reading, entry-yaw axes, StrikingTarget.feet and HumanFoot.sole readings; sole spans retain max/min of the original ankle-relative dot products and relative outlines retain the original x/z centre subtraction.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One producer owns entry-only facts while StaggerPendulum continues to own speed/push-dependent dynamic state and actual phase integration.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the actual complete entry instead of a rounded key or fitted result; no mass, support, goal, speed or law threshold changes.
 * @evidence contracts/development/implementation.md#efficient-algorithms One complete entry centre resolution and two sole constructions serve all queried speeds; O(v) extent/projection work uses the same v foot points and only the relative arrays survive preparation.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller explicitly supplies this same operation-owned result only to pendulums with its unchanged body and complete entry; changed operations prepare afresh and no global identity/result cache exists.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one operation-owned record with two O(v) relative sole arrays and copied placement snapshots, borrowed by search pendulums until the operation returns or throws; absolute sole arrays release after preparation and no query history or handle is retained.
 */
export function prepareStaggerPendulumEntry(
  body: IHumanActionContext["body"],
  entry: IHumanActionContext["entry"],
): {
  centre: IAutoMovieVector3;
  forward: IAutoMovieVector3;
  across: IAutoMovieVector3;
  entered: Record<"left" | "right", HumanFoot.IPlacement>;
  width: number;
  length: number;
  footprints: Record<"left" | "right", {
    placement: HumanFoot.IPlacement;
    relative: IAutoMovieVector3[];
  }>;
} {
  const centre: IAutoMovieVector3 = HumanBalance.centre(body, entry.posture);
  const forward: IAutoMovieVector3 = HumanFrame.point(
    { origin: { x: 0, y: 0, z: 0 }, yaw: entry.posture.yaw },
    { x: 0, y: 0, z: 1 },
  );
  const across: IAutoMovieVector3 = { x: forward.z, y: 0, z: -forward.x };
  const entered: Record<"left" | "right", HumanFoot.IPlacement> = StrikingTarget.feet(entry);
  const outlines: Record<"left" | "right", IAutoMovieVector3[]> = {
    left: HumanFoot.sole(body, "left", entered.left),
    right: HumanFoot.sole(body, "right", entered.right),
  };
  const extent: (axis: IAutoMovieVector3) => number = (axis: IAutoMovieVector3): number => Math.max(
    ...(["left", "right"] as const).map((side: "left" | "right"): number => {
      const along: number[] = outlines[side].map((q: IAutoMovieVector3): number =>
        Vector3.dot(Vector3.subtract(q, entered[side].ankle), axis),
      );
      return Math.max(...along) - Math.min(...along);
    }),
  );
  const footprint: (side: "left" | "right") => ReturnType<typeof prepareStaggerPendulumEntry>["footprints"]["left"] = (
    side: "left" | "right",
  ): ReturnType<typeof prepareStaggerPendulumEntry>["footprints"]["left"] => ({
    placement: { ankle: { ...entered[side].ankle }, rotation: { ...entered[side].rotation } },
    relative: outlines[side].map((q: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: q.x - centre.x, y: 0, z: q.z - centre.z,
    })),
  });
  return {
    centre,
    forward,
    across,
    entered,
    width: extent(across),
    length: extent(forward),
    footprints: { left: footprint("left"), right: footprint("right") },
  };
}
