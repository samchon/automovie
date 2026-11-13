import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { StrikingBlade } from "../striking/StrikingBlade";
import { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingRoll } from "../striking/StrikingRoll";
import { HumanSword } from "./HumanSword";

/**
 * The thrust of blade work: the point driven straight onto the target, from
 * where the fencer stands or carried by a step or a lunge, then recovered.
 *
 * A thrust states where the point goes and about which way the blade runs;
 * the blade's turn about its own line, and a lean of that line inside
 * `HumanSword.CONE`, are the ones the arm holds best with the blade as the
 * hand took it (`StrikingRoll.hand`). The attack lasts as a minimum-jerk
 * unit arrested at its peak, at the sword's cited peak speed in a lunge
 * (`HumanSword.SPEED`). Parameters, the advance and the parried outcome are
 * `HumanSword`'s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a thrust fixes, what is chosen for it and where its timing comes from.
 * @evidence contracts/development/design.md#principled-representation One law record over the held-tool stroke planner, sharing the cut's aim, clock and parameters.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law alone.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No blade kind is named.
 */
export namespace HumanSwordThrust {
  /**
   * Thrust: the point driven straight onto the target at the decisive instant (`stroke`), with a step or a lunge when asked, then recovered. A target beyond the arm with the chosen advance is refused on `target`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the decisive instant, the advance and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The landed pose puts the point on the target with the blade along the line from the shoulder, as it stands after the advance; the hilt starts drawn back beside the lower ribs with the point already on the line, and point and turn run to the landed pose on one progress. The attack lasts as a minimum-jerk unit arrested at its peak speed, the sword's cited peak velocity in a lunge.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The aim, the landed pose, the chamber, then the shared stroke planner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The chamber's place is provisional; the shoulder used for the reach ignores the lunge's sink, stated at `StrikingBlade.shoulder`.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per plan; each posture costs the stroke planner's elbow searches and, in an advance, one root lowering.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Planned once per instance; nothing is shared between instances.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over its constants and the entry state, released with the plan.
   */
  export const thrust: IHumanActionLaw<HumanSword.IAttack> = {
    name: "swordThrust",
    interrupts: HumanSword.follows("stroke"),
    plan: (context: IHumanActionContext<HumanSword.IAttack>): IHumanActionPlan => {
      const s: HumanSword.ISetup = HumanSword.setup(context);
      const a: HumanSword.IAim = HumanSword.aim(
        context,
        s,
        { out: 0, up: -0.15, forward: 0.85 },
        s.tool.length,
      );

      // A thrust states no edge, so the blade is turned about its own line
      // the way the arm holds it with the least strain, and keeps that turn
      // from the chamber on.
      const landed: StrikingHeld.IHandFrame = StrikingRoll.hand(
        context,
        s.tool,
        0,
        a.target,
        Vector3.subtract(a.target, a.reach),
        HumanSword.CONE,
        a.posture,
      );
      const down: IAutoMovieVector3 = Quaternion.rotateVector(
        landed.rotation,
        s.tool.edge,
      );
      if (context.params.target !== undefined)
        StrikingRoll.reachable(context, s.tool, landed, 0, a.posture, HumanSword.FIX);

      // The chamber: the hilt drawn back beside the lower ribs, the point
      // already on the line to the target.
      const hilt: IAutoMovieVector3 = Vector3.add(
        s.shoulder,
        Vector3.scale(
          s.world({ out: 0.05, up: -0.45, forward: 0.3 }, a.yaw),
          s.arm,
        ),
      );
      const drawn: StrikingHeld.IHandFrame = StrikingHeld.hand(
        s.tool,
        s.tool.length,
        hilt,
        Vector3.subtract(a.target, hilt),
        down,
      );
      return StrikingBlade.plan(context, {
        tool: s.tool,
        clock: HumanSword.timed(
          context,
          Vector3.length(
            Vector3.subtract(a.target, StrikingHeld.point(s.tool, drawn)),
          ),
          s.skill(HumanSword.SPEED.thrust),
          0,
        ),
        path: (progress: number): StrikingHeld.IHandFrame => ({
          point: Vector3.lerp(drawn.point, landed.point, progress),
          rotation: Quaternion.slerp(
            drawn.rotation,
            landed.rotation,
            Math.min(1, progress),
          ),
        }),
        back: 0,
        support: s.support,
        advance: a.advance,
        line: a.line,
        stay: false,
        stop: HumanSword.stopped(context.params),
      });
    },
  };
}
