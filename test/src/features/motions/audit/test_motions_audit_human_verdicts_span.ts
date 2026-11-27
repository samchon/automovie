import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import {
  HumanVerdictsSpan
} from "../../../../../packages/motions/src/audit/internal/HumanVerdictsSpan";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of one subtraction of film seconds, seconds. */
const ROUNDING: number = 1e-12;

/**
 * `HumanVerdictsSpan` cuts a span out of a motion as a motion of its own: its
 * seconds start at the span's first film second, its reads add that second
 * back, and its actions' spans move earlier by as much; the whole film is the
 * motion itself.
 *
 * The motion here lasts 10 s; its one action runs from 2 to 8 s, entered at 3.
 *
 * Scenarios:
 *
 * 1. The whole film is the motion itself.
 * 2. The span from 4 to 9 s lasts 5 s.
 * 3. Its read at 1 s reads the motion at 5 s, and its water likewise.
 * 4. Its action starts at -2, is entered at -1 and ends at 4 s.
 */
export function test_motions_audit_human_verdicts_span(): void {
  const read: number[] = [];
  const motion: IAutoMovieMotionHumanAuditMotion = {
    duration: 10,
    bones: (
      _subject: string,
      seconds: number,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      read.push(seconds);
      return new Map();
    },
    segments: (): IAutoMovieMotionHumanAuditMotion.ISpan[] => [
      {
        name: "walk",
        start: 2,
        entryTime: 3,
        end: 8,
        plan: { duration: 6, contacts: [] },
      },
    ],
    water: (_subject: string, seconds: number): boolean => seconds > 4.5,
  };

  // 1. The whole film.
  TestValidator.predicate(
    "the whole film",
    HumanVerdictsSpan(motion, 0, 10) === motion,
  );

  // 2 and 3. The span's clock and reads.
  const span: IAutoMovieMotionHumanAuditMotion = HumanVerdictsSpan(
    motion,
    4,
    9,
  );
  TestValidator.equals("its duration", span.duration, 5);
  span.bones("a", 1);
  TestValidator.predicate(
    "a read moved by the span's start",
    read.length === 1 && nclose(read[0]!, 5, ROUNDING),
  );
  TestValidator.equals(
    "the water moved likewise",
    [span.water!("a", 0.25), span.water!("a", 1)],
    [false, true],
  );

  // 4. The action's span moved.
  const moved: IAutoMovieMotionHumanAuditMotion.ISpan = span.segments("a")[0]!;
  TestValidator.predicate(
    "the action moved earlier",
    nclose(moved.start, -2, ROUNDING) &&
      nclose(moved.entryTime, -1, ROUNDING) &&
      nclose(moved.end, 4, ROUNDING),
  );
}
