import { coupleHumanSimulationGrips } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** A grip of one performer on another over steps. */
const grip = (
  subject: string,
  partner: string,
  from: number,
  to: number,
): coupleHumanSimulationGrips.IGrip => ({ subject, partner, from, to });

/**
 * `coupleHumanSimulationGrips` groups performers gripping each other while both
 * still track, each connected set of mutual grips one group labelled by its
 * members; a one-way grip makes none.
 *
 * Scenarios, `a` and `b` gripping each other over steps 1 to 3, `b` and `c`
 * over 2 to 4, `c` released at step 3, and `d` gripping `a` one way
 * throughout:
 *
 * 1. At step 1 `a` and `b` are one group.
 * 2. At step 2 `c` joins them through `b`.
 * 3. At step 3, `c` released, `a` and `b` are left.
 * 4. At step 4 no mutual grip holds, so the step has no group; `d` is never in
 *    one.
 */
export function test_motions_perform_couple_grips(): void {
  const groups: Map<number, Map<string, string>> = coupleHumanSimulationGrips(
    [
      grip("a", "b", 1, 3),
      grip("b", "a", 1, 3),
      grip("b", "c", 2, 4),
      grip("c", "b", 2, 4),
      grip("d", "a", 1, 4),
    ],
    new Map([
      ["a", 10],
      ["b", 10],
      ["c", 3],
      ["d", 10],
    ]),
    4,
  );
  TestValidator.equals(
    "the groups",
    [1, 2, 3, 4].map((step: number): [string, string][] =>
      [...(groups.get(step) ?? new Map<string, string>()).entries()].sort(
        ([a], [b]): number => a.localeCompare(b),
      ),
    ),
    [
      [
        ["a", "grip:a,b"],
        ["b", "grip:a,b"],
      ],
      [
        ["a", "grip:a,b,c"],
        ["b", "grip:a,b,c"],
        ["c", "grip:a,b,c"],
      ],
      [
        ["a", "grip:a,b"],
        ["b", "grip:a,b"],
      ],
      [],
    ],
  );
  TestValidator.predicate("step 4 is absent", !groups.has(4));
}
