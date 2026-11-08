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

/**
 * The film's sound cues from what actually happened, each bounded to its
 * event and decay: the bell when it rings, the referee's words when he
 * speaks them, an impact for every measured contact (heavier for kicks and
 * the finish, softer for blocks), one effort exhale on each kick, footfalls
 * on the fighters' steps, the canvas landings of the fall, air past the head
 * of an evaded punch, and the crowd as a continuous bed ducked under every
 * spoken word. Effects are capped as game engines cap concurrency: one
 * instance per sound and fighter at a time and a fixed number of
 * foreground cues at once, dropping the least important first. Nothing
 * sounds for a feint or for a decided contact the bodies did not make.
 *
 * ```ts
 * SoundCues.of(filmSeed, schedule, receipts, 180); // [{ asset: "crowd", seconds: 0, gain: 0.3, ... }, ...]
 * ```
 *
 * @evidence docs/body/settings/sound/ring-sound.md#contacts Contacts are heard only when bodies actually meet.
 * @evidence docs/body/settings/sound/ring-sound.md#bell The bell opens the round and rings after the result.
 * @evidence docs/body/settings/sound/ring-sound.md#no-music No music.
 * @evidence docs/body/settings/cast/referee.md#voice His commands and count.
 * @evidence docs/body/settings/cast/fighter-a.md#silent Effort exhales only.
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
  export const BED: string = "crowd";

  /** Linear gain of the bed: an arena murmur well under the contacts (film mix choice, about -9 dB). */
  export const BED_GAIN: number = 0.35;

  /** The bed's gain while a word sounds, as a share of its gain: -18 dB, so a word rises well over 12 dB above it (the research's audibility target). */
  export const DUCK: number = 1 / 8;

  /** Most foreground cues sounding at once, beyond the bed: a game engine's per-group voice limit (Unreal sound concurrency) set for one ring. */
  export const MAX_FOREGROUND: number = 4;

  /** The exhale excerpt of the breath recording: its third burst, from the rise out of the dip at 1.40 s to 30 dB under the file's peak at 2.00 s (measured on the file's 50 ms RMS envelope). */
  export const EXHALE: { offset: number; seconds: number } = {
    offset: 1.4,
    seconds: 0.6,
  };

  /** Audible length of each effect from its onset to 30 dB under its peak, measured on the file's 50 ms RMS envelope, seconds. */
  export const AUDIBLE: Readonly<Record<string, number>> = Object.freeze({
    impact: 0.35,
    step: 0.1,
    air: 0.25,
    fall: 0.3,
  });

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

  /** Impact takes, lightest first: five recorded punches and pad contacts. */
  const IMPACTS: readonly string[] = [
    "punch1",
    "punch2",
    "punch3",
    "punch4",
    "punch5",
  ];

  /** A cue before the cap: its importance (0 is never dropped) and its source, of which one instance sounds at a time. */
  interface ICandidate extends ICue {
    rank: number;
    source?: string;
  }

  /**
   * The cues.
   *
   * @param seed The film seed.
   * @param schedule The schedule.
   * @param receipts The measured contacts.
   * @param duration The film's running time, seconds, which the bed covers.
   * @returns Cues in time order.
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
      length: number = SoundAssets.seconds[asset]!,
      source?: string,
      offset: number = 0,
    ): void => {
      candidates.push({
        asset,
        seconds,
        gain,
        offsetSeconds: offset,
        durationSeconds: length,
        rank,
        ...(source === undefined ? {} : { source }),
      });
    };
    for (const entry of schedule.entries) {
      if (entry.intent.capability === "ring") add("bell", entry.start, 0.9, 0);
      else if (entry.intent.capability === "signal") {
        const action = OfficiatingAction.read(entry.intent);
        const asset: string | undefined =
          action.words === undefined ? undefined : WORDS[action.words];
        if (asset) add(asset, entry.start, 1, 0);
      } else if (entry.intent.capability === "strike") {
        const action = KickboxingAction.read(entry.intent);
        if (action.kind !== "strike") continue;
        const spec: KickboxingTechnique.ISpec =
          KickboxingTechnique.table[action.technique];
        // Effort is heard on the kicks, the whole body's commitment.
        if (!spec.shows && spec.limb === "leg")
          add(
            "breath",
            entry.start,
            0.35,
            2,
            EXHALE.seconds,
            `breath/${entry.subject}`,
            EXHALE.offset,
          );
      } else if (entry.intent.capability === "move") {
        const action = KickboxingAction.read(entry.intent);
        if (action.kind === "move")
          for (let k: number = 0; k < action.steps; k++)
            add(
              "step",
              entry.start +
                ((k + 1) * (entry.end - entry.start)) / action.steps,
              0.25,
              4,
              AUDIBLE.step,
              `step/${entry.subject}`,
            );
      } else if (entry.intent.capability === "phase") {
        const action = KickboxingAction.read(entry.intent);
        if (action.kind === "phase" && action.phase === "fall")
          for (const share of [0.55, 0.8, 1])
            add(
              "fall",
              entry.start + (entry.end - entry.start) * share,
              0.8,
              1,
              AUDIBLE.fall,
            );
      } else if (
        entry.intent.capability === "answer" &&
        entry.outcome === "evaded"
      )
        add(
          "air",
          entry.contact ?? entry.start,
          0.3,
          3,
          AUDIBLE.air,
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
      const landed: boolean = r.outcome === "landed";
      const take: number = heavy
        ? 3 + (random.uint32(0) % 2)
        : random.uint32(0) % 3;
      add(
        IMPACTS[take]!,
        r.seconds,
        (landed ? 0.9 : 0.55) * (spec.disguise !== undefined ? 1.1 : 1),
        1,
        AUDIBLE.impact,
      );
    }
    const foreground: ICue[] = cap(candidates);
    return [...foreground, ...bed(foreground, duration)].sort(
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
   * The most cues sounding at one instant.
   *
   * @param cues Bounded cues.
   * @returns The maximum overlap.
   */
  export function overlap(
    cues: readonly { seconds: number; durationSeconds: number }[],
  ): number {
    const edges: [number, number][] = cues.flatMap(
      (c): [number, number][] => [
        [c.seconds, 1],
        [c.seconds + c.durationSeconds, -1],
      ],
    );
    // Ends sort before starts at one instant: consecutive cues do not overlap.
    edges.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    let now: number = 0;
    let most: number = 0;
    for (const [, d] of edges) {
      now += d;
      most = Math.max(most, now);
    }
    return most;
  }

  /** Keep candidates in time order, dropping a source's new instance while its last still sounds and any droppable cue past the foreground limit. */
  function cap(candidates: ICandidate[]): ICue[] {
    const ordered: ICandidate[] = [...candidates].sort(
      (x, y) => x.seconds - y.seconds || x.rank - y.rank,
    );
    const kept: ICandidate[] = [];
    const sounding = (t: number): ICandidate[] =>
      kept.filter((c) => c.seconds <= t && t < c.seconds + c.durationSeconds);
    for (const c of ordered) {
      const now: ICandidate[] = sounding(c.seconds);
      if (c.rank > 0) {
        if (c.source !== undefined && now.some((k) => k.source === c.source))
          continue;
        if (now.length >= MAX_FOREGROUND) continue;
      }
      kept.push(c);
    }
    return kept.map(({ asset, seconds, gain, offsetSeconds, durationSeconds }) => ({
      asset,
      seconds,
      gain,
      offsetSeconds,
      durationSeconds,
    }));
  }

  /** The bed as consecutive segments over the film: continuing through the recording and wrapping at its end, ducked while a word sounds. */
  function bed(cues: readonly ICue[], duration: number): ICue[] {
    const length: number = SoundAssets.seconds[BED]!;
    const words: [number, number][] = cues
      .filter(spoken)
      .map((c) => [c.seconds, c.seconds + c.durationSeconds]);
    const cuts: number[] = [
      0,
      duration,
      ...words.flat(),
      ...Array.from(
        { length: Math.ceil(duration / length) },
        (_, k) => k * length,
      ),
    ]
      .filter((t) => t >= 0 && t <= duration)
      .sort((x, y) => x - y)
      .filter((t, k, all) => k === 0 || t - all[k - 1]! > 1e-9);
    const segments: ICue[] = [];
    for (let k: number = 0; k + 1 < cuts.length; k++) {
      const start: number = cuts[k]!;
      const end: number = cuts[k + 1]!;
      const ducked: boolean = words.some(([s, e]) => start < e && end > s);
      segments.push({
        asset: BED,
        seconds: start,
        gain: BED_GAIN * (ducked ? DUCK : 1),
        offsetSeconds: start % length,
        durationSeconds: end - start,
      });
    }
    return segments;
  }
}
