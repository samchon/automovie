import { Vector3 } from "@automovie/engine";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFoot } from "../posture/HumanFoot";
import type { IWalkGait } from "./IWalkGait";
import { walkFoot } from "./walkFoot";

/**
 * Prepare each swing once from the stance reader that owns its endpoints.
 * A plan uses separate readers for scheduled and reached stances, so neither
 * endpoint preparation can replace the other or retain arbitrary query times.
 *
 * @param body The plan's fixed body.
 * @param gait The gait's lift, straight leg and landing rule.
 * @param at The stance endpoint reader, in action seconds, borrowing only the current observation's optional FK source.
 * @returns A random-access swing reader keyed by side and toe-off seconds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States endpoint ownership, the fixed inputs, timebase and cache key.
 * @evidence contracts/development/implementation.md#principled-implementation A swing leaves the stance with its ankle, pitch and toe rates read over the same millisecond interval and joins the stance at heel strike; `walkFoot.prepareSwing` owns its unchanged interpolation and clearance.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One lazy prepared reader per side and scheduled toe-off, followed by one evaluation of its share.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses every scheduled swing and its original endpoints, rate interval, lift, straight-leg and landing rules without sampling or fitting a replacement.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant map lookup and swing evaluation per read; endpoint sampling and fixed swing geometry run once per scheduled swing.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The plan's body, gait and stance reader are fixed; side and toe-off identify an immutable scheduled interval with its unique heel strike.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each reader owns at most one prepared swing per scheduled footfall until plan release. FK sources pass only through the synchronous three-endpoint construction and never enter a retained reader or record; queried shares never enlarge the maps.
 */
export function walkSwing(
  body: IHumanBody,
  gait: Pick<IWalkGait, "lift" | "stiff" | "swing">,
  at: (side: "left" | "right", seconds: number, resolution?: Parameters<IHumanActionPlan["posture"]>[2]) => walkFoot.IEnd,
): (
  side: "left" | "right",
  swing: { off: number; on: number },
  share: number,
  resolution?: Parameters<IHumanActionPlan["posture"]>[2],
) => walkFoot.IFoot {
  const prepared: Record<
    "left" | "right",
    Map<number, (share: number) => walkFoot.IFoot>
  > = { left: new Map(), right: new Map() };
  return (
    side: "left" | "right",
    swing: { off: number; on: number },
    share: number,
    resolution?: Parameters<IHumanActionPlan["posture"]>[2],
  ): walkFoot.IFoot => {
    let read: ((share: number) => walkFoot.IFoot) | undefined =
      prepared[side].get(swing.off);
    if (read === undefined) {
      const from: walkFoot.IEnd = at(side, swing.off, resolution);
      const before: walkFoot.IEnd = at(side, swing.off - TICK, resolution);
      read = walkFoot.prepareSwing(body, side, {
        from,
        velocity: Vector3.scale(
          Vector3.subtract(from.ankle, before.ankle),
          1 / TICK,
        ),
        rates: {
          pitch:
            (HumanFoot.pitch(from.rotation) - HumanFoot.pitch(before.rotation)) /
            TICK,
          toes: (from.toes - before.toes) / TICK,
        },
        to: at(side, swing.on, resolution),
        seconds: swing.on - swing.off,
        lift: gait.lift,
        stiff: gait.stiff === side,
        settles: gait.swing <= 1,
      });
      prepared[side].set(swing.off, read);
    }
    return read(share);
  };
}

/** Seconds before toe-off over which a stance's departure rates are read. */
const TICK: number = 1e-3;
