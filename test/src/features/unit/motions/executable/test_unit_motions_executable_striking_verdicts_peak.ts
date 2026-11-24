import { StrikingVerdicts } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `StrikingVerdicts.peak` is the second a strike shows its peak: its planned
 * contact, else its `shown` event, else its `chamber` event, else its end, and
 * never after its end.
 *
 * Scenarios:
 *
 * 1. A contact planned 0.4 s in, on a segment starting at 1 s, peaks at 1.4 s.
 * 2. A contact past the end peaks at the end.
 * 3. Without a contact, the shown event leads the chamber.
 * 4. With only the chamber, the chamber; with neither, the end.
 */
export function test_unit_motions_executable_striking_verdicts_peak(): void {
  const timed = (
    contact: number | undefined,
    events: StrikingVerdicts.ITimed["plan"]["events"],
  ): StrikingVerdicts.ITimed => ({
    start: 1,
    end: 2,
    plan: { duration: 1, events, ...(contact === undefined ? {} : { contact }) },
  });
  TestValidator.equals(
    "contact, end, shown, chamber, end",
    [
      StrikingVerdicts.peak(timed(0.4, [])),
      StrikingVerdicts.peak(timed(1.5, [])),
      StrikingVerdicts.peak(
        timed(undefined, [
          { name: "chamber", share: 0.2 },
          { name: "shown", share: 0.5 },
        ]),
      ),
      StrikingVerdicts.peak(timed(undefined, [{ name: "chamber", share: 0.25 }])),
      StrikingVerdicts.peak(timed(undefined, [])),
    ],
    [1.4, 2, 1.5, 1.25, 2],
  );
}
