import { KickClear } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** A plan by its step, short beyond a step back. */
const planned = (step: number, shortBeyond: number): KickClear.IStepped => ({
  carriage: { step },
  fit: { status: step < shortBeyond ? "short" : "reached" },
});

/**
 * A kick stepping back to clear its chamber (`KickClear.retreat`): replanned a
 * stride further back each time until the chamber clears, giving up past the
 * furthest step or once the kick falls short.
 *
 * Scenarios:
 *
 * 1. From a step of 0, striding 0.1 m back with the furthest at -0.35 m, a kick
 *    clearing from -0.2 m clears there, after two replans.
 * 2. One clearing only from -0.4 m runs out of steps.
 * 3. One falling short beyond -0.15 m gives up at -0.2 m.
 */
export function test_unit_motions_striking_kick_clear(): void {
  let replans: number = 0;
  const plan =
    (shortBeyond: number) =>
    (back: number): KickClear.IStepped => {
      ++replans;
      return planned(back, shortBeyond);
    };
  const clears =
    (from: number) =>
    (p: KickClear.IStepped): boolean =>
      p.carriage.step <= from + 1e-9;
  const cleared = KickClear.retreat(
    planned(0, -9),
    0.1,
    -0.35,
    plan(-9),
    clears(-0.2),
  );
  TestValidator.predicate(
    "cleared",
    cleared !== undefined &&
      Math.abs(cleared.carriage.step + 0.2) < 1e-12 &&
      replans === 2,
  );
  TestValidator.predicate(
    "no room or no reach",
    KickClear.retreat(planned(0, -9), 0.1, -0.35, plan(-9), clears(-0.4)) ===
      undefined &&
      KickClear.retreat(
        planned(0, -0.15),
        0.1,
        -0.35,
        plan(-0.15),
        clears(-0.3),
      ) === undefined,
  );
}
