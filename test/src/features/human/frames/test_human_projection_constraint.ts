import { AutoMovieHumanF1ProjectionConstraint as solve } from "@automovie/human";

import { nclose } from "../../internal/predicates";

/**
 * A projection constraint distinguishes an identifiable root from candidate-local tape bounds.
 *
 * Scenarios:
 * 1. A linear tape10+2p reaches18 atp4 inside the declared bracket.
 * 2. Moving-plane bust80+20p and bare75+20p reach92 atp0.6 despite the baseline candidate's bare95.
 * 3. A flat tape18 does not identify any unique projection, and invalid scalar inputs are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual production projection policy on made scalar reading functions, exposing false early infeasibility and an ambiguous flat solution.
 * @evidence contracts/development/testing.md#independent-expectations Literal roots4 and0.6 follow from independent linear equations; a constant response cannot identify a projection.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes successful fixed-plane and moving-plane counterparts, flat ambiguity and invalid input admission.
 * @evidence contracts/development/testing.md#execution-ownership A bounded pure scalar solve uses no body, loft, reference or process.
 * @evidence contracts/development/common.md#meaningful-documentation Lists three scenarios and distinguishes a candidate-local bound from a global impossibility proof.
 */
export function test_human_projection_constraint(): void {
  const failures: string[] = [];
  const linear = solve.solve(2, 18, 1e-8, (p: number) => ({
    bust: 10 + 2 * p,
    bareBust: 10,
  }));
  if (
    linear.status !== "resolved" ||
    linear.projection === null ||
    !nclose(linear.projection, 4, 1e-6)
  )
    failures.push("independent fixed-plane root4 was not resolved");
  const moving = solve.solve(1, 92, 1e-8, (p: number) => ({
    bust: 80 + 20 * p,
    bareBust: 75 + 20 * p,
  }));
  if (
    moving.status !== "resolved" ||
    moving.projection === null ||
    !nclose(moving.projection, 0.6, 1e-6)
  )
    failures.push(
      "a candidate-local bare95 rejected the attainable moving-plane target92",
    );
  const flat = solve.solve(2, 18, 1e-8, () => ({ bust: 18, bareBust: 10 }));
  if (flat.status === "resolved")
    failures.push(
      "a flat tape arbitrarily selected an unidentifiable projection",
    );
  for (const bad of [0, -1, NaN, Infinity]) {
    let refused = false;
    try {
      solve.solve(bad, 18, 1e-8, () => ({ bust: 18, bareBust: 10 }));
    } catch {
      refused = true;
    }
    if (!refused) failures.push("invalid projection input was admitted");
  }
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
