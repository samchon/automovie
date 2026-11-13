import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import type { tags } from "typia";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanProp } from "../perform/IHumanProp";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { StrikingBlade } from "../striking/StrikingBlade";
import { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingRoll } from "../striking/StrikingRoll";
import { StrikingSkill } from "../striking/StrikingSkill";
import { HumanSword } from "./HumanSword";

/**
 * The parry of blade work: the strong of the blade brought across an
 * incoming blade where its attack is stopped.
 *
 * A parry answers an attack the author declared `parried` (`HumanSword`),
 * named by its anchor. It reads the attacker's blade at the attack's
 * decisive instant, where that blade stands stopped, and puts its own blade
 * across it there: point up for a high line and down for a low one, on the
 * defender's side, the two centre lines `HumanSword.GAP` apart. The parry
 * waits in the hold it was entered in for as long as puts its meeting
 * (`stroke`) on the attack's decisive instant, so a parry that starts in
 * time meets its attack; `sync` with `align: "stroke"` starts it in time.
 * With no attack named it closes a line as a drill.
 *
 * A blade to meet that lies beyond the arm is refused. First pass: the
 * meeting is where the stopped attack stands, so a parry does not beat the
 * attacking blade aside, and a bind is not planned.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a parry answers, where and when the blades meet, the drill, the refusal and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation One law record over the held-tool stroke planner; the attack is read through its anchor, the outcome having been declared on the attack.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law, its parameters and the closed union of the lines a drill closes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The attacker's blade is read from the performance's displayed prop, never restated in the parry's parameters.
 */
export namespace HumanSwordParry {
  /** The line a parry closes when it answers no attack: high or low, on the blade hand's side (`outside`) or across the body. */
  export type Opening =
    | "highOutside"
    | "highInside"
    | "lowOutside"
    | "lowInside";

  /** Where a parry meets the attacking blade, a share of that blade's length back from its point: its weak (provisional). */
  export const WEAK: number = 0.25;

  /** How far a parrying blade may lean from the line square to the attacker's, degrees, and it turns freely about its own line, so the hand that holds it as it took it can close the parry (provisional). */
  export const LEAN: number = 30;

  /** Parameters of a parry. */
  export interface IParry extends HumanSword.IWield {
    /** The anchor of the cut or thrust it meets; a drill to `line` when absent. */
    against?: string;

    /** The line closed when it answers no attack; `highOutside` when absent. */
    line?: Opening;

    /** Seconds the blades stay together after they meet: a beat leaves at once, a bind stays; 0.15 when absent. */
    hold?: number & tags.Minimum<0>;
  }

  /** Where a parry's blade goes: the point its strong meets, the way it points, the way its edge faces, and the seconds from the start to the attack's decisive instant (null for a drill). */
  interface IMeet {
    at: IAutoMovieVector3;
    point: IAutoMovieVector3;
    edge: IAutoMovieVector3;
    lead: number | null;
  }

