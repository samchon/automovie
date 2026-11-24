import { createAutoMovieRandom, deriveAutoMovieSeed } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanConversation,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  conversationGaze,
  conversationShare,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/** The eyes' height the looks away are read from, metres. */
const EYES: number = 1.6;

/** The seeds the shares are averaged over. */
const SEEDS: number = 200;

/** The distribution tolerance on a mean share. */
const SHARE: number = 0.2;

/** How far a look away turns the gaze, degrees: the eyes' share of a shift. */
const AWAY: number = 15;

/**
 * `conversationGaze` looks at the partner more while listening than while
 * speaking, at the shares Acarturk et al. 2021 measured, and starts each turn
 * looking at the partner.
 *
 * Scenarios, a speaker change between two 30-second turns:
 *
 * 1. Over 200 seeds the mean share of listening time on the partner's face is 3.89
 *    / (3.89 + 0.29) and of speaking time 1.82 / (1.82 + 0.83), each within 20
 *    %.
 * 2. Every turn's first request looks at the partner.
 * 3. Requests are in time order; a listener's look away aims below the eyes, and
 *    every look away turns the gaze by 15 degrees.
 * 4. The same stream gives the same requests; a turn that ends before it starts is
 *    refused.
 */
export function test_unit_motions_everyday_conversation_gaze(): void {
  const turns: IAutoMovieMotionHumanConversation.ITurn[] = [
    { speaker: "a", from: 0, to: 30 },
    { speaker: "b", from: 30, to: 60 },
  ];
  const gaze: (seed: string) => ReturnType<typeof conversationGaze> = (
    seed: string,
  ): ReturnType<typeof conversationGaze> =>
    conversationGaze({
      subject: "a",
      partner: "b",
      turns,
      random: createAutoMovieRandom(deriveAutoMovieSeed("talk", seed)),
      eyes: EYES,
    });
  let speaking: number = 0;
  let listening: number = 0;
  for (let seed: number = 0; seed < SEEDS; seed++) {
    const requests: ReturnType<typeof conversationGaze> = gaze(String(seed));
    for (const turn of turns) {
      const share: number = conversationShare({
        requests,
        from: turn.from,
        to: turn.to,
      });
      if (turn.speaker === "a") speaking += share;
      else listening += share;
    }
  }
  const listened: number = 3.89 / (3.89 + 0.29);
  const spoken: number = 1.82 / (1.82 + 0.83);
  TestValidator.predicate(
    `listening share ${listening / SEEDS}`,
    Math.abs(listening / SEEDS / listened - 1) < SHARE,
  );
  TestValidator.predicate(
    `speaking share ${speaking / SEEDS}`,
    Math.abs(speaking / SEEDS / spoken - 1) < SHARE,
  );

  const requests: ReturnType<typeof conversationGaze> = gaze("0");
  type Request = (typeof requests)[number];
  TestValidator.predicate(
    "turns start on the partner",
    turns.every(
      (turn: IAutoMovieMotionHumanConversation.ITurn): boolean =>
        requests.find((r: Request): boolean => r.from === turn.from)?.target
          .kind === "person",
    ),
  );
  TestValidator.predicate(
    "requests ordered",
    requests.every(
      (r: Request, i: number): boolean =>
        i === 0 || r.from >= requests[i - 1]!.from,
    ),
  );
  TestValidator.predicate(
    "a listener looks away below the eyes",
    requests.every(
      (r: Request): boolean =>
        r.target.kind !== "point" ||
        turns.find(
          (turn: IAutoMovieMotionHumanConversation.ITurn): boolean =>
            turn.from <= r.from && r.from < turn.to,
        )!.speaker === "a" ||
        r.target.at.y < EYES,
    ),
  );
  TestValidator.predicate(
    "a look away turns the gaze by the eyes' share",
    requests.every((r: Request): boolean => {
      if (r.target.kind !== "point") return true;
      const at: IAutoMovieVector3 = r.target.at;
      const angle: number =
        (Math.acos(at.z / Math.hypot(at.x, at.y - EYES, at.z)) * 180) / Math.PI;
      return Math.abs(angle - AWAY) < 1e-9;
    }),
  );
  TestValidator.equals("deterministic", gaze("0"), requests);
  TestValidator.predicate(
    "a backward turn is refused",
    throwsError((): unknown =>
      conversationGaze({
        subject: "a",
        partner: "b",
        turns: [{ speaker: "a", from: 2, to: 1 }],
        random: createAutoMovieRandom(deriveAutoMovieSeed("x")),
        eyes: EYES,
      }),
    ),
  );
}
