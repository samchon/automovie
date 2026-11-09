import type { IAutoMovieIntent, IAutoMovieSchedule } from "@automovie/engine";

import { KickboxingAction } from "../../../../../src/laws/kickboxing/KickboxingAction";
import { OfficiatingAction } from "../../../../../src/laws/officiating/OfficiatingAction";

/**
 * A small hand-placed schedule of every event the sound reads, so the sound
 * units run on known times without resolving the whole bout:
 *
 * - 0: the bell; 0.5: "Fight!".
 * - 10: A's jab, cross and body kick, a three-strike combination ending at 11.5.
 * - 20: B's jab and cross, a two-strike combination ending at 20.8.
 * - 25: A's jab feint, shown to 25.2 but never thrown.
 * - 30: A's four-step press to 32, the same in the same 2 s by B.
 * - 40: B's jab evaded at 40.3; 41: A's cross evaded at 41.3.
 * - 50: B falls to 51.6; "Down!" at 50.2.
 * - 52: B lies to 60; "Neutral corner!" at 53.
 * - 58: the count, "One!" to "Ten!" at 58 to 67.
 * - 67.6: "Knockout! Red wins!"; 68.1: A's victory to 80, celebrating steps 70 to 74.
 * - 70.1: the bell.
 *
 * @returns The schedule.
 */
export function soundSchedule(): IAutoMovieSchedule {
  const entries: IAutoMovieSchedule.IEntry[] = [];
  const add = (
    intent: IAutoMovieIntent,
    start: number,
    end: number,
    extra: { contact?: number; outcome?: string } = {},
  ): void => {
    entries.push({ index: entries.length, subject: intent.subject, intent, start, end, ...extra });
  };
  const bell = (start: number): void =>
    add(
      {
        subject: "bell",
        capability: "ring",
        parameters: { action: { kind: "ring" } },
      },
      start,
      start + 2.1,
    );
  const say = (start: number, signal: "fight" | "down" | "neutral-corner" | "count" | "knockout", words: string): void =>
    add(
      OfficiatingAction.intent("referee", { kind: "signal", signal, seconds: 1, words }),
      start,
      start + 1,
    );
  bell(0);
  say(0.5, "fight", "Fight!");
  add(KickboxingAction.intent("a", { kind: "strike", technique: "jab" }), 10, 10.4, { contact: 10.2 });
  add(KickboxingAction.intent("a", { kind: "strike", technique: "cross", follows: "jab" }), 10.4, 10.9, { contact: 10.65 });
  add(KickboxingAction.intent("a", { kind: "strike", technique: "body-kick", follows: "cross" }), 10.9, 11.5, { contact: 11.2 });
  add(KickboxingAction.intent("b", { kind: "strike", technique: "jab" }), 20, 20.4, { contact: 20.2 });
  add(KickboxingAction.intent("b", { kind: "strike", technique: "cross", follows: "jab" }), 20.4, 20.8, { contact: 20.6 });
  add(KickboxingAction.intent("a", { kind: "strike", technique: "feint-jab" }), 25, 25.4, { contact: 25.2 });
  add(KickboxingAction.intent("a", { kind: "move", movement: "press", steps: 4 }), 30, 32);
  add(KickboxingAction.intent("b", { kind: "move", movement: "give", steps: 4 }), 30, 32);
  add(
    KickboxingAction.intent("a", { kind: "answer", answer: "slip", against: "jab", lead: 0.3, strike: "x" } as KickboxingAction.IAction),
    40,
    40.5,
    { contact: 40.3, outcome: "evaded" },
  );
  add(
    KickboxingAction.intent("b", { kind: "answer", answer: "slip", against: "cross", lead: 0.3, strike: "y" } as KickboxingAction.IAction),
    41,
    41.5,
    { contact: 41.3, outcome: "evaded" },
  );
  add(KickboxingAction.intent("b", { kind: "phase", phase: "fall", seconds: 1.6 }), 50, 51.6);
  say(50.2, "down", "Down!");
  add(KickboxingAction.intent("b", { kind: "phase", phase: "lie", seconds: 8 }), 52, 60);
  say(53, "neutral-corner", "Neutral corner!");
  ["One!", "Two!", "Three!", "Four!", "Five!", "Six!", "Seven!", "Eight!", "Nine!", "Ten!"].forEach(
    (words, k) => say(58 + k, "count", words),
  );
  say(67.6, "knockout", "Knockout! Red wins!");
  add(KickboxingAction.intent("a", { kind: "phase", phase: "victory", seconds: 11.9 }), 68.1, 80);
  add(KickboxingAction.intent("a", { kind: "move", movement: "celebrate", steps: 4 }), 70, 74);
  bell(70.1);
  entries.sort((x, y) => x.start - y.start || x.index - y.index);
  return { entries, duration: 80 };
}
