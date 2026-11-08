import {
  createAutoMovieRandom,
  deriveAutoMovieSeed,
  type IAutoMovieSchedule,
} from "@automovie/engine";

import type { ContactReceipts } from "../../interactions/kickboxing/ContactReceipts";
import { KickboxingAction } from "../../laws/kickboxing/KickboxingAction";
import { KickboxingTechnique } from "../../laws/kickboxing/KickboxingTechnique";
import { OfficiatingAction } from "../../laws/officiating/OfficiatingAction";
import { SoundAssets } from "./SoundAssets";
import { SoundBed } from "./SoundBed";
import { SoundBreath } from "./SoundBreath";
import { SoundConcurrency } from "./SoundConcurrency";

/**
 * The film's sound cues from what actually happened, each bounded to its
 * event and audible decay: the bell when it rings, the referee's words when
 * he speaks them, an impact for every measured contact (heavier for kicks
 * and the finish, softer for blocks), footfalls on the fighters' steps, the
 * canvas landings of the fall, air past the head of an evaded strike, the
 * motivated breaths of {@link SoundBreath}, and the crowd bed of
 * {@link SoundBed}, ducked under every word and raised for the knockout and
 * the celebration. {@link SoundConcurrency} caps the one-shots. Nothing
 * sounds for a feint or for a decided contact the bodies did not make.
 *
 * ```ts
 * SoundCues.of(filmSeed, schedule, receipts, 180); // [{ asset: "crowd", seconds: 0, gain: 0.35, ... }, ...]
 * ```
 *
 * @evidence docs/body/settings/sound/ring-sound.md#contacts Contacts are heard only when bodies actually meet.
 * @evidence docs/body/settings/sound/ring-sound.md#bell The bell opens the round and rings after the result.
 * @evidence docs/body/settings/sound/ring-sound.md#no-music No music.
 * @evidence docs/body/settings/cast/referee.md#voice His commands and count.
 * @evidence docs/research/sound/ring-mix.md#law Cues bounded to their events, capped concurrency and the bed ducked under speech.
 */
export namespace SoundCues {
  /** One cue in the render and viewer audio form. */
  export interface ICue {
    /** Asset id. */
    asset: string;

    /** Onset, film seconds. */
    seconds: number;

    /** Linear gain. */
    gain: number;

    /** Source offset, seconds. */
    offsetSeconds: number;

    /** Output duration, seconds: the event and its decay. */
    durationSeconds: number;
  }

  /** The bed asset: the arena crowd under everything. */
  export const BED: string = SoundBed.ASSET;

  /** Gain of the bell, about -1 dB. */
  export const BELL_GAIN: number = 0.9;

  /** Gain of a spoken word: the recording as made. */
  export const WORD_GAIN: number = 1;

  /** Gain of a landed impact, about -1 dB; a blocked one is {@link BLOCKED_GAIN}. */
  export const LANDED_GAIN: number = 0.9;

  /** Gain of a blocked impact, about -5 dB. */
  export const BLOCKED_GAIN: number = 0.55;

  /** Extra share for a disguised technique such as the finish: +0.8 dB. */
  export const DISGUISE_BOOST: number = 1.1;

  /** Gain of a footfall, -12 dB: under the contacts. */
  export const STEP_GAIN: number = 0.25;

  /** Gain of a canvas landing, about -2 dB. */
  export const FALL_GAIN: number = 0.8;

  /** Gain of air past a head, about -10 dB. */
  export const AIR_GAIN: number = 0.3;

  /** Shares of a fall at which the hip, shoulder and head land. */
  export const LANDINGS: readonly number[] = Object.freeze([0.55, 0.8, 1]);

  /** The asset of each spoken command. */
  const WORDS: Readonly<Record<string, string>> = {
    "Fight!": "fight",
    "Down!": "down",
    "Neutral corner!": "neutral",
    "Knockout! Red wins!": "decision",
    "One!": "count1",
    "Two!": "count2",
    "Three!": "count3",
    "Four!": "count4",
    "Five!": "count5",
    "Six!": "count6",
    "Seven!": "count7",
    "Eight!": "count8",
    "Nine!": "count9",
    "Ten!": "count10",
  };

  /** Impact takes, lightest first. */
  const IMPACTS: readonly string[] = [
    "punch1",
    "punch2",
    "punch3",
    "punch4",
    "punch5",
  ];

  /** A cue before the cap. */
  interface ICandidate extends ICue, SoundConcurrency.ICandidate {}

