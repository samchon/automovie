import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPlacedAction,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieMotionHumanSword,
  IAutoMovieMotionHumanSwordParry,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionInterval } from "../../compose/internal/AutoMovieMotionInterval";
import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";
import { HumanBound } from "../../law/internal/HumanBound";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanFreedomChoice } from "../../posture/internal/HumanFreedomChoice";
import { HumanHand } from "../../posture/internal/HumanHand";
import { StrikingBlade } from "../../striking/internal/StrikingBlade";
import { StrikingHeld } from "../../striking/internal/StrikingHeld";
import { StrikingRoll } from "../../striking/internal/StrikingRoll";
import { StrikingSkill } from "../../striking/internal/StrikingSkill";
import { HumanSword } from "./HumanSword";
import { HumanSwordParryAside } from "./HumanSwordParryAside";
import { HumanSwordTiming } from "./HumanSwordTiming";

/*
 * The parry of blade work: the strong of the blade brought across an incoming
 * blade where its attack is stopped.
 *
 * A parry answers an attack the author declared `parried` (`HumanSword`), named
 * by its anchor. It reads the attacker's blade at the attack's decisive
 * instant, where that blade stands stopped, and puts its own blade across it
 * there: point up for a high line and down for a low one, on the defender's
 * side, the two centre lines `HumanSword.GAP` apart. The parry waits in the
 * hold it was entered in for as long as puts its meeting (`stroke`) on the
 * attack's decisive instant, so a parry that starts in time meets its attack;
 * `sync` with `align: "stroke"` starts it in time. With no attack named it
 * closes a line as a drill.
 *
 * It meets the attacking blade on its weak and, while the arm cannot hold its
 * own blade across it there, slides the meeting back along that blade
 * (`SLIDE`), where the stopped blade stands farther from the defender. A blade
 * to meet that lies beyond the arm is refused. The meeting is where the stopped
 * attack stands. An attack declared `taken` ends where it was stopped, and the
 * parry carries its blade aside while the blades stay together (`aside`): level
 * and square to the defender's front, until the whole attacking blade lies
 * outside the defender's broadest half breadth, so a riposte's lunge passes
 * beside it; the attacker's blade follows (`HumanSwordTaken`). First pass: a
 * blade not taken is not beaten aside.
 *
 * What the row fixes: the parry meets the attacking blade at the middle of its
 * foible, 1/6 of its length back from the point (`WEAK`), slides to the middle
 * of the blade, 1/2, when the arm cannot hold it there (`SLIDE`), the two
 * centre lines 5 mm apart (`HumanSword.GAP`), and the blade may lean about 30
 * degrees (29.7) from the square to the attacker's (`LEAN`, the friction angle
 * of steel). The attack is stopped where this parry's guard meets it, a forearm
 * short of its target (`HumanSword.stopped`). The parry's own travel is timed
 * as the thrust's, at 2.6 to 3.2 m/s by skill, and it never arrives faster than
 * its skill: a parry that starts late meets late. It waits in its hold until
 * its meeting falls on the attack's decisive instant, so a parry synced to the
 * attack's `stroke` is in time; the hold afterwards is the stopped attack's own
 * stay. A taken blade is carried aside by one minimum-jerk unit from the end of
 * the attack's follow-through to the parry's relax, and the parry keeps it
 * there until it turns back.
 */
export namespace HumanSwordParry {
  /*
   * Where a parry meets the attacking blade, a share of that blade's length
   * back from its point: the middle of its foible (`HumanSword.THIRDS`).
   */
  export const WEAK: number = HumanSword.THIRDS[0];

  /*
   * The shares of the attacking blade back from its point a parry slides its
   * meeting to, in order, when the arm cannot hold its blade across the foible:
   * the foible's middle, then the middle's, where the stopped blade stands
   * farther from the defender; its forte is the attacker's own guard
   * (`HumanSword.THIRDS`).
   */
  export const SLIDE: readonly number[] = [
    HumanSword.THIRDS[0],
    HumanSword.THIRDS[1],
  ];

