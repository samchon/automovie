import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieMotionHumanSword,
  IAutoMovieMotionHumanSwordGuard,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";
import { HumanBound } from "../../law/internal/HumanBound";
import { StrikingBlade } from "../../striking/internal/StrikingBlade";
import { StrikingHeld } from "../../striking/internal/StrikingHeld";
import { StrikingSkill } from "../../striking/internal/StrikingSkill";
import { HumanSword } from "./HumanSword";

/*
 * The guards of blade work: the blade taken from where the hand holds it to a
 * named guard and kept there.
 *
 * A guard is named by where the hilt is held, the tradition-neutral names of
 * the swordplay campaign (decision 8). Its pose is a row of `GUARDS`: the
 * hilt's place from the blade hand's shoulder in arm lengths, the way the blade
 * points and the way its true edge faces, so one row fits every body and every
 * blade. The guard takes at least 0.5 s to set (provisional) and is held
 * `seconds`, 1 s by default
 * (`IAutoMovieMotionHumanSwordGuard.IParams.seconds`). The action ends in the
 * guard: what follows is entered from it.
 */
export namespace HumanSwordGuard {
  /*
   * Each guard: the hilt's place from the blade hand's shoulder in arm lengths,
   * the way the blade points and the way its true edge faces. All provisional,
   * after the figures of Ringeck's gloss of Liechtenauer (vom Tag at the
   * shoulder and overhead, Ochs, Pflug, Alber, Nebenhut) and of the hanging
   * guard.
   */
  export const GUARDS: Readonly<
    Record<IAutoMovieMotionHumanSwordGuard.Guard, IGUARDSEntryItem>
  > = {
    high: {
      hilt: { out: -0.2, up: 0.5, forward: 0.15 },
      point: { out: 0, up: 0.9, forward: -0.4 },
      edge: { out: 0, up: 0, forward: 1 },
    },
    shoulder: {
      hilt: { out: 0, up: 0.05, forward: 0.3 },
      point: { out: 0.1, up: 0.95, forward: -0.3 },
      edge: { out: 0, up: 0, forward: 1 },
    },
    middle: {
      hilt: { out: -0.15, up: -0.6, forward: 0.35 },
      point: { out: -0.1, up: 0.45, forward: 0.9 },
      edge: { out: 0, up: -1, forward: 0 },
    },
    low: {
      hilt: { out: -0.15, up: -0.6, forward: 0.35 },
      point: { out: 0, up: -0.55, forward: 0.85 },
      edge: { out: 0, up: -1, forward: 0 },
    },
    ox: {
      hilt: { out: 0.1, up: 0.3, forward: 0.2 },
      point: { out: -0.25, up: -0.15, forward: 0.95 },
      edge: { out: 0, up: 1, forward: 0 },
    },
    hanging: {
      hilt: { out: -0.1, up: 0.35, forward: 0.4 },
      point: { out: -0.5, up: -0.75, forward: 0.3 },
      edge: { out: 0, up: 1, forward: 0 },
    },
    tail: {
      hilt: { out: 0.15, up: -0.65, forward: 0.1 },
      point: { out: 0.1, up: -0.5, forward: -0.85 },
      edge: { out: 0, up: -1, forward: 0 },
    },
  };

  /*
   * Take a guard and hold it: the hilt reaches the guard's place after the
   * setting time (`stroke`) and stays to the end.
   */
  export const guard: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSwordGuard.IParams> =
    {
      name: "swordGuard",
      interrupts: StrikingHeld.follows("stroke"),
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSwordGuard.IParams>,
      ): IAutoMovieMotionHumanActionPlan => {
        const s: IAutoMovieMotionHumanSword.ISetup = HumanSword.setup(context);
        const set: number = 0.5 * StrikingSkill.recovery(context.skill);
        const seconds: number = Math.max(set, context.params.duration ?? 1);
        HumanBound.least("duration", context.params.duration ?? 1, 0, "s");
        const row: (typeof GUARDS)[IAutoMovieMotionHumanSwordGuard.Guard] =
          GUARDS[context.params.guard ?? "middle"];
        const pose: IAutoMovieMotionHumanStrikingHeld.IHandFrame =
          StrikingHeld.hand(
            s.tool,
            s.tool.length,
            AutoMovieEngineVector3.add(s.shoulder, AutoMovieEngineVector3.scale(s.world(row.hilt), s.arm)),
            s.world(row.point),
            s.world(row.edge),
          );
        return StrikingBlade.plan(context, {
          tool: s.tool,
          clock: AutoMovieMotionManner.time(
            AutoMovieMotionClock.phrase({
              prepare: set,
              attack: 0,
              hold: seconds - set,
              retract: 0,
            }),
            AutoMovieMotionManner(context, context.params.manner),
          ),
          path: (): IAutoMovieMotionHumanStrikingHeld.IHandFrame => pose,
          back: s.tool.length,
          support: s.support,
          advance: "none",
          line: s.world({ out: 0, up: 0, forward: 1 }),
          stay: true,
          stop: 1,
        });
      },
    };
}

/*
 * The record of `IGUARDSEntryItem`'s site.
 */
type IGUARDSEntryItem = {
  hilt: IAutoMovieMotionHumanSword.IParts;
  point: IAutoMovieMotionHumanSword.IParts;
  edge: IAutoMovieMotionHumanSword.IParts;
};
