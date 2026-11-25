import type {
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanDanceBeats,
  IAutoMovieMotionHumanDanceCourse,
  IAutoMovieMotionHumanGroupDance,
} from "@automovie/interface";

import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { HumanBound } from "../law/HumanBound";
import { DanceFootwork } from "./DanceFootwork";
import { dance } from "./dance";
import { groupDanceCircle } from "./groupDanceCircle";
import { groupDanceConga } from "./groupDanceConga";
import { groupDanceLine } from "./groupDanceLine";
import { prepareDanceBeats } from "./prepareDanceBeats";

/**
 * Social group dances on one shared beat: the line dance (`groupDanceLine`),
 * the circle dance (`groupDanceCircle`) and the conga (`groupDanceConga`).
 * Every member runs this law with the same tempo or cue track, so their beats
 * coincide; each member's beats are then moved by one offset drawn from its own
 * seed within `vary`, so steps fall within that band of the shared beat and no
 * two members move alike. Joined hands read the shared beat, not the member's,
 * so both hands of a pair name the same point. The hips ride over the feet,
 * `CROUCH` of the stature low.
 *
 * Events: `beat{k}` on the member's own beats, `relax`.
 */
export namespace groupDance {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "groupDance";

  /** Cancel table: from the last beat, into standing, walking or another dance. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      groupDance: ["fromRelax", "smooth"],
      dance: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
    });

  /** How low the hips ride on soft knees, a share of the stature (provisional). */
  export const CROUCH: number = 0.02;

  /** A group dance's repeats, timing variation and counts. */
  export interface ICount {
    /** The whole repeats, one by default. */
    repeats: number;

    /** The greatest per-dancer offset, seconds, 0.02 by default. */
    vary: number;

    /** The beats: four a conga repeat, eight a line or circle repeat. */
    counts: number;
  }

  /**
   * Count a group dance.
   *
   * @param p The kind, the repeats and the variation.
   * @returns The count.
   * @throws {HumanRefusal} When the repeats are no whole number or the
   *   variation is negative.
   */
  export function count(
    p: Pick<
      IAutoMovieMotionHumanGroupDance.IParams,
      "kind" | "repeats" | "vary"
    >,
  ): ICount {
    const repeats: number = HumanBound.whole("repeats", p.repeats ?? 1);
    const vary: number = p.vary ?? 0.02;
    HumanBound.least("vary", vary, 0, "s");
    return { repeats, vary, counts: (p.kind === "conga" ? 4 : 8) * repeats };
  }
  /**
   * Plan a member's part in a group dance.
   *
   * @param context The member's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the tempo, the repeats or the variation is not
   *   admitted, or the dance's own geometry refuses.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGroupDance.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanGroupDance.IParams = context.params;
    const { repeats, vary, counts }: groupDance.ICount = count(p);
    const shared: IAutoMovieMotionHumanDanceBeats = prepareDanceBeats(
      context,
      p.bpm ?? dance.BPM,
      counts,
      p.lock,
    );
    const offset: number =
      vary * (2 * context.random("groupDance").float(0) - 1);
    const beats: IAutoMovieMotionHumanDanceBeats = {
      ...shared,
      lead: shared.lead + offset,
      at: (k: number): number => shared.at(k) + offset,
    };
    const course: IAutoMovieMotionHumanDanceCourse =
      p.kind === "line"
        ? groupDanceLine.course(context.body, context.entry, beats, repeats)
        : p.kind === "circle"
          ? groupDanceCircle.course(context, beats, shared)
          : groupDanceConga.course(context, beats, repeats);
    for (let k: number = 1; k <= beats.count; k++)
      course.instants.push({ name: `beat${k}`, seconds: beats.at(k) });
    course.instants.push({ name: "relax", seconds: beats.at(beats.count) });
    return DanceFootwork.compose(
      context.body,
      context.entry.posture,
      {
        ...course,
        hips: DanceFootwork.over(
          context.body,
          context.entry,
          course,
          CROUCH * context.body.measure.stature,
        ),
      },
      { kind: "ground" },
    );
  }
}
