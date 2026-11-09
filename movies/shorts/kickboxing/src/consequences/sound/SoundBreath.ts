import type { IAutoMovieSchedule } from "@automovie/engine";

import { KickboxingAction } from "../../laws/kickboxing/KickboxingAction";
import { KickboxingTechnique } from "../../laws/kickboxing/KickboxingTechnique";

/**
 * Where a fighter's breath is heard: only where the story or the technique
 * motivates it, each time as one short excerpt cut from the breath
 * recording.
 *
 * - The strike exhale: a sharp {@link SoundBreath.STRIKE} hiss through the
 *   mouthguard on every thrown strike, peaking at its contact, as kickboxing
 *   and Muay Thai coaching teaches; a feint is not thrown and has none.
 * - Exertion: one longer {@link SoundBreath.EXHALE} once at the end of a
 *   combination of at least {@link SoundBreath.COMBINATION} strikes, the
 *   striker blowing out after the work.
 * - The knockdown: once when the fallen fighter lands, then every
 *   {@link SoundBreath.LABORED} seconds while he lies or tries to rise.
 * - The celebration: every {@link SoundBreath.EXCITED} seconds while the
 *   winner celebrates.
 *
 * A breath never sounds over a spoken word, so it never masks the referee;
 * the cap keeps one breath per fighter at a time.
 *
 * ```ts
 * SoundBreath.of(schedule, [[158, 158.55]]); // [{ subject: "a", seconds: 10.1, gain: 0.15, offset: 1.44, duration: 0.2 }, ...]
 * ```
 *
 * @evidence docs/body/settings/cast/fighter-a.md#silent Effort exhales only.
 * @evidence docs/research/sound/ring-mix.md#law Breath only where motivated, one excerpt, one per fighter.
 * @evidence docs/research/sound/ring-mix.md#practice Coaches teach a sharp exhale on every strike.
 */
export namespace SoundBreath {
  /** One motivated breath. */
  export interface IBreath {
    /** The breathing fighter's id. */
    subject: string;

    /** Onset, film seconds. */
    seconds: number;

    /** Linear gain. */
    gain: number;

    /** Source offset of the excerpt, seconds. */
    offset: number;

    /** Length of the excerpt, seconds. */
    duration: number;
  }

  /** An excerpt of the breath recording. */
  export interface IExcerpt {
    /** Source offset, seconds. */
    offset: number;

    /** Length, seconds. */
    seconds: number;
  }

  /**
   * The exhale excerpt of the breath recording: its third burst, from the
   * rise out of the dip at 1.40 s to 30 dB under the file's peak at 2.00 s,
   * measured on the file's 50 ms RMS envelope.
   */
  export const EXHALE: Readonly<IExcerpt> = Object.freeze({
    offset: 1.4,
    seconds: 0.6,
  });

  /**
   * The strike hiss: the front of the same burst, from its onset out of the
   * dip at 1.44 s through its -13 dB peak at 1.54 s to where it has fallen
   * 6 dB under that peak at 1.64 s, measured on the file's 10 ms RMS
   * envelope. `peak` is the seconds from the excerpt's start to its peak,
   * which lands on the strike's contact.
   */
  export const STRIKE: Readonly<IExcerpt & { peak: number }> = Object.freeze({
    offset: 1.44,
    seconds: 0.2,
    peak: 0.1,
  });

  /** Fewest strikes in a combination that earns an exertion breath: a three-strike combination. */
  export const COMBINATION: number = 3;

  /** Seconds between breaths of a fighter lying or trying to rise: about 24 breaths a minute, laboured. */
  export const LABORED: number = 2.5;

  /** Seconds between breaths of the celebrating winner: 60 a minute, excited. */
  export const EXCITED: number = 1;

  /** Gain of the strike hiss, about -16.5 dB: 15 dB under a landed impact, felt rather than heard. */
  export const STRIKE_GAIN: number = 0.15;

  /** Gain of an exertion exhale, about -9 dB: under the impacts. */
  export const EXERTION_GAIN: number = 0.35;

  /** Gain of the fallen fighter's breath, about -10 dB. */
  export const KNOCKDOWN_GAIN: number = 0.3;

  /** Gain of the winner's excited breath, about -7 dB: "loud" in the screenplay. */
  export const VICTORY_GAIN: number = 0.45;

  /**
   * The motivated breaths.
   *
   * @param schedule The schedule.
   * @param words Each spoken word's onset and end, seconds.
   * @returns Breaths in time order.
   */
  export function of(
    schedule: IAutoMovieSchedule,
    words: readonly (readonly [number, number])[],
  ): IBreath[] {
    const breaths: IBreath[] = [];
    const add = (
      subject: string,
      seconds: number,
      gain: number,
      excerpt: IExcerpt = EXHALE,
    ): void => {
      if (
        !words.some(([s, e]) => seconds < e && seconds + excerpt.seconds > s)
      )
        breaths.push({
          subject,
          seconds,
          gain,
          offset: excerpt.offset,
          duration: excerpt.seconds,
        });
    };
    const every = (
      entry: IAutoMovieSchedule.IEntry,
      period: number,
      gain: number,
    ): void => {
      for (
        let t: number = entry.start;
        t + EXHALE.seconds <= entry.end + 1e-9;
        t += period
      )
        add(entry.subject, t, gain);
    };
    // The strike hiss of a thrown strike: its peak on the contact.
    const hiss = (entry: IAutoMovieSchedule.IEntry): number =>
      Math.max(0, (entry.contact ?? entry.end) - STRIKE.peak);
    // Each fighter's strikes: a combination continues while a strike follows.
    const chains: Record<string, IAutoMovieSchedule.IEntry[]> = {};
    for (const entry of schedule.entries) {
      if (entry.intent.capability === "strike") {
        const action = KickboxingAction.read(entry.intent);
        if (action.kind !== "strike") continue;
        if (KickboxingTechnique.table[action.technique].shows === undefined)
          add(entry.subject, hiss(entry), STRIKE_GAIN, STRIKE);
        const chain: IAutoMovieSchedule.IEntry[] =
          action.follows !== undefined ? (chains[entry.subject] ?? []) : [];
        if (action.follows === undefined) flush(chains[entry.subject]);
        chains[entry.subject] = [...chain, entry];
      } else if (entry.intent.capability === "phase") {
        const action = KickboxingAction.read(entry.intent);
        if (action.kind !== "phase") continue;
        if (action.phase === "fall")
          add(entry.subject, entry.end, KNOCKDOWN_GAIN);
        else if (action.phase === "lie" || action.phase === "attempt")
          every(entry, LABORED, KNOCKDOWN_GAIN);
        else if (action.phase === "victory")
          every(entry, EXCITED, VICTORY_GAIN);
      } else if (entry.intent.capability === "move") {
        const action = KickboxingAction.read(entry.intent);
        if (action.kind === "move" && action.movement === "celebrate")
          every(entry, EXCITED, VICTORY_GAIN);
      }
    }
    for (const chain of Object.values(chains)) flush(chain);
    return breaths.sort((x, y) => x.seconds - y.seconds);

    // The exertion exhale follows the last strike, after its hiss ends.
    function flush(chain: IAutoMovieSchedule.IEntry[] | undefined): void {
      if (chain !== undefined && chain.length >= COMBINATION) {
        const last: IAutoMovieSchedule.IEntry = chain.at(-1)!;
        add(
          last.subject,
          Math.max(last.end, hiss(last) + STRIKE.seconds),
          EXERTION_GAIN,
        );
      }
    }
  }
}
