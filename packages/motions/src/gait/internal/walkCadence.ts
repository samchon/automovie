import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanWalkCadence,
  IAutoMovieScheduleCue,
} from "@automovie/interface";

import { HUMAN_ATTRIBUTE_EFFECTS } from "../../ensemble/internal/HUMAN_ATTRIBUTE_EFFECTS";
import { HumanAttribute } from "../../ensemble/internal/HumanAttribute";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanSkill } from "../../skill/internal/HumanSkill";
import { walkTempo } from "../../actions/internal/walkTempo";

/*
 * Heel strikes entrained to a beat track: which beat each strike answers and
 * when it lands, by the linear phase-correction model of sensorimotor
 * synchronisation (Vorberg and Wing 1996, reviewed by Repp 2005, Psychon Bull
 * Rev 12:969).
 *
 * A locked walker's k-th heel strike answers beat `b0 + k`, `b0` set so the
 * cadence's foot strikes first on its `index` beat, or on the beat nearest that
 * strike when no index is given. Its asynchrony, strike minus beat, follows
 * `A(k+1) = (1 - alpha) A(k) + T(k) - C`, with `C` the beat's period, `T(k)`
 * the walker's timer interval (the period drawn with Wing and Kristofferson's
 * timing variability, `HumanSkill.jitter`, which carries the motor part too)
 * and `alpha` the correction gain, discipline's
 * (`HUMAN_ATTRIBUTE_EFFECTS.discipline .correction`). The first strike keeps
 * the plan's own second, so its asynchrony is where the walker set off, and the
 * correction draws the strikes onto the beats from there. Whether a walker
 * locks at all is drawn against discipline's share (`discipline.lock`: 62 % of
 * side-by-side civilian pairs lock step frequency, Nessler and Gilliland 2009;
 * drilled troops all do); one who does not keeps its own tempo. After the
 * track's last beat the steps keep the plan's own times.
 */
export namespace walkCadence {
  /*
   * The action-clock inputs needed by sensorimotor phase correction.
   */
  export type IContext = Pick<
    IAutoMovieMotionHumanActionContext,
    "attributes" | "cue" | "random" | "skill" | "start"
  >;

  /*
   * The named cue track a cadence follows.
   */
  export type ITrack = Pick<IAutoMovieMotionHumanActionContext, "cue">;

  /*
   * The film seconds a walker's heel strikes land at, entrained to a beat
   * track, or null when the walker does not lock.
   * Parameter context: The walk's context: its skill, attributes, cue tracks and
   * draws.
   * Parameter cadence: The beat track and the foot.
   * Parameter strikes: The plan's heel strikes, seconds of the plan, in order, with
   * the foot of each.
   * Returns: The strikes' film seconds, one per planned strike, or null.
   * When the beat's period lies more than
   * `walkTempo.HOLD` from the walk's own step, outside the gait the steps
   * were planned at; and when a phase-corrected step would last no time or
   * twice its planned step or more, which no forward time warp carries.
   */
  export function strikes(
    context: IContext,
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

    // The beat's period against the walk's own step: a beat period C within
    // `walkTempo.HOLD` of the step `own` is 60 / C steps a minute, so the
    // feasible cadences run from 60 / ((1 + HOLD) own) to 60 / ((1 - HOLD) own).
    const C: number = walkCadence.period(beats);
    const own: number =
      (strikes[strikes.length - 1]!.seconds - strikes[0]!.seconds) /
      (strikes.length - 1);
    if (Math.abs(C / own - 1) > walkTempo.HOLD)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "cadence",
        value: 60 / C,
        feasible: {
          kind: "range",
          minimum: Math.ceil(60 / ((1 + walkTempo.HOLD) * own)),
          maximum: Math.floor(60 / ((1 - walkTempo.HOLD) * own)),
          unit: "steps a minute",
        },
        reason: `the beat comes every ${C.toFixed(3)} s and the walk steps every ${own.toFixed(3)} s; a step stretched by more than ${walkTempo.HOLD} of itself leaves its gait`,
        fix: `keep step to a beat within ${walkTempo.HOLD} of the gait's own cadence, or march at the beat's time`,
      });

    // The beat the named foot's first strike answers, the one nearest it when
    // no index is given; the strikes before that one answer the beats before.
    const first: number = context.start + strikes[0]!.seconds;
    const foot: AutoMovieHumanSide = cadence.foot ?? "left";
    const anchor: number = strikes[0]!.side === foot ? 0 : 1;
    const anchored: number = context.start + strikes[anchor]!.seconds;
    const b0: number =
      (cadence.index ??
        beats.reduce(
          (best: number, b: number, i: number): number =>
            Math.abs(b - anchored) < Math.abs(beats[best]! - anchored)
              ? i
              : best,
          0,
        )) - anchor;

    // The asynchronies by linear phase correction, from where the first strike lands.
    const alpha: number = HumanAttribute.effect(
      HUMAN_ATTRIBUTE_EFFECTS.discipline.correction,
      context.attributes?.discipline,
      1,
    );

    // A first strike that answers a beat before the track's first is measured
    // against where that beat would fall at the track's period.
    const out: number[] = [first];
    let A: number = first - (beats[b0] ?? beats[0]! + b0 * C);
    for (let k: number = 1; k < strikes.length; ++k) {
      const planned: number = strikes[k]!.seconds - strikes[k - 1]!.seconds;
      const beat: number | undefined = beats[b0 + k];
      if (beat === undefined || b0 + k < 0) {
        out.push(out[k - 1]! + planned);
        continue;
      }
      const T: number = HumanSkill.jitter(
        context.skill,
        context.random(`cadence:${k}`),
        C,
      );
      A = (1 - alpha) * A + T - C;
      out.push(beat + A);

      // The strikes land where the model puts them; a step the warp cannot
      // carry forward (none, or twice its plan) is a beat the steps cannot reach.
      const step: number = out[k]! - out[k - 1]!;
      if (!(step > 0 && step < 2 * planned))
        throw new HumanRefusal({
          kind: "parameter",
          axis: "cadence.index",
          value: cadence.index ?? b0 + anchor,
          feasible: null,
          reason: `strike ${k} would come ${step.toFixed(3)} s after the one before, where the walk steps every ${planned.toFixed(3)} s: the beat answered first lies too far from where the walker sets off`,
          fix: "name a beat nearer the walker's first strike, or leave the index out so the nearest is taken",
        });
    }
    return out;
  }

  /*
   * A cadence's beats, film seconds: the track's `beat` instants, or every
   * instant of a track that names none.
   * Parameter context: The walk's context.
   * Parameter cadence: The cadence.
   * Returns: The beats in order.
   */
  export function beats(
    context: ITrack,
    cadence: IAutoMovieMotionHumanWalkCadence.ICadence,
  ): number[] {
    const track: readonly IAutoMovieScheduleCue[] = context.cue(cadence.cue);
    const named: readonly IAutoMovieScheduleCue[] = track.filter(
      (c: IAutoMovieScheduleCue): boolean => c.name === "beat",
    );
    return (named.length === 0 ? track : named).map(
      (c: IAutoMovieScheduleCue): number => c.seconds,
    );
  }

  /*
   * A beat track's period: the median interval between its beats, seconds.
   * Parameter beats: The beats, at least two, in order.
   * Returns: The period.
   */
  export function period(beats: readonly number[]): number {
    const intervals: number[] = beats
      .slice(1)
      .map((b: number, i: number): number => b - beats[i]!)
      .sort((a: number, b: number): number => a - b);
    return intervals[intervals.length >> 1]!;
  }
}
