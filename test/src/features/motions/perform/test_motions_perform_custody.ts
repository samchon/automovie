import type { IAutoMovieMotionHumanPerformanceState } from "@automovie/interface";
import { HumanPerformanceCustody } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `HumanPerformanceCustody` picks who carries a prop at a second from its
 * sorted grip spans: the latest grip still holding it; the same performer's
 * other hand only steadies it; with none holding, the one released last left
 * it; and `since` is the last closure strictly before the second.
 *
 * Scenarios:
 *
 * 1. A grip closing exactly at the second does not carry yet: the prop is where
 *    the previous carrier, released at 1 s, left it.
 * 2. Inside two hands of one performer, the later is the steadying hand.
 * 3. Another performer's later grip takes the prop over (a handover).
 * 4. After every release, the last to let go left it.
 * 5. A socket grip closing at the second carries there only when asked.
 */
export function test_motions_perform_custody(): void {
  const grip = (
    subject: string,
    side: "left" | "right",
    from: number,
    to: number,
  ): IAutoMovieMotionHumanPerformanceState.IGrip => ({
    subject,
    side,
    from,
    to,
  });
  const first: IAutoMovieMotionHumanPerformanceState.IGrip = grip(
    "ann",
    "right",
    0,
    1,
  );
  const second: IAutoMovieMotionHumanPerformanceState.IGrip = grip(
    "ann",
    "left",
    0.5,
    2,
  );
  const third: IAutoMovieMotionHumanPerformanceState.IGrip = grip(
    "bob",
    "right",
    1.5,
    3,
  );
  const grips: readonly IAutoMovieMotionHumanPerformanceState.IGrip[] = [
    first,
    second,
    third,
  ];

  // 1. Closing grips carry only after they close.
  const closing: HumanPerformanceCustody.ICustody = HumanPerformanceCustody(
    [first, grip("ann", "right", 1.2, 2)],
    1.2,
    false,
  );
  TestValidator.predicate(
    "a grip closing now does not carry yet",
    closing.active === undefined &&
      closing.released === first &&
      closing.since === 0,
  );

  // 2. Two hands of one performer.
  const both: HumanPerformanceCustody.ICustody = HumanPerformanceCustody(
    grips,
    0.75,
    false,
  );
  TestValidator.predicate(
    "the other hand steadies",
    both.active === first && both.steady === second && both.since === 0.5,
  );

  // 3. A handover.
  const handed: HumanPerformanceCustody.ICustody = HumanPerformanceCustody(
    grips,
    1.75,
    false,
  );
  TestValidator.predicate(
    "another performer's grip takes over",
    handed.active === third && handed.steady === undefined,
  );

  // 4. After every release.
  const left: HumanPerformanceCustody.ICustody = HumanPerformanceCustody(
    grips,
    4,
    false,
  );
  TestValidator.predicate(
    "the last release leaves it",
    left.active === undefined && left.released === third && left.since === 1.5,
  );

  // 5. A socket closing now.
  const socket: IAutoMovieMotionHumanPerformanceState.IGrip = {
    subject: "rack",
    side: "right",
    mount: { prop: "rack", point: "peg" },
    from: 2,
    to: Infinity,
  };
  TestValidator.predicate(
    "a socket closing now carries only when asked",
    HumanPerformanceCustody([socket], 2, false).active === undefined &&
      HumanPerformanceCustody([socket], 2, true).active === socket,
  );
}
