import { Vector3 } from "@automovie/engine";
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

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { HumanRefusal } from "../law/HumanRefusal";
import { StrikingBlade } from "../striking/StrikingBlade";
import { StrikingHeld } from "../striking/StrikingHeld";
import { HumanSword } from "./HumanSword";

/**
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
  /**
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
          throw new HumanRefusal({
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
          throw new HumanRefusal({
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
        let origin: IAutoMovieVector3 | undefined;
        let kept: IAutoMovieVector3 | undefined;
        const carried = (seconds: number): IAutoMovieVector3 => {
          origin ??= reader.frame(context.start).position;
          const at: number = context.start + seconds;
          if (at < left)
            return Vector3.subtract(reader.frame(at).position, origin);
          return (kept ??= Vector3.subtract(
            reader.frame(left).position,
            origin,
          ));
        };

        const entered: IAutoMovieMotionHumanStrikingHeld.IHandFrame =
          HumanSword.held(context, s.tool.side);
        const planned: IAutoMovieMotionHumanActionPlan = StrikingBlade.plan(
          context,
          {
            tool: s.tool,
            clock: AutoMovieMotionClock.phrase({
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

        // Reads made while the schedule was being resolved are dropped once
        // the performance settles.
        const settled: IAutoMovieMotionHumanActionPlan["settle"] =
          planned.settle;
        planned.settle = (): void => {
          origin = undefined;
          kept = undefined;
          settled?.call(planned);
        };
        return planned;
      },
    };
}