  /*
   * How far a parrying blade may lean from the line square to the attacker's,
   * degrees, and it turns freely about its own line, so the hand that holds it
   * as it took it can close the parry: the friction angle of steel sliding on
   * steel, `atan 0.57` (Serway and Jewett, Physics for Scientists and
   * Engineers, the table of coefficients of friction), so the attacking blade
   * pressing on the parrying one does not slide along it toward the hand.
   */
  export const LEAN: number = (Math.atan(0.57) * 180) / Math.PI;

  /*
   * Parry: the strong of the blade brought across an incoming blade where its
   * attack is stopped, meeting it at `stroke`, or to a line as a drill. A
   * meeting beyond the arm is refused on `target`; an attack without a blade on
   * `against`.
   */
  export const parry: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSwordParry.IParry> =
    {
      name: "swordParry",
      interrupts: StrikingHeld.follows("stroke"),
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSwordParry.IParry>,
      ): IAutoMovieMotionHumanActionPlan => {
        const s: IAutoMovieMotionHumanSword.ISetup = HumanSword.setup(context);
        const held: IAutoMovieMotionHumanStrikingHeld.IHandFrame =
          HumanSword.held(context, s.tool.side);

        // The parry receives as near its hilt as the arm allows: on the
        // forte's middle first, then the middle's and the foible's while the
        // wrist is out of reach.
        const grip: IAutoMovieVector3 = HumanHand.offset(
          context.body,
          s.tool.side,
          "grip",
        ).point;
        const receive = (
          meeting: IMeet,
          share: number,
        ): IAutoMovieMotionHumanStrikingHeld.IHandFrame =>
          StrikingRoll.hand(
            context,
            s.tool,
            (1 - share) * s.tool.length,
            meeting.at,
            meeting.point,
            LEAN,
            context.entry.posture,
          );
        const received = (meeting: IMeet): IParryReceivedResult => {
          for (const share of HumanSword.THIRDS) {
            const frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame = receive(
              meeting,
              share,
            );
            if (
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
            )
              return { share, frame };
          }
          return {
            share: HumanSword.LANDS.parry,
            frame: receive(meeting, HumanSword.LANDS.parry),
          };
        };

        // It meets the attacking blade on its weak, and slides the meeting
        // back along that blade (`SLIDE`) while the arm cannot hold its own
        // blade across it there: the first meeting the fitted hand holds within
        // `StrikingRoll.MISS`, else the one it holds best.
        let m: IMeet | undefined;
        let chosen: IParryChosen | undefined;
        let least: number = Infinity;
        for (const weak of context.params.against === undefined
          ? [WEAK]
          : SLIDE) {
          const meeting: IMeet = meet(context, s, weak, held.point);
          const found: IParryFound = received(meeting);
          const missed: number = StrikingRoll.miss(
            context,
            s.tool,
            found.frame,
            (1 - found.share) * s.tool.length,
            context.entry.posture,
          );
          if (
            chosen === undefined ||
            missed < least - HumanFreedomChoice.EXACT
          ) {
            least = missed;
            m = meeting;
            chosen = found;
          }
          if (least <= StrikingRoll.MISS) break;
        }
        const share: number = chosen!.share;
        const back: number = (1 - share) * s.tool.length;
        const closed: IAutoMovieMotionHumanStrikingHeld.IHandFrame =
          chosen!.frame;
        const met: IMeet = m!;
        StrikingRoll.reachable(
          context,
          s.tool,
          closed,
          back,
          context.entry.posture,
          `stand closer to the blade to parry, which is met at ${met.at.x.toFixed(2)}, ${met.at.y.toFixed(2)}, ${met.at.z.toFixed(2)} m, or have the attack aim nearer`,
        );

        // The parry's own time, then as much waiting in the entry hold as puts
        // its meeting on the attack's decisive instant: one minimum-jerk unit
        // of the travel at the lunge's peak point speed
        // (`HumanSwordTiming.UNIT`); a parry entered too late keeps that time
        // and meets late. It holds the meeting while the stopped attack stays
        // there, and returns as one unit of the way back, slowed by the
        // recovery skill's factor as an attack's return is.
        const speed: number = s.skill(HumanSword.SPEED.thrust);
        const natural: number =
          (HumanSwordTiming.UNIT *
            Vector3.length(
              Vector3.subtract(met.at, StrikingHeld.point(s.tool, held, back)),
            )) /
          speed;
        const lead: number = met.lead ?? natural;
        const recovery: number = StrikingSkill.recovery(context.skill);
        const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
          AutoMovieMotionClock.phrase({
            prepare: Math.max(0, lead - natural),
            attack: natural,
            hold: HumanBound.least(
              "hold",
              context.params.hold ?? met.stays,
              0,
              "s",
            ),
            retract:
              (recovery *
                HumanSwordTiming.UNIT *
                HumanSwordTiming.travel(s.tool, closed, held)) /
              speed,
          }),
          AutoMovieMotionManner(context, context.params.manner),
        );

