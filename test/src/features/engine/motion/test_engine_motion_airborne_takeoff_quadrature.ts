import { AirborneTakeoffQuadrature } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * A take-off quadrature whose budget lies below the arithmetic's resolution
 * ends once every panel is resolved, as Gander and Gautschi's test ends it
 * (Adaptive Quadrature--Revisited, BIT 40 (2000), 84--101): a panel whose error
 * leaves the integral's magnitude unchanged in floating point cannot move the
 * computed sum, so it is not split again.
 *
 * The integrand is cos t over [0, 1], whose integral is sin 1. Simpson's panel
 * error is at most h^5 max|f''''| / 2880 with max|cos''''| = 1, and a panel is
 * resolved once that error is below half an ulp of the integral's magnitude
 * (about 0.84, half an ulp 5.6e-17): h at most about 0.0028, so about 362 equal
 * panels, and no more than twice as many for a refinement that splits the worst
 * panel first. Each panel reads the integrand 4 times and the first one more,
 * so 4 * 1024 + 1 reads bound it.
 *
 * Scenarios:
 *
 * 1. A budget of zero over the general measure: the integral is within 4 ulps of
 *    sin 1 (sixteen machine epsilons times its size) and the integrand is read
 *    at most 4 * 1024 + 1 times. Before the test, no estimate met a zero budget
 *    and every panel was split toward machine width.
 * 2. The same over a separable measure, whose aggregate's own summation roundoff
 *    is charged to the budget: the same bounds.
 * 3. A budget the arithmetic meets, 1e-10: the integral is within it of sin 1 and
 *    read fewer times than at the zero budget.
 */
export function test_engine_motion_airborne_takeoff_quadrature(): void {
  const BOUND: number = 4 * 1024 + 1;
  const exact: number = Math.sin(1);
  const run = (
    tolerance: number,
    separable: boolean,
  ): { value: number; reads: number } => {
    let reads: number = 0;
    const value: number[] = AirborneTakeoffQuadrature({
      t0: 0,
      t1: 1,
      read: (t: number): number[] => {
        ++reads;
        if (reads > BOUND) throw new Error(`read past ${BOUND} times`);
        return [Math.cos(t)];
      },
      tolerance,
      error: (_: readonly number[], e: readonly number[]): number =>
        Math.abs(e[0]!),
      ...(separable
        ? {
            separable: {
              components: (e: readonly number[]): readonly number[] => [
                Math.abs(e[0]!),
              ],
              weights: (): readonly number[] => [1],
            },
          }
        : {}),
    });
    return { value: value[0]!, reads };
  };
  const findings: string[] = [];
  const zero: Record<"general" | "separable", number> = {
    general: 0,
    separable: 0,
  };
  for (const separable of [false, true]) {
    const label: "general" | "separable" = separable ? "separable" : "general";
    try {
      const { value, reads } = run(0, separable);
      zero[label] = reads;
      if (!(Math.abs(value - exact) <= 16 * Number.EPSILON * exact))
        findings.push(
          `${label}, zero budget: ${value} is ${Math.abs(value - exact)} from sin 1`,
        );
    } catch (error) {
      findings.push(
        `${label}, zero budget: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  const met: { value: number; reads: number } = run(1e-10, false);
  if (!(Math.abs(met.value - exact) <= 1e-10))
    findings.push(
      `budget 1e-10: ${met.value} is ${Math.abs(met.value - exact)} from sin 1`,
    );
  if (!(met.reads < zero.general))
    findings.push(
      `budget 1e-10 reads ${met.reads} times, the zero budget ${zero.general}`,
    );
  TestValidator.equals(
    "a budget below resolution ends at resolution",
    findings,
    [],
  );
}
