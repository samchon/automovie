import { createAutoMovieRandom, deriveAutoMovieSeed } from "@automovie/engine";
import type { IAutoMovieMotionHumanConversation } from "@automovie/interface";
import { AutoMovieMotionHumanConversation } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../features/internal/throwsError";

/**
 * Conversation gaze looks at the partner more while listening than while
 * speaking, at the shares Acarturk et al. 2021 measured, and starts each
 * turn looking at the partner.
 *
 * Scenarios:
 * 1. Over 200 seeds of a single speaker change between two 30-second
 *    turns, the mean share of listening time on the partner's face is
 *    3.89 / (3.89 + 0.29) and of speaking time 1.82 / (1.82 + 0.83), each
 *    within 20 % (the campaign's distribution tolerance).
 * 2. Every turn's first request looks at the partner's face.
 * 3. Requests are in time order; every listener's look away aims below the
 *    eyes (a diagonal aversion) and every look away turns the gaze by the
 *    eyes' own share of a gaze shift.
 * 4. The same stream gives the same requests; a turn that ends before it
 *    starts is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds gaze requests for many seeds and measures the time on the partner per role; wrong shares, a turn starting away, unordered requests, a listener's look away above the eyes or a look away of another angle fails.
 * @evidence contracts/development/testing.md#independent-expectations The shares are Acarturk et al. 2021's mean face and away durations (J Eye Mov Res 14(1):1, Table 3: the listening interviewer 3.89 s on and 0.29 s away, the speaking interviewee 1.82 s and 0.83 s), which replace the older observational 75 % and 40 % of Kendon 1967 and Argyle and Cook 1976; the listener's diagonal aversion is that study's; 15 degrees is the eyes' share of a gaze shift (Freedman 2008); 20 % is the campaign's tolerance for 200-seed distributions.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both roles, turn boundaries, determinism and an invalid turn; the posed gaze accuracy is owned by the local look test.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 scenarios and what each pins.
 */
export function test_motion_conversation_gaze(): void {
  const turns: IAutoMovieMotionHumanConversation.ITurn[] = Array.from(
    { length: 2 },
    (_: unknown, i: number): IAutoMovieMotionHumanConversation.ITurn => ({
      speaker: i % 2 === 0 ? "a" : "b",
      from: 30 * i,
      to: 30 * (i + 1),
    }),
  );
  let speaking: number = 0;
  let listening: number = 0;
  for (let seed: number = 0; seed < 200; seed++) {
    const requests = AutoMovieMotionHumanConversation.gaze({
      subject: "a",
      partner: "b",
      turns,
      random: createAutoMovieRandom(deriveAutoMovieSeed("talk", String(seed))),
      eyes: 1.6,
    });
    for (const turn of turns) {
      const share: number = AutoMovieMotionHumanConversation.share({
        requests,
        from: turn.from,
        to: turn.to,
      });
      if (turn.speaker === "a") speaking += share;
      else listening += share;
    }
    if (seed === 0) {
      TestValidator.predicate(
        "turns start on the partner",
        turns.every(
          (turn) =>
            requests.find((r) => r.from === turn.from)?.target.kind ===
            "person",
        ),
      );
      TestValidator.predicate(
        "requests ordered",
        requests.every((r, i) => i === 0 || r.from >= requests[i - 1]!.from),
      );
      TestValidator.predicate(
        "a listener looks away below the eyes",
        requests.every(
          (r) =>
            r.target.kind !== "point" ||
            turns.find((turn) => turn.from <= r.from && r.from < turn.to)!
              .speaker === "a" ||
            r.target.at.y < 1.6,
        ),
      );
      TestValidator.predicate(
        "a look away turns the gaze by the eyes' share",
        requests.every((r) => {
          if (r.target.kind !== "point") return true;
          const at = r.target.at;
          const angle: number =
            (Math.acos(at.z / Math.hypot(at.x, at.y - 1.6, at.z)) * 180) /
            Math.PI;
          return Math.abs(angle - 15) < 1e-9;
        }),
      );
      const again = AutoMovieMotionHumanConversation.gaze({
        subject: "a",
        partner: "b",
        turns,
        random: createAutoMovieRandom(deriveAutoMovieSeed("talk", "0")),
        eyes: 1.6,
      });
      TestValidator.predicate(
        "deterministic",
        JSON.stringify(again) === JSON.stringify(requests),
      );
    }
  }
  speaking /= 200;
  listening /= 200;
  const listened: number = 3.89 / (3.89 + 0.29);
  const spoken: number = 1.82 / (1.82 + 0.83);
  TestValidator.predicate(
    `listening share ${listening.toFixed(3)} near ${listened.toFixed(3)}`,
    Math.abs(listening / listened - 1) < 0.2,
  );
  TestValidator.predicate(
    `speaking share ${speaking.toFixed(3)} near ${spoken.toFixed(3)}`,
    Math.abs(speaking / spoken - 1) < 0.2,
  );
  TestValidator.predicate(
    "a backward turn is refused",
    throwsError((): unknown =>
      AutoMovieMotionHumanConversation.gaze({
        subject: "a",
        partner: "b",
        turns: [{ speaker: "a", from: 2, to: 1 }],
        random: createAutoMovieRandom(deriveAutoMovieSeed("x")),
        eyes: 1.6,
      }),
    ),
  );
}
