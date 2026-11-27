import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBallet,
  IAutoMovieMotionHumanDanceBeats,
  IAutoMovieMotionHumanDanceCourse,
} from "@automovie/interface";

import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanRange } from "../../compose/internal/AutoMovieMotionHumanRange";
import { HumanBound } from "../../law/internal/HumanBound";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { DanceFootwork } from "./DanceFootwork";
import { balletJete } from "./balletJete";
import { balletPirouette } from "./balletPirouette";
import { balletPositions } from "./balletPositions";
import { dance } from "./dance";
import { prepareDanceBeats } from "./prepareDanceBeats";

/*
 * Classical ballet on the dance law's beat clock: a position of the feet with a
 * plié or a relevé (`balletPositions`), a pirouette from fourth
 * (`balletPirouette`) and a grand jeté (`balletJete`).
 *
 * Each step reads the dancer's hips: a turnout beyond the hip's external
 * rotation (`AutoMovieMotionHumanRange.limit`) is refused with that limit, and
 * a jeté's split beyond the leading hip's flexion and the other's extension is
 * refused with their sum. The turnout is `TURNOUT` degrees when absent, a
 * trained dancer's hip share of a working turnout (provisional).
 *
 * Not yet: the battement tendu, the développé and the attitude, and a jeté
 * prepared by its own run.
 */
export namespace balletStep {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionKey = "balletStep";

  /*
   * Cancel table: from its relaxing instant, into standing, another ballet step
   * or a dance.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      balletStep: ["fromRelax", "smooth"],
      dance: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
    });

  /*
   * The default turnout, degrees of each hip's external rotation (provisional).
   */
  export const TURNOUT: number = 35;

  /*
   * A ballet step's admitted turnout, position and turns.
   */
  export interface IAdmitted {
    /*
     * The turnout, degrees.
     */
    turnout: number;

    /*
     * The position of the feet, one to five.
     */
    position: number;

    /*
     * The turns, one or two.
     */
    turns: number;
  }

  /*
   * Admit a ballet step: a turnout within the hips' external rotation
   * (`TURNOUT` by default), one of the five positions of the feet, and one or
   * two turns.
   * Parameter p: The turnout, the position and the turns.
   * Parameter outward: The hips' lesser external rotation, degrees.
   * Returns: The admitted values.
   * When a value lies outside its range.
   */
  export function admit(
    p: Pick<
      IAutoMovieMotionHumanBallet.IParams,
      "turnout" | "position" | "turns"
    >,
    outward: number,
  ): IAdmitted {
    const turnout: number = p.turnout ?? TURNOUT;
    if (!(turnout >= 0 && turnout <= outward))
      throw new AutoMovieMotionHumanRefusal({
        kind: "parameter",
        axis: "turnout",
        value: turnout,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: outward,
          unit: "degrees",
        },
        reason: `a turnout of ${turnout} degrees exceeds the hip's external rotation of ${outward.toFixed(0)} degrees`,
        fix: `turn out at most ${outward.toFixed(0)} degrees`,
      });
    const position: number = Math.round(p.position ?? 1);
    if (!(position >= 1 && position <= 5))
      throw new AutoMovieMotionHumanRefusal({
        kind: "parameter",
        axis: "position",
        value: position,
        feasible: { kind: "alternatives", values: ["1", "2", "3", "4", "5"] },
        reason: `ballet has five positions of the feet, not ${position}`,
        fix: "name a position from one to five",
      });
    const turns: number = p.turns ?? 1;
    if (!(turns === 1 || turns === 2))
      throw new AutoMovieMotionHumanRefusal({
        kind: "parameter",
        axis: "turns",
        value: turns,
        feasible: { kind: "alternatives", values: ["1", "2"] },
        reason: `a pirouette here turns once or twice, not ${turns} times`,
        fix: "ask for a single or a double pirouette",
      });
    return { turnout, position, turns };
  }
  /*
   * Plan a ballet step.
   * Parameter context: The action's context.
   * Returns: The plan.
   * When the turnout exceeds the hip's external
   * rotation, the split exceeds the hips' flexion and extension, the position
   * is not one to five, the turns are not one or two, or the tempo or beat
   * count is not admitted.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBallet.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanBallet.IParams = context.params;
    const outward: number = Math.min(
      AutoMovieMotionHumanRange.limit("leftUpperLeg", "external") ?? 0,
      AutoMovieMotionHumanRange.limit("rightUpperLeg", "external") ?? 0,
    );
    const { turnout, turns }: balletStep.IAdmitted = admit(p, outward);
    if (p.kind === "grandJete") {
      const leading: AutoMovieHumanSide = p.side ?? "right";
      const reach: number =
        (AutoMovieMotionHumanRange.limit(
          leading === "left" ? "leftUpperLeg" : "rightUpperLeg",
          "flexion",
        ) ?? 0) +
        // The extension's limit is signed (the range's low end): the split
        // adds its magnitude.
        Math.abs(
          AutoMovieMotionHumanRange.limit(
            leading === "left" ? "rightUpperLeg" : "leftUpperLeg",
            "extension",
          ) ?? 0,
        );
      const split: number = p.split ?? 150;
      if (!(split > 0 && split <= reach))
        throw new AutoMovieMotionHumanRefusal({
          kind: "parameter",
          axis: "split",
          value: split,
          feasible: {
            kind: "range",
            minimum: 0,
            maximum: reach,
            unit: "degrees",
          },
          reason: `a split of ${split} degrees exceeds the hips' flexion and extension, ${reach.toFixed(0)} degrees together`,
          fix: `split at most ${reach.toFixed(0)} degrees`,
        });
    }
    const count: number = HumanBound.whole("count", p.count ?? 4);
    const beats: IAutoMovieMotionHumanDanceBeats = prepareDanceBeats(
      context,
      p.bpm ?? dance.BPM,
      p.kind === "position"
        ? count + 1
        : p.kind === "pirouette"
          ? 2 + turns
          : 2,
      p.lock,
    );
    const course: IAutoMovieMotionHumanDanceCourse =
      p.kind === "position"
        ? balletPositions.course(context, beats, turnout)
        : p.kind === "pirouette"
          ? balletPirouette.course(context, beats, turnout)
          : balletJete.course(context, beats);
    for (let k: number = 1; k <= beats.count; k++)
      if (beats.at(k) <= course.duration)
        course.instants.push({ name: `beat${k}`, seconds: beats.at(k) });
    if (
      !course.instants.some(
        (i: IAutoMovieMotionClockInstant): boolean => i.name === "relax",
      )
    )
      course.instants.push({ name: "relax", seconds: beats.at(beats.count) });
    return DanceFootwork.compose(context.body, context.entry.posture, course, {
      kind: "ground",
    });
  }
}
