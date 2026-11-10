import { createAutoMovieRandom, deriveAutoMovieSeed } from "@automovie/engine";
import { HumanConversation } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * Conversation gaze looks at the partner more while listening than while
 * speaking, at the shares Kendon and Argyle and Cook measured, and starts
 * each turn looking at the partner.
 *
 * Scenarios:
 * 1. Over 200 seeds of a 10-minute conversation in 20 alternating 30-second
 *    turns, the mean share of listening time on the partner's face is 0.75
 *    and of speaking time 0.40, each within 20 % (the campaign's
 *    distribution tolerance).
 * 2. Every turn's first request looks at the partner's face.
 * 3. Requests are in time order and every look away aims below the eyes.
 * 4. The same stream gives the same requests; a turn that ends before it
 *    starts is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds gaze requests for many seeds and measures the time on the partner per role; wrong shares, a turn starting away, unordered requests or a look away above the eyes fails.
 * @evidence contracts/development/testing.md#independent-expectations The 75 % and 40 % shares are Kendon 1967 and Argyle and Cook 1976; 20 % is the campaign's tolerance for 200-seed distributions.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both roles, turn boundaries, determinism and an invalid turn; the posed gaze accuracy is owned by the local look test.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 scenarios and what each pins.
 */
export function test_motion_everyday_conversation(): void {
  const turns: HumanConversation.ITurn[] = Array.from(
    { length: 20 },
    (_: unknown, i: number): HumanConversation.ITurn => ({
      speaker: i % 2 === 0 ? "a" : "b",
      from: 30 * i,
      to: 30 * (i + 1),
    }),
  );
  let speaking: number = 0;
  let listening: number = 0;
  for (let seed: number = 0; seed < 200; seed++) {
    const requests = HumanConversation.gaze(
      "a",
      "b",
      turns,
      createAutoMovieRandom(deriveAutoMovieSeed("talk", String(seed))),
      1.6,
    );
    for (const turn of turns) {
      const share: number = HumanConversation.share(
        requests,
        turn.from,
        turn.to,
      );
      if (turn.speaker === "a") speaking += share / 10;
      else listening += share / 10;
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
        "looks away below the eyes",
        requests.every((r) => r.target.kind !== "point" || r.target.at.y < 1.6),
      );
      const again = HumanConversation.gaze(
        "a",
        "b",
        turns,
        createAutoMovieRandom(deriveAutoMovieSeed("talk", "0")),
        1.6,
      );
      TestValidator.predicate(
        "deterministic",
        JSON.stringify(again) === JSON.stringify(requests),
      );
    }
  }
  speaking /= 200;
  listening /= 200;
  TestValidator.predicate(
    `listening share ${listening.toFixed(3)} near 0.75`,
    Math.abs(listening / 0.75 - 1) < 0.2,
  );
  TestValidator.predicate(
    `speaking share ${speaking.toFixed(3)} near 0.40`,
    Math.abs(speaking / 0.4 - 1) < 0.2,
  );
  TestValidator.error("a backward turn is refused", (): unknown =>
    HumanConversation.gaze(
      "a",
      "b",
      [{ speaker: "a", from: 2, to: 1 }],
      createAutoMovieRandom(deriveAutoMovieSeed("x")),
      1.6,
    ),
  );
}
