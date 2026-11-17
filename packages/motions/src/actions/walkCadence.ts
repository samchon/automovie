import type { IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanWalkCadence, IAutoMovieResolveSchedule } from "@automovie/interface";

import { HUMAN_ATTRIBUTE_EFFECTS } from "../ensemble/HUMAN_ATTRIBUTE_EFFECTS";
import { HumanAttribute } from "../ensemble/HumanAttribute";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanSkill } from "../skill/HumanSkill";

/**
 * Heel strikes entrained to a beat track: which beat each strike answers and
 * when it lands, by the linear phase-correction model of sensorimotor
 * synchronisation (Vorberg and Wing 1996, reviewed by Repp 2005, Psychon
 * Bull Rev 12:969).
 *
 * A locked walker's k-th heel strike answers beat `b0 + k`. Its asynchrony,
 * strike minus beat, follows `A(k+1) = (1 - alpha) A(k) + T(k) - C`, with
 * `C` the beat's period, `T(k)` the walker's timer interval (the period
 * drawn with Wing and Kristofferson's timing variability,
 * `HumanSkill.jitter`, which carries the motor part too) and `alpha` the
 * correction gain, discipline's (`HUMAN_ATTRIBUTE_EFFECTS.discipline
 * .correction`). The first strike keeps the plan's own second, so its
 * asynchrony is where the walker set off, and the correction draws the
 * strikes onto the beats from there. Whether a walker locks at all is drawn
 * against discipline's share (`discipline.lock`: 62 % of side-by-side
 * civilian pairs lock step frequency, Nessler and Gilliland 2009; drilled
 * troops all do); one who does not keeps its own tempo. After the track's
 * last beat the steps keep the plan's own times.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the model, its terms and sources, the first strike, the lock and what follows the track.
 * @evidence contracts/development/design.md#principled-representation The beat track is the schedule's own cue list; the cadence is a track's name, the striking foot and a beat index.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `strikes`, returning the strikes' seconds, its parameter type, and the track's `beats` and `period` the march also reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No strike is snapped onto its beat: each lands where the model puts it.
 */
export namespace walkCadence {

  /**
   * The film seconds a walker's heel strikes land at, entrained to a beat
   * track, or null when the walker does not lock.
   *
   * @param context The walk's context: its skill, attributes, cue tracks and draws.
   * @param cadence The beat track and the foot.
   * @param strikes The plan's heel strikes, seconds of the plan, in order, with the foot of each.
   * @returns The strikes' film seconds, one per planned strike, or null.
   * @throws {HumanRefusal} When the beat's period lies more than a fifth from the walk's own step, which the time warp cannot carry.
   */
  export function strikes(
    context: IAutoMovieMotionHumanActionContext,
    cadence: IAutoMovieMotionHumanWalkCadence.ICadence,
    strikes: IAutoMovieMotionHumanWalkCadence.IStrikesStrikes,
  ): number[] | null {
    if (strikes.length < 2) return null;
    const lock: number = HumanAttribute.effect(
      HUMAN_ATTRIBUTE_EFFECTS.discipline.lock,
      context.attributes?.discipline,
      1,
    );
    if (context.random("cadence:lock").float(0) >= lock) return null;
    const beats: number[] = walkCadence.beats(context, cadence);
    if (beats.length < 2) return null;

    // The beat's period against the walk's own step.
    const C: number = walkCadence.period(beats);
    const own: number =
      (strikes[strikes.length - 1]!.seconds - strikes[0]!.seconds) /
      (strikes.length - 1);
    if (Math.abs(C / own - 1) > 0.2)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "cadence",
        value: 60 / C,
        feasible: {
          kind: "range",
          minimum: Math.ceil(48 / own),
          maximum: Math.floor(72 / own),
          unit: "steps a minute",
        },
        reason: `the beat comes every ${C.toFixed(3)} s and the walk steps every ${own.toFixed(3)} s; a step stretched by more than a fifth leaves its gait`,
        fix: "keep step to a beat within a fifth of the gait's own cadence, or march at the beat's time",
      });

    // The beat the first strike answers.
    const first: number = context.start + strikes[0]!.seconds;
    const foot: "left" | "right" = cadence.foot ?? "left";
    let b0: number =
      cadence.index ??
      beats.reduce(
        (best: number, b: number, i: number): number =>
          Math.abs(b - first) < Math.abs(beats[best]! - first) ? i : best,
        0,
      );
    if (cadence.index !== undefined && strikes[0]!.side !== foot) b0 -= 1;

    // The asynchronies by linear phase correction, from where the first strike lands.
    const alpha: number = HumanAttribute.effect(
      HUMAN_ATTRIBUTE_EFFECTS.discipline.correction,
      context.attributes?.discipline,
      1,
    );
    const out: number[] = [first];
    let A: number = first - (beats[b0] ?? first);
    for (let k: number = 1; k < strikes.length; ++k) {
      const beat: number | undefined = beats[b0 + k];
      if (beat === undefined || b0 + k < 0) {
        out.push(out[k - 1]! + (strikes[k]!.seconds - strikes[k - 1]!.seconds));
        continue;
      }
      const T: number = HumanSkill.jitter(
        context.skill,
        context.random(`cadence:${k}`),
        C,
      );
      A = (1 - alpha) * A + T - C;
      out.push(beat + A);
    }
    return out;
  }

  /**
   * A cadence's beats, film seconds: the track's `beat` instants, or every
   * instant of a track that names none.
   *
   * @param context The walk's context.
   * @param cadence The cadence.
   * @returns The beats in order.
   */
  export function beats(
    context: IAutoMovieMotionHumanActionContext,
    cadence: IAutoMovieMotionHumanWalkCadence.ICadence,
  ): number[] {
    const track: readonly IAutoMovieResolveSchedule.ICue[] = context.cue(
      cadence.cue,
    );
    const named: readonly IAutoMovieResolveSchedule.ICue[] = track.filter(
      (c: IAutoMovieResolveSchedule.ICue): boolean => c.name === "beat",
    );
    return (named.length === 0 ? track : named).map(
      (c: IAutoMovieResolveSchedule.ICue): number => c.seconds,
    );
  }

  /**
   * A beat track's period: the median interval between its beats, seconds.
   *
   * @param beats The beats, at least two, in order.
   * @returns The period.
   */
  export function period(beats: readonly number[]): number {
    const intervals: number[] = beats
      .slice(1)
      .map((b: number, i: number): number => b - beats[i]!)
      .sort((a: number, b: number): number => a - b);
    return intervals[intervals.length >> 1]!;
  }
}
