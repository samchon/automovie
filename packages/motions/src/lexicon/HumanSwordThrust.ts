import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
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
  /** The least share of the arm's length the hand stands before the shoulder as the point lands for a pose the arm cannot hold to be blamed on the hold (provisional): nearer, the refusal names its cause, a target inside the tool's own length. */
  export const NEAR: number = 0.3;

  /**
   * Thrust: the point driven straight onto the target at the decisive instant (`stroke`), with a step or a lunge when asked, then recovered. A target beyond the arm with the chosen advance, or so near that the hand would land within `NEAR` of the arm from the shoulder in a pose the arm cannot hold, is refused on `target`.
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
    plan: (
      context: IHumanActionContext<HumanSword.IAttack>,
    ): IHumanActionPlan => {
      const s: HumanSword.ISetup = HumanSword.setup(context);
      const a: HumanSword.IAim = HumanSword.aim(
        context,
        s,
        { out: 0, up: -0.15, forward: 0.85 },
        s.tool.length,
      );

      // A thrust states no edge, so the blade is turned about its own line
      // the way the arm holds it with the least strain.
      const landed: StrikingHeld.IHandFrame = StrikingRoll.hand(
        context,
        s.tool,
        0,
        a.target,
        Vector3.subtract(a.target, a.reach),
        HumanSword.CONE,
        a.posture,
      );
      if (context.params.target !== undefined)
        try {
          StrikingRoll.reachable(
            context,
            s.tool,
            landed,
            0,
            a.posture,
            HumanSword.FIX,
          );
        } catch (error) {
          // A pose the arm cannot hold with the hand folded in against the
          // shoulder fails for one cause: the target stands inside the
          // tool's own length, and no turn of the wrist makes room.
          // The room is what the tool leaves of the line from the shoulder
          // to the target: where the hand stands before the shoulder with
          // the tool on that line, behind it when negative.
          const room: number =
            Vector3.length(Vector3.subtract(a.target, a.reach)) - s.tool.length;
          if (!(error instanceof HumanRefusal) || room >= NEAR * s.arm)
            throw error;
          throw new HumanRefusal({
            kind: "reach",
            axis: "target",
            value: room,
            feasible: {
              kind: "range",
              minimum: NEAR * s.arm,
              maximum: HumanSword.REACH * s.arm,
              unit: "m",
            },
            reason: `the target is ${(room + s.tool.length).toFixed(3)} m from the ${s.tool.side} shoulder and the tool is ${s.tool.length.toFixed(2)} m long, so the hand would stand ${room.toFixed(3)} m before its shoulder (behind it when negative), and the arm cannot hold the tool there`,
            fix: "step back first (a retreat or a void), thrust from farther away, or answer with a cut",
          });
        }

      // The chamber: the hilt drawn back beside the lower ribs, the point
      // already on the line to the target.
      const hilt: IAutoMovieVector3 = Vector3.add(
        s.shoulder,
        Vector3.scale(
          s.world({ out: 0.05, up: -0.45, forward: 0.3 }, a.yaw),
          s.arm,
        ),
      );

      // The chamber's turn about the blade is chosen for the chamber itself,
      // as the landing's is: with the landing's turn carried back, the arm
      // of a small body could not hold the chamber (the hand 35 degrees off
      // what was asked, the wrist at its limits) and the fit jumped there.
      const drawn: StrikingHeld.IHandFrame = StrikingRoll.hand(
        context,
        s.tool,
        s.tool.length,
        hilt,
        Vector3.subtract(a.target, hilt),
        0,
        context.entry.posture,
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
          Vector3.length(Vector3.subtract(a.reach, s.shoulder)),
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
        travel: a.travel,
        line: a.line,
        stay: false,
        stop: HumanSword.stopped(context.params),
      });
    },
  };
}
