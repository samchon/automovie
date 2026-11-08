import {
  type IAutoMovieSchedule,
  createAutoMovieRandom,
  deriveAutoMovieSeed,
} from "@automovie/engine";

import type { ContactReceipts } from "../../interactions/kickboxing/ContactReceipts";
import { KickboxingAction } from "../../laws/kickboxing/KickboxingAction";
import { KickboxingTechnique } from "../../laws/kickboxing/KickboxingTechnique";
import { OfficiatingAction } from "../../laws/officiating/OfficiatingAction";

/**
 * The film's sound cues from what actually happened: the bell when it rings,
 * the referee's words when he speaks them, an impact for every measured
 * contact (heavier for kicks and the finish, softer for blocks), effort
 * breath on the strikes, footfalls on the fighters' steps, the canvas
 * landings of the fall, and air past the head of an evaded punch. Nothing
 * sounds for a feint or for a decided contact the bodies did not make.
 *
 * ```ts
 * SoundCues.of(filmSeed, schedule, receipts); // [{ asset: "bell", seconds: 0, gain: 0.9 }, ...]
 * ```
 *
 * @evidence docs/body/settings/sound/ring-sound.md#contacts Contacts are heard only when bodies actually meet.
 * @evidence docs/body/settings/sound/ring-sound.md#bell The bell opens the round and rings after the result.
 * @evidence docs/body/settings/sound/ring-sound.md#no-music No music.
 * @evidence docs/body/settings/cast/referee.md#voice His commands and count.
 * @evidence docs/body/settings/cast/fighter-a.md#silent Effort exhales only.
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
  }

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

  /**
   * The cues.
   *
   * @param seed The film seed.
   * @param schedule The schedule.
   * @param receipts The measured contacts.
   * @returns Cues in time order.
   */
  export function of(
    seed: string,
    schedule: IAutoMovieSchedule,
    receipts: readonly ContactReceipts.IReceipt[],
  ): ICue[] {
    const cues: ICue[] = [];
    for (const entry of schedule.entries) {
      if (entry.intent.capability === "ring")
        cues.push({ asset: "bell", seconds: entry.start, gain: 0.9 });
      else if (entry.intent.capability === "signal") {
        const action = OfficiatingAction.read(entry.intent);
        const asset: string | undefined =
          action.words === undefined ? undefined : WORDS[action.words];
        if (asset) cues.push({ asset, seconds: entry.start, gain: 1 });
      } else if (entry.intent.capability === "strike") {
        const action = KickboxingAction.read(entry.intent);
        if (
          action.kind === "strike" &&
          !KickboxingTechnique.table[action.technique].shows
        )
          cues.push({ asset: "breath", seconds: entry.start, gain: 0.35 });
      } else if (entry.intent.capability === "move") {
        const action = KickboxingAction.read(entry.intent);
        if (action.kind === "move")
          for (let k: number = 0; k < action.steps; k++)
            cues.push({
              asset: "step",
              seconds:
                entry.start +
                ((k + 1) * (entry.end - entry.start)) / action.steps,
              gain: 0.25,
            });
      } else if (entry.intent.capability === "phase") {
        const action = KickboxingAction.read(entry.intent);
        if (action.kind === "phase" && action.phase === "fall")
          for (const share of [0.55, 0.8, 1])
            cues.push({
              asset: "fall",
              seconds: entry.start + (entry.end - entry.start) * share,
              gain: 0.8,
            });
      } else if (
        entry.intent.capability === "answer" &&
        entry.outcome === "evaded"
      )
        cues.push({
          asset: "air",
          seconds: entry.contact ?? entry.start,
          gain: 0.3,
        });
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
      cues.push({
        asset: IMPACTS[take]!,
        seconds: r.seconds,
        gain: (landed ? 0.9 : 0.55) * (spec.disguise !== undefined ? 1.1 : 1),
      });
    }
    return cues.sort(
      (x, y) => x.seconds - y.seconds || x.asset.localeCompare(y.asset),
    );
  }
}
