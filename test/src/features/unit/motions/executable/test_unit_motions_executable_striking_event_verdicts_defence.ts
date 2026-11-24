import type { IAutoMovieMotionEvent } from "@automovie/interface";
import type { IMotionCaptureCase } from "@automovie/motions/internal";
import { StrikingEventVerdicts } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `StrikingEventVerdicts.defence` classes a defence by its own events: in time
 * when the guard is set by the contact, late when set within half its movement
 * (read to set) after it, failed otherwise, and passes when that class is the
 * declared outcome or none is declared.
 *
 * A 1 s plan starts at 1 s and reads the strike at 0.1 s; the contact comes at
 * 0.4 s.
 *
 * Scenarios:
 *
 * 1. Set at 0.3 s, before the contact: in time.
 * 2. Set at 0.5 s, 0.1 s after the contact of a 0.4 s movement: late.
 * 3. Set at 0.8 s, 0.4 s after the contact of a 0.7 s movement: failed, against
 *    a declared late.
 * 4. A plan without its set event fails and names it.
 */
export function test_unit_motions_executable_striking_event_verdicts_defence(): void {
  const defence = (
    set: number | undefined,
    outcome?: string,
  ): IMotionCaptureCase.IVerdict =>
    StrikingEventVerdicts.defence("b", {
      id: "d1",
      params: outcome === undefined ? {} : { outcome },
      start: 1,
      end: 2,
      plan: {
        duration: 1,
        events: [
          { name: "read", share: 0.1 },
          { name: "contact", share: 0.4 },
          ...(set === undefined
            ? []
            : [{ name: "set", share: set } satisfies IAutoMovieMotionEvent]),
        ],
      },
    });
  const shown = (detail: string): string => detail.split(": ")[1]!.split(" ")[0]!;
  TestValidator.equals(
    "in time, late, failed and incomplete",
    [
      shown(defence(0.3, "inTime").detail),
      defence(0.3, "inTime").passed,
      shown(defence(0.5).detail),
      defence(0.5).passed,
      shown(defence(0.8, "late").detail),
      defence(0.8, "late").passed,
      defence(undefined),
    ],
    [
      "inTime",
      true,
      "late",
      true,
      "fail",
      false,
      {
        name: "b d1 defence",
        passed: false,
        detail: "the plan lacks its set event",
      },
    ],
  );
}
