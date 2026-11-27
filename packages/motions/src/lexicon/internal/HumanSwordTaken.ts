import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPlacedAction,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieMotionHumanSword,
  IAutoMovieMotionHumanSwordParry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { motionClock } from "../../compose/internal/motionClock";
import { motionPrepared } from "../../compose/internal/motionPrepared";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { StrikingBlade } from "../../striking/internal/StrikingBlade";
import { StrikingHeld } from "../../striking/internal/StrikingHeld";
import { HumanSword } from "./HumanSword";

/*
 * A taken blade: the attacker's blade, stopped by a parry that takes it
 * (`IAutoMovieMotionHumanSword.IAttack.taken`), kept on the parrying blade
 * while that parry carries it aside, then held where it was left until a named
 * action ends.
 *
 * The attack ended where it was stopped, so this starts on that pose. The hand
 * keeps its grip and its attitude, and is carried by the parrying blade's own
 * displayed translation since this action's start, the two blades staying
 * together as the parry carries them (`HumanSwordParry`), up to the parry's
 * relax, where the parry leaves the blade; it holds that place until the action
 * named by `until` ends, or the parry ends. The body keeps its entry posture,
 * an advance's stance included. The row fixes no number: its duration is the
 * named action's end.
 */
export namespace HumanSwordTaken {
  /*
   * Taken: the stopped blade kept on the parry that took it while it is carried
   * aside, then held there until `until` ends. A parry that wields no blade is
   * refused on `against`; an action that ends before this starts on `until`.
   */
  export const taken: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSwordParry.ITaken> =
    {
      name: "swordTaken",
      interrupts: StrikingHeld.follows("stroke"),
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSwordParry.ITaken>,
      ): IAutoMovieMotionHumanActionPlan => {
        const s: IAutoMovieMotionHumanSword.ISetup = HumanSword.setup(context);
        const p: IAutoMovieMotionHumanSwordParry.ITaken = context.params;

        // The parry and its blade, and the action whose end this holds to.
        const parry: IAutoMovieMotionHumanPlacedAction = context.action(
          p.against,
        );
        const theirs: string | undefined = parry.plan.wields?.prop;
        if (theirs === undefined)
          throw new AutoMovieMotionHumanRefusal({
            kind: "participant",
            axis: "against",
            value: p.against,
            reason: `${p.against} wields no blade to keep the taken blade on`,
            fix: "name the anchor of the parry that took the blade",
          });
        const until: IAutoMovieMotionHumanPlacedAction =
          p.until === undefined ? parry : context.action(p.until);
        const duration: number =
          until.start + until.plan.duration - context.start;
        if (!(duration > 0))
          throw new AutoMovieMotionHumanRefusal({
            kind: "participant",
            axis: "until",
            value: p.until ?? p.against,
            reason: `${p.until ?? p.against} ends before the taken blade is held`,
            fix: "hold the taken blade until an action that ends after the attack",
          });

        // The parrying blade's translation since this action's start, read no
        // later than the parry's relax, where it leaves the blade.
        const relax: number =
          parry.plan.events.find(
            (e: IAutoMovieMotionEvent): boolean => e.name === "relax",
          )?.share ?? 1;
        const left: number = parry.start + relax * parry.plan.duration;
        const reader: IAutoMovieMotionHumanPropReader = context.prop(theirs);
        // The parrying blade's frame at the start and where the parry lets
        // go, solved once the performance is placed (`prepare`); a read
        // before reads them there.
        const ends: motionPrepared.IValue<
          readonly [IAutoMovieVector3, IAutoMovieVector3]
        > = motionPrepared(
          (): readonly [IAutoMovieVector3, IAutoMovieVector3] => [
            reader.frame(context.start).position,
            reader.frame(left).position,
          ],
        );
        const carried = (seconds: number): IAutoMovieVector3 => {
          const [origin, release]: readonly [
            IAutoMovieVector3,
            IAutoMovieVector3,
          ] = ends.read();
          const at: number = context.start + seconds;
          return AutoMovieEngineVector3.subtract(
            at < left ? reader.frame(at).position : release,
            origin,
          );
        };

        const entered: IAutoMovieMotionHumanStrikingHeld.IHandFrame =
          HumanSword.held(context, s.tool.side);
        const planned: IAutoMovieMotionHumanActionPlan = StrikingBlade.plan(
          context,
          {
            tool: s.tool,
            clock: motionClock.phrase({
              prepare: 0,
              attack: 0,
              hold: duration,
              retract: 0,
            }),
            path: (): IAutoMovieMotionHumanStrikingHeld.IHandFrame => entered,
            back: s.tool.length,
            follow: carried,
            support: s.support,
            advance: "none",
            line: s.world({ out: 0, up: 0, forward: 1 }),
            kept: true,
            stay: true,
            stop: 1,
          },
        );

        // The blade's ends are solved on the placed performance, after the
        // plan's own solution. The plan is extended in place, so any getter
        // it carries is not read early.
        const prepared: IAutoMovieMotionHumanActionPlan["prepare"] =
          planned.prepare;
        planned.prepare = (): void => {
          prepared?.call(planned);
          ends.prepare();
        };
        return planned;
      },
    };
}