  /**
   * The cues.
   *
   * @param seed The film seed.
   * @param schedule The schedule.
   * @param receipts The measured contacts.
   * @param duration The film's running time, seconds, which the bed covers.
   * @returns Cues in time order, none past `duration`.
   */
  export function of(
    seed: string,
    schedule: IAutoMovieSchedule,
    receipts: readonly ContactReceipts.IReceipt[],
    duration: number,
  ): ICue[] {
    const candidates: ICandidate[] = [];
    const add = (
      asset: string,
      seconds: number,
      gain: number,
      rank: number,
      source?: string,
      offset: number = 0,
      length: number = SoundAssets.audible[asset]!,
    ): void => {
      if (!(seconds >= 0 && seconds < duration)) return;
      candidates.push({
        asset,
        seconds,
        gain,
        offsetSeconds: offset,
        durationSeconds: Math.min(length, duration - seconds),
        rank,
        ...(source === undefined ? {} : { source }),
      });
    };
    const raised: [number, number][] = [];
    for (const entry of schedule.entries) {
      if (entry.intent.capability === "ring")
        add("bell", entry.start, BELL_GAIN, 0);
      else if (entry.intent.capability === "signal") {
        const words: string | undefined = OfficiatingAction.read(
          entry.intent,
        ).words;
        const asset: string | undefined =
          words === undefined ? undefined : WORDS[words];
        if (asset) add(asset, entry.start, WORD_GAIN, 0);
      } else if (entry.intent.capability === "move") {
        const action = KickboxingAction.read(entry.intent);
        if (action.kind !== "move") continue;
        for (let k: number = 1; k <= action.steps; k++)
          add(
            "step",
            entry.start + (k * (entry.end - entry.start)) / action.steps,
            STEP_GAIN,
            4,
            `step/${entry.subject}`,
          );
        if (action.movement === "celebrate") raised.push([entry.start, entry.end]);
      } else if (entry.intent.capability === "phase") {
        const action = KickboxingAction.read(entry.intent);
        if (action.kind !== "phase") continue;
        if (action.phase === "fall") {
          for (const share of LANDINGS)
            add(
              "fall",
              entry.start + (entry.end - entry.start) * share,
              FALL_GAIN,
              1,
            );
          raised.push([entry.start, entry.end + SoundBed.ROAR]);
        } else if (action.phase === "victory")
          raised.push([entry.start, entry.end]);
      } else if (
        entry.intent.capability === "answer" &&
        entry.outcome === "evaded"
      )
        add(
          "air",
          entry.contact ?? entry.start,
          AIR_GAIN,
          3,
          `air/${entry.subject}`,
        );
    }
    for (const r of receipts) {
      if (!r.contact) continue;
      const spec: KickboxingTechnique.ISpec =
        KickboxingTechnique.table[r.technique];
      const random = createAutoMovieRandom(
        deriveAutoMovieSeed(seed, "impact", r.anchor),
      );
      const heavy: boolean = spec.limb === "leg" || spec.disguise !== undefined;
      const take: number = heavy
        ? 3 + (random.uint32(0) % 2)
        : random.uint32(0) % 3;
      add(
        IMPACTS[take]!,
        r.seconds,
        (r.outcome === "landed" ? LANDED_GAIN : BLOCKED_GAIN) *
          (spec.disguise !== undefined ? DISGUISE_BOOST : 1),
        1,
      );
    }
    const words: [number, number][] = candidates
      .filter(spoken)
      .map((c) => [c.seconds, c.seconds + c.durationSeconds]);
    for (const b of SoundBreath.of(schedule, words))
      add(
        "breath",
        b.seconds,
        b.gain,
        2,
        `breath/${b.subject}`,
        SoundBreath.EXHALE.offset,
        SoundBreath.EXHALE.seconds,
      );
    const foreground: ICue[] = SoundConcurrency.cap(candidates).map(
      ({ asset, seconds, gain, offsetSeconds, durationSeconds }) => ({
        asset,
        seconds,
        gain,
        offsetSeconds,
        durationSeconds,
      }),
    );
    return [...foreground, ...SoundBed.of(duration, words, raised)].sort(
      (x, y) => x.seconds - y.seconds || x.asset.localeCompare(y.asset),
    );
  }

  /**
   * Whether a cue is a spoken word of the referee.
   *
   * @param cue A cue.
   * @returns True for a command or count word.
   */
  export function spoken(cue: { asset: string }): boolean {
    return Object.values(WORDS).includes(cue.asset);
  }

  /**
   * The most cues sounding at one instant, as {@link SoundConcurrency.overlap}.
   *
   * @param cues Bounded cues.
   * @returns The maximum overlap.
   */
  export function overlap(
    cues: readonly { seconds: number; durationSeconds: number }[],
  ): number {
    return SoundConcurrency.overlap(cues);
  }
}
