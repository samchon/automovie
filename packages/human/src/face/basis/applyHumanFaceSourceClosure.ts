import { interpolateHumanBasisSourceTriangle } from "../../common/basis/interpolateHumanBasisSourceTriangle";
import type { IAutoMovieHumanFaceSourceClosurePlan } from "../structures/IAutoMovieHumanFaceSourceClosurePlan";
import { assertHumanFaceSourceClosurePlan } from "./assertHumanFaceSourceClosurePlan";
import type { IAutoMovieHumanFaceSourceClosureRow as IAutoMovieHumanFaceSourceClosureRowImported } from "../structures/IAutoMovieHumanFaceSourceClosureRow";


/**
 * Form one source-registered closed endpoint after native posing and replay.
 * Open and prior are fixed closure-zero/one states with the same other inputs
 * in a common performed metre/head frame. A pair's shared anchored prior mean
 * drives each sparse row as prior[v]+sum H[v,j]*(C[j]-prior[j]). The requested
 * weight belongs only to the final open-to-endpoint blend on every surface.
 *
 * Inputs stay unchanged; output arrays and maps are owned. Dense finite layouts,
 * unique pair/transition owners, positive supported drivers, a registered
 * representative and finite arithmetic are required. This arithmetic establishes
 * no complete-margin, cell, tissue or collider validity. Source preparation owns
 * the qualified field and fixed boundaries; contact and assembly observe output.
 *
 * @evidence contracts/common.md#principled-implementation Registered contact pairs take the canonical represented prior mean, supported sparse rows propagate anchored departures, and one requested weight blends matching performed open/endpoint buffers in head metres.
 * @evidence contracts/common.md#clear-and-simple-design Plan admission owns source correspondence; this function owns endpoint arithmetic and blend, while native posing/refinement and physical contact admission remain their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Even zero weight admits the complete plan/layout; finite arithmetic refuses instead of clipping, and pair representatives or positive offline coefficients supply no whole-margin/anatomical certificate.
 * @evidence contracts/common.md#meaningful-documentation Prose gives fixed-state input meaning, canonical mean, sparse equation, final blend ownership and independent source/physical validity limits.
 * @evidence contracts/performance.md#efficient-algorithms Dense N coordinate validation/output is linear, with additional P pair operations and K sparse driver contributions; no runtime tissue solve or nearest registration occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work One admitted plan and prior buffer supply every row; unchanged vertices read the original endpoint and weight endpoints avoid unnecessary blend arithmetic.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Closed/output buffers are invocation-owned and only successful maps escape; all borrowed inputs remain unchanged on finite/layout refusal.
 */
export function applyHumanFaceSourceClosure(
  plan: IAutoMovieHumanFaceSourceClosurePlan,
  open: ReadonlyMap<string, readonly number[]>,
  prior: ReadonlyMap<string, readonly number[]>,
  weight: number,
): Map<string, number[]> {
  if (!Number.isFinite(weight) || weight < 0 || weight > 1)
    throw new Error("Face source closure needs a request weight in [0,1].");
  assertHumanFaceSourceClosurePlan(plan, open);
  if (open.size !== prior.size)
    throw new Error("Face source closure needs matching performed surfaces.");
  for (const [id, values] of open) {
    const endpoint: readonly number[] | undefined = prior.get(id);
    if (
      endpoint === undefined ||
      values.length % 3 !== 0 ||
      values.length !== endpoint.length
    )
      throw new Error("Face source closure needs matching performed surfaces.");
    for (let i: number = 0; i < values.length; i++)
      if (!Number.isFinite(values[i]) || !Number.isFinite(endpoint[i]))
        throw new Error("Face source closure needs dense finite positions.");
  }
  const selected: readonly number[] = prior.get(plan.surface)!;
  const closed: number[] = selected.slice();
  for (let i: number = 0; i < plan.contactPairs.length; i++) {
    const pair: readonly [number, number] = plan.contactPairs[i];
    const [a, b]: readonly [number, number] = pair;
    for (let axis: number = 0; axis < 3; axis++) {
      const mean: number = interpolateHumanBasisSourceTriangle(
        [
          selected[a * 3 + axis],
          selected[b * 3 + axis],
          selected[a * 3 + axis],
        ],
        [0.5, 0],
      );
      closed[a * 3 + axis] = mean;
      closed[b * 3 + axis] = mean;
    }
  }
  for (let i: number = 0; i < plan.rows.length; i++) {
    const row: IAutoMovieHumanFaceSourceClosureRowImported = plan.rows[i];
    for (let axis: number = 0; axis < 3; axis++) {
      let movement: number = 0;
      for (const [driver, coefficient] of row.coefficients)
        movement +=
          coefficient *
          (closed[driver * 3 + axis] - selected[driver * 3 + axis]);
      closed[row.vertex * 3 + axis] =
        selected[row.vertex * 3 + axis] + movement;
      if (!Number.isFinite(closed[row.vertex * 3 + axis]))
        throw new Error(
          "Face source closure exceeded finite endpoint arithmetic.",
        );
    }
  }
  const output: Map<string, number[]> = new Map<string, number[]>();
  for (const [id, values] of open) {
    const endpoint: readonly number[] = id === plan.surface ? closed : prior.get(id)!;
    const result: number[] = values.map((value: number, i: number): number  =>
      weight === 0
        ? value
        : weight === 1
          ? endpoint[i]
          : value + weight * (endpoint[i] - value),
    );
    if (result.some((value: number): boolean  => !Number.isFinite(value)))
      throw new Error(
        "Face source closure exceeded finite request arithmetic.",
      );
    output.set(id, result);
  }
  return output;
}