        // A taken blade is carried aside by one minimum-jerk unit from the
        // end of the attack's follow-through to this parry's relax, and the
        // parry keeps it there until it turns back.
        const relax: number = clock.at("relax");
        const sweep: number = Math.min(met.sweep, relax);
        return StrikingBlade.plan(context, {
          tool: s.tool,
          clock,
          ...(Vector3.length(met.aside) === 0
            ? {}
            : {
                follow: (seconds: number): IAutoMovieVector3 =>
                  Vector3.scale(
                    met.aside,
                    AutoMovieMotionInterval.progress(sweep, relax, seconds),
                  ),
              }),
          path: (
            progress: number,
          ): IAutoMovieMotionHumanStrikingHeld.IHandFrame => ({
            point: Vector3.lerp(
              held.point,
              closed.point,
              Math.min(1, progress),
            ),
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

  /*
   * Where the parry meets: the drill's line, or the attacker's stopped blade
   * read through the attack's anchor, `weak` of its length back from its point;
   * `hand` is the parrying hand's grip in its entry hold, which divides the
   * high lines from the low.
   */
  const meet = (
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSwordParry.IParry>,
    s: IAutoMovieMotionHumanSword.ISetup,
    weak: number,
    hand: IAutoMovieVector3,
  ): IMeet => {
    const p: IAutoMovieMotionHumanSwordParry.IParry = context.params;
    const forward: IAutoMovieVector3 = s.world({ out: 0, up: 0, forward: 1 });
    if (p.against === undefined) {
      // A drilled parry closes its line as the fencing masters teach it: the
      // lines are the target's quarters about the sword hand in guard (the
      // upper arm hanging, the forearm square to it toward the opponent), so
      // the hand keeps the guard's height and distance and carries the blade
      // sideways to the edge of the trunk on the line's side, point up for a
      // high line and down for a low one, meeting the attacking blade on its
      // forte.
      const line: IAutoMovieMotionHumanSwordParry.Opening =
        p.line ?? "highOutside";
      const high: boolean = line.startsWith("high");
      const outside: number = line.endsWith("Outside") ? 1 : -1;
      const m: IAutoMovieMotionHumanActionContext["body"]["measure"] =
        context.body.measure;
      const point: IAutoMovieVector3 = { x: 0, y: high ? 1 : -1, z: 0 };
      const edge: number = (outside * m.chestBreadth) / 2 - m.shoulderHalfWidth;
      return {
        at: Vector3.add(
          Vector3.add(
            s.shoulder,
            s.world({ out: edge, up: -m.upperArm, forward: m.forearm }),
          ),
          Vector3.scale(point, HumanSword.LANDS.parry * s.tool.length),
        ),
        point,
        edge: s.world({ out: outside, up: 0, forward: 0 }),
        lead: null,
        stays: 0,
        aside: { x: 0, y: 0, z: 0 },
        sweep: 0,
      };
    }

    // The attacker's blade where the attack is stopped, at its decisive instant.
    const attack: IAutoMovieMotionHumanPlacedAction = context.action(p.against);
    const theirs: string | undefined = attack.plan.wields?.prop;
    if (theirs === undefined)
      throw new AutoMovieMotionHumanRefusal({
        kind: "participant",
        axis: "against",
        value: p.against,
        reason: `${p.against} wields no blade for a parry to meet`,
        fix: "parry the anchor of a cut or a thrust made with a blade, or leave `against` out to drill the parry",
      });
    const decisive: number = attack.plan.contact ?? attack.plan.duration;
    const seconds: number = attack.start + decisive;

    // The stopped attack stays where it was met until it turns back.
    const relax: number | undefined = attack.plan.events.find(
      (e: IAutoMovieMotionEvent): boolean => e.name === "relax",
    )?.share;
    const stays: number =
      relax === undefined
        ? 0
        : Math.max(0, relax * attack.plan.duration - decisive);
    const held: IAutoMovieMotionHumanPropReader = context.prop(theirs);
    const tip: IAutoMovieMotionHumanProp["points"][string] | undefined =
      held.prop.points.point;
    if (tip === undefined)
      throw new AutoMovieMotionHumanRefusal({
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
    const frame: IAutoMovieRigidTransform = held.frame(seconds);
    const along: IAutoMovieVector3 = Quaternion.rotateVector(
      frame.rotation,
      tip.normal,
    );
    const length: number = Vector3.dot(tip.point, tip.normal);
    const end: IAutoMovieVector3 = Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, tip.point),
    );
    const middle: IAutoMovieVector3 = Vector3.subtract(
      end,
      Vector3.scale(along, weak * length),
    );

    // A taken blade is carried aside from the end of the attack's
    // follow-through, where it stops waiting on the parry.
    const taken: boolean = HumanSword.taken(
      attack.params as IAutoMovieMotionHumanSword.IAttack,
    );
    const through: number | undefined = attack.plan.events.find(
      (e: IAutoMovieMotionEvent): boolean => e.name === "strokeEnd",
    )?.share;

    // The parrying blade crosses the attacker's, point up for a high line
    // and down for a low one, and sits on the defender's side of it; the
    // high lines are those above the sword hand, as fencing divides them.
    // Of the lines square to the attacker's blade it takes the most upright,
    // so the hand stays under a high parry and over a low one; an attacking
    // blade within the parry's own `LEAN` of upright is crossed level,
    // across the defender's front.
    const lifted: IAutoMovieVector3 = Vector3.subtract(
      { x: 0, y: 1, z: 0 },
      Vector3.scale(along, along.y),
    );
    const high: boolean = middle.y >= hand.y;
    const upright: IAutoMovieVector3 = Vector3.normalize(
      Vector3.length(lifted) < Math.sin((LEAN * Math.PI) / 180)
        ? Vector3.cross(along, forward)
        : lifted,
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
      stays,
      aside: taken
        ? HumanSwordParryAside(
            context,
            s,
            [end, Vector3.subtract(end, Vector3.scale(along, length))],
            middle,
          )
        : { x: 0, y: 0, z: 0 },
      sweep:
        attack.start +
        (through === undefined ? decisive : through * attack.plan.duration) -
        context.start,
    };
  };

  /*
   * Where a parry's blade goes: the point its strong meets, the way it points,
   * the way its edge faces, the seconds from the start to the attack's decisive
   * instant, the seconds the stopped attack stays there before it turns back
   * (null and 0 for a drill), how far a taken blade is carried aside (none when
   * the blade is not taken) and the second since the start the carrying
   * begins.
   */
  interface IMeet {
    at: IAutoMovieVector3;
    point: IAutoMovieVector3;
    edge: IAutoMovieVector3;
    lead: number | null;
    stays: number;
    aside: IAutoMovieVector3;
    sweep: number;
  }
}

/*
 * The record of `IParryFound`'s site.
 */
type IParryFound = {
  share: number;
  frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame;
};

/*
 * The record of `IParryChosen`'s site.
 */
type IParryChosen = {
  share: number;
  frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame;
};

/*
 * The record of `IParryReceivedResult`'s site.
 */
type IParryReceivedResult = {
  share: number;
  frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame;
};
