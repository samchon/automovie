import { GymnasticsFlight } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A flight's touchdown is bisected to a tenth of a millisecond, or to
 * adjacent seconds where a flight lies so late that they are spaced wider
 * (`GymnasticsFlight.touchdown`): past 2^39 s two adjacent seconds are more
 * than 1e-4 s apart, and a bisection stopped only by that width halved a
 * bracket that could not narrow forever.
 *
 * The lowest point is `height + (crossing - t)`, which falls through the
 * height once, at `crossing`, half a second into a one-second bracket.
 *
 * Scenarios:
 * 1. From 0 s: the touchdown is within 1e-4 s of 0.5 s, read in at most 14
 *    bisections (2^14 > 1e4 halvings of the second).
 * 2. From 2^40 s, where adjacent seconds lie 2^-12 s apart: the touchdown is
 *    within 1e-4 s and one spacing of 2^40 + 0.5 s, read in at most 13
 *    bisections (the bracket holds 2^12 representable seconds). Before, the
 *    bracket stood at one spacing and the reads went on without end.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public touchdown on a linear fall and counts its reads; a bisection that cannot stop reads past the bound and fails, as does one that moves the ordinary answer.
 * @evidence contracts/development/testing.md#independent-expectations The crossing is the linear fall's root by construction; the read bounds are log2 of the bracket over the tolerance and over binary64's spacing at 2^40, 2^-12.
 * @evidence contracts/development/testing.md#distinguishing-cases A bracket whose seconds resolve the tolerance beside one whose seconds do not.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory call, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the fall and the two scenarios.
 */
export function test_motion_flight_touchdown_resolution(): void {
  const findings: string[] = [];
  for (const [from, most] of [
    [0, 14],
    [2 ** 40, 13],
  ] as const) {
    const crossing: number = from + 0.5;
    let reads: number = 0;
    const at: number = GymnasticsFlight.touchdown(
      from,
      from + 1,
      (t: number): number => {
        if (++reads > most) throw new Error(`read past ${most} times`);
        return 1 + (crossing - t);
      },
      1,
    );
    const spacing: number = from === 0 ? 0 : 2 ** -12;
    if (!(Math.abs(at - crossing) <= 1e-4 + spacing))
      findings.push(`from ${from}: touchdown ${at - from} s in, not 0.5`);
  }
  TestValidator.equals("a late touchdown ends at resolution", findings, []);
}
