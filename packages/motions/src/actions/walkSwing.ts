import { Vector3 } from "@automovie/engine";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFoot } from "../posture/HumanFoot";
import type { IWalkGait } from "./IWalkGait";
import { walkFoot } from "./walkFoot";

/**
 * Evaluate a swing from the actual stance reader that owns its endpoints.
 * Scheduled and reached readers remain separate; every observation reads
 * its own endpoints and retains no completed stance or fitted trajectory.
 *
 * @param body The plan's fixed body.
 * @param gait The gait's lift, straight leg and landing rule.
 * @param at The stance endpoint reader, in action seconds, borrowing only the current observation's optional FK source.
 * @returns A random-access swing reader that evaluates all three original endpoint observations on every request.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States endpoint ownership, fixed body/gait inputs, action timebase, same-query FK loan and actual three-endpoint observations.
 * @evidence contracts/development/implementation.md#principled-implementation A swing leaves the stance with its ankle, pitch and toe rates read over the same millisecond interval and joins the stance at heel strike; `walkFoot.prepareSwing` owns its unchanged interpolation and clearance.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Each request reads departure, its original millisecond predecessor and arrival, then evaluates the shared swing owner for that same observation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every endpoint computation, rate interval, lift, straight-leg and landing rule remains actual; no completed reached endpoint or fitted interpolation reader is replayed from another observation.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each read pays the original three endpoint observations and swing interpolation/clearance costs; body/stance prerequisites remain with their shared owners, without a retained fitted-answer lookup.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Body/gait and the endpoint callback are fixed plan dependencies. Only the current observation's genuine FK metadata may be borrowed; each endpoint and resulting swing are recomputed for this request.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains body/gait/callback references only. Current endpoints and their interpolation closure end on return/throw, and the returned foot retains no FK loan, endpoint reader, completed-fit entry or query history.
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
  return (
    side: "left" | "right",
    swing: { off: number; on: number },
    share: number,
    resolution?: Parameters<IHumanActionPlan["posture"]>[2],
  ): walkFoot.IFoot => {
    const from: walkFoot.IEnd = at(side, swing.off, resolution);
    const before: walkFoot.IEnd = at(side, swing.off - TICK, resolution);
    const read: (share: number) => walkFoot.IFoot = walkFoot.prepareSwing(body, side, {
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
    return read(share);
  };
}

/** Seconds before toe-off over which a stance's departure rates are read. */
const TICK: number = 1e-3;