  /** Where the parry meets: the drill's line, or the attacker's stopped blade read through the attack's anchor. */
  const meet = (
    context: IHumanActionContext<IParry>,
    s: HumanSword.ISetup,
  ): IMeet => {
    const p: IParry = context.params;
    const forward: IAutoMovieVector3 = s.world({ out: 0, up: 0, forward: 1 });
    if (p.against === undefined) {
      const line: Opening = p.line ?? "highOutside";
      const high: boolean = line.startsWith("high");
      const out: number = line.endsWith("Outside") ? 0.2 : -0.45;
      return {
        at: Vector3.add(
          s.shoulder,
          Vector3.scale(
            s.world({ out, up: high ? 0.1 : -0.45, forward: 0.55 }),
            s.arm,
          ),
        ),
        point: { x: 0, y: high ? 1 : -1, z: 0 },
        edge: s.world({ out: Math.sign(out), up: 0, forward: 0 }),
        lead: null,
      };
    }

    // The attacker's blade where the attack is stopped, at its decisive instant.
    const attack: IHumanActionContext.IPlaced = context.action(p.against);
    const theirs: string | undefined = attack.plan.wields?.prop;
    if (theirs === undefined)
      throw new HumanRefusal({
        kind: "participant",
        axis: "against",
        value: p.against,
        reason: `${p.against} wields no blade for a parry to meet`,
        fix: "parry the anchor of a cut or a thrust made with a blade, or leave `against` out to drill the parry",
      });
    const seconds: number =
      attack.start + (attack.plan.contact ?? attack.plan.duration);
    const held: IHumanActionContext.IProp = context.prop(theirs);
    const tip: IHumanProp["points"][string] | undefined =
      held.prop.points.point;
    if (tip === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "against",
        value: `${theirs}.point`,
        feasible: {
          kind: "alternatives",
          values: Object.keys(held.prop.points),
        },
        reason: `${theirs} declares no point, so its blade's line is unknown`,
        fix: "parry an attack made with a prop that declares its point",
      });
    const frame: IHumanProp.IFrame = held.frame(seconds);
    const along: IAutoMovieVector3 = Quaternion.rotateVector(
      frame.rotation,
      tip.normal,
    );
    const length: number = Vector3.dot(tip.point, tip.normal);
    const middle: IAutoMovieVector3 = Vector3.subtract(
      Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, tip.point),
      ),
      Vector3.scale(along, WEAK * length),
    );

    // The parrying blade crosses the attacker's, point up for a high line
    // and down for a low one, and sits on the defender's side of it.
    // Of the lines square to the attacker's blade it takes the most upright,
    // so the hand stays under a high parry and over a low one; an upright
    // attacking blade is crossed level, across the defender's front.
    const lifted: IAutoMovieVector3 = Vector3.subtract(
      { x: 0, y: 1, z: 0 },
      Vector3.scale(along, along.y),
    );
    const high: boolean = middle.y >= s.shoulder.y - 0.3 * s.arm;
    const upright: IAutoMovieVector3 = Vector3.normalize(
      Vector3.length(lifted) < 0.3 ? Vector3.cross(along, forward) : lifted,
    );
    const point: IAutoMovieVector3 = Vector3.scale(
      upright,
      upright.y >= 0 === high ? 1 : -1,
    );
    const normal: IAutoMovieVector3 = Vector3.normalize(
      Vector3.cross(along, point),
    );
    const mine: number =
      Vector3.dot(normal, Vector3.subtract(s.shoulder, middle)) >= 0 ? 1 : -1;
    return {
      at: Vector3.add(middle, Vector3.scale(normal, mine * HumanSword.GAP)),
      point,
      edge: Vector3.scale(normal, -mine),
      lead: seconds - context.start,
    };
  };

  /**
   * Parry: the strong of the blade brought across an incoming blade where its attack is stopped, meeting it at `stroke`, or to a line as a drill. A meeting beyond the arm is refused on `target`; an attack without a blade on `against`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what meets what, the instant and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The attacker's displayed blade at the attack's decisive instant gives the meeting point (`WEAK` of its length back from its point, the strong of the parrying blade on the weak of the attacking one); the parrying blade crosses it, upright for a high line and point down for a low one, offset to the defender's side by `HumanSword.GAP`. The parry waits in its entry hold so that its own travel ends on that instant.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Where the blades meet, the closed pose, the timing, then the shared stroke planner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The meeting share, the hold and the retraction times are provisional; a parry that starts too late for its travel keeps its own time and arrives late, never faster than its skill.
   * @evidence contracts/development/implementation.md#efficient-algorithms One read of the attacker's prop frame per plan.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Planned once per instance; nothing is shared between instances.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over its constants and the entry state, released with the plan.
   */
  export const parry: IHumanActionLaw<IParry> = {
    name: "swordParry",
    interrupts: HumanSword.follows("stroke"),
    plan: (context: IHumanActionContext<IParry>): IHumanActionPlan => {
      const s: HumanSword.ISetup = HumanSword.setup(context);
      const m: IMeet = meet(context, s);

      // The parry receives as near its hilt as the arm allows: the strong
      // first, then farther up the blade while the wrist is out of reach.
      const grip: IAutoMovieVector3 = HumanHand.offset(
        context.body,
        s.tool.side,
        "grip",
      ).point;
      const receive = (share: number): StrikingHeld.IHandFrame =>
        StrikingRoll.hand(
          context,
          s.tool,
          (1 - share) * s.tool.length,
          m.at,
          m.point,
          LEAN,
          context.entry.posture,
        );
      const share: number =
        [0, 0.1, 0.2, 0.3, 0.4, 0.5]
          .map((more: number): number => HumanSword.LANDS.parry + more)
          .find((candidate: number): boolean => {
            const frame: StrikingHeld.IHandFrame = receive(candidate);
            return (
              Vector3.length(
                Vector3.subtract(
                  Vector3.subtract(
                    frame.point,
                    Quaternion.rotateVector(frame.rotation, grip),
                  ),
                  s.shoulder,
                ),
              ) <=
              HumanSword.REACH * s.arm
            );
          }) ?? HumanSword.LANDS.parry;
      const back: number = (1 - share) * s.tool.length;
      const closed: StrikingHeld.IHandFrame = receive(share);
      StrikingRoll.reachable(
        context,
        s.tool,
        closed,
        back,
        context.entry.posture,
        `stand closer to the blade to parry, which is met at ${m.at.x.toFixed(2)}, ${m.at.y.toFixed(2)}, ${m.at.z.toFixed(2)} m, or have the attack aim nearer`,
      );
      const bones: ReturnType<typeof poseBones> = poseBones(
        context.body,
        context.entry.pose,
      );
      const held: StrikingHeld.IHandFrame = {
        point: HumanHand.frame(context.body, bones, s.tool.side, "grip").point,
        rotation: bones.get(`${s.tool.side}Hand`)!.worldRotation,
      };

      // The parry's own time, then as much waiting in the entry hold as puts
      // its meeting on the attack's decisive instant.
      const natural: number = Math.max(
        0.15,
        (1.875 *
          Vector3.length(
            Vector3.subtract(m.at, StrikingHeld.point(s.tool, held, back)),
          )) /
          s.skill(HumanSword.SPEED.thrust),
      );
      const lead: number = m.lead ?? natural;
      const recovery: number = StrikingSkill.recovery(context.skill);
      return StrikingBlade.plan(context, {
        tool: s.tool,
        clock: AutoMovieMotionClock.phrase({
          prepare: Math.max(0, lead - natural),
          attack: lead >= 0.1 ? Math.min(lead, natural) : natural,
          hold: HumanBound.least("hold", context.params.hold ?? 0.15, 0, "s"),
          retract: 0.35 * recovery,
        }),
        path: (progress: number): StrikingHeld.IHandFrame => ({
          point: Vector3.lerp(held.point, closed.point, Math.min(1, progress)),
          rotation: Quaternion.slerp(
            held.rotation,
            closed.rotation,
            Math.min(1, progress),
          ),
        }),
        back,
        support: s.support,
        advance: "none",
        line: s.world({ out: 0, up: 0, forward: 1 }),
        stay: false,
        stop: 1,
      });
    },
  };
}
