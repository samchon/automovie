import { interpolateHumanBasisSourceTriangle } from "../../common/basis/interpolateHumanBasisSourceTriangle";
import type { IAutoMovieHumanFaceSourceClosurePlan } from "../structures/IAutoMovieHumanFaceSourceClosurePlan";
import { assertHumanFaceSourceClosurePlan } from "./assertHumanFaceSourceClosurePlan";

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
    const endpoint = prior.get(id);
    if (
      endpoint === undefined ||
      values.length % 3 !== 0 ||
      values.length !== endpoint.length
    )
      throw new Error("Face source closure needs matching performed surfaces.");
    for (let i = 0; i < values.length; i++)
      if (!Number.isFinite(values[i]) || !Number.isFinite(endpoint[i]))
        throw new Error("Face source closure needs dense finite positions.");
  }
  const selected = prior.get(plan.surface)!;
  const closed = selected.slice();
  for (let i = 0; i < plan.contactPairs.length; i++) {
    const pair = plan.contactPairs[i];
    const [a, b] = pair;
    for (let axis = 0; axis < 3; axis++) {
      const mean = interpolateHumanBasisSourceTriangle(
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
  for (let i = 0; i < plan.rows.length; i++) {
    const row = plan.rows[i];
    for (let axis = 0; axis < 3; axis++) {
      let movement = 0;
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
  const output = new Map<string, number[]>();
  for (const [id, values] of open) {
    const endpoint = id === plan.surface ? closed : prior.get(id)!;
    const result = values.map((value, i) =>
      weight === 0
        ? value
        : weight === 1
          ? endpoint[i]
          : value + weight * (endpoint[i] - value),
    );
    if (result.some((value) => !Number.isFinite(value)))
      throw new Error(
        "Face source closure exceeded finite request arithmetic.",
      );
    output.set(id, result);
  }
  return output;
}
