import { FamilyConicFit as Fit } from "../../../reference-conics/FamilyConicFit";

/**
 * The group fit's second-order correction on the Maratos effect.
 *
 * The made fit minimizes `(x1 - 1)^2 + x2^2` subject to `x1^2 - x2 <= 0` from the feasible point `(0, 0)`, where the constraint is
 * active and its linearization `-x2 <= 0` misses its curvature. The affine step goes to about `(1, 0)`, where the constraint is
 * violated by about 1, and is refused. The least-norm correction along the constraint's gradient at the start, `(0, -1)`, lifts it
 * to `(d1, d1^2)`, on the parabola, with objective `(d1 - 1)^2 + d1^4 < 1`, so the full step is accepted in its first attempt.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `FamilyConicFit.fitGroup` with a made reading, as the group fit runs it.
 * @evidence contracts/development/testing.md#independent-expectations The corrected point lies on the parabola `x2 = x1^2` in closed form, with the objective below the start's.
 * @evidence contracts/development/testing.md#distinguishing-cases A complete and a partially refused trial must give the same correction in the first attempt. Both use one prepared reader per screened point.
 * @evidence contracts/development/testing.md#execution-ownership Two variables and three rows; no geometry.
 * @evidence contracts/development/common.md#meaningful-documentation Names the made problem, its active constraint and the closed-form corrected point.
 */
export function test_human_group_second_order(): void {
  const failures: string[] = [];
  const read = (state: readonly number[], derivatives: boolean): ReturnType<typeof Fit.readGroup> => Fit.readGroup(state, derivatives, [{ rows: () => ({
    measured: [
      { value: state[0]! - 1, gradient: new Map([[0, 1]]) },
      { value: state[1]!, gradient: new Map([[1, 1]]) },
    ],
    incidence: [],
    inside: [{ value: state[0]! * state[0]! - state[1]!, gradient: new Map([[0, 2 * state[0]!], [1, -1]]) }],
  }) }]);
  for (const partial of [false, true]) {
    const events: { action?: string; state?: string; attempt?: number; iteration?: number; refusal?: string | null }[] = [];
    const scopes: boolean[][] = [];
    const fit = Fit.fitGroup([0, 0], read, 1e-9, 1, (event: object): void => { events.push(event as (typeof events)[number]); },
      (point) => () => {
        const reads: boolean[] = [];
        scopes.push(reads);
        return (derivatives) => {
          reads.push(derivatives);
          const excess: number = point[0]! * point[0]! - point[1]!;
          return partial && excess > 1e-9 ? { refusal: "the leading inside row excludes the trial", inside: [excess] } : read(point, derivatives);
        };
      });
    if (typeof fit === "string") { failures.push("the made fit refused: " + fit); continue; }
    const refusedFirst: boolean = events.some((e): boolean =>
      e.action === "second-order correction" && e.state === "accepted" && e.attempt === 0 && e.iteration === 0);
    if (!refusedFirst) failures.push("the first attempt's trial was not refused and then accepted by its correction: " + JSON.stringify(events));
    if (scopes.length !== 2 || scopes[0]?.length !== 1 || scopes[0][0] !== false ||
        scopes[1]?.length !== 2 || scopes[1][0] !== false || scopes[1][1] !== true)
      failures.push("the accepted point did not reuse its scoped reader: " + JSON.stringify(scopes));
    const [x1, x2] = fit.values;
    if (!(Math.abs(x2! - x1! * x1!) <= 1e-9)) failures.push("the corrected point " + JSON.stringify(fit.values) + " is not on the parabola");
    if (!(fit.objective < 1)) failures.push("the corrected objective " + fit.objective + " is not below the start's 1");
  }
  if (failures.length > 0) throw new Error("second-order correction:\n" + failures.join("\n"));
}
