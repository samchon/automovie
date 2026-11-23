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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three dances, the shared beat, the seeded offset, the joined hands' clock and the events.
 * @evidence contracts/development/design.md#principled-representation A law dispatching each dance to its course over the shared beat clock and footwork.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the crouch and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The offset is the member's seed's; nothing is cloned or hand-tuned per member.
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

  /**
   * Plan a member's part in a group dance.
   *
   * @param context The member's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the tempo, the repeats or the variation is not
   *   admitted, or the dance's own geometry refuses.
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The shared clock offset by the member's draw, the dance's course, its hips over its feet.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Clock, offset, course, hips, composition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The offset stays within the authored band.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work beyond the course's.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The shared beat clock and footwork.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains the course.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGroupDance.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanGroupDance.IParams = context.params;
    const repeats: number = p.repeats ?? 1;
    HumanBound.whole("repeats", repeats);
    const vary: number = p.vary ?? 0.02;
    HumanBound.least("vary", vary, 0, "s");
    const counts: number = (p.kind === "conga" ? 4 : 8) * repeats;
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
