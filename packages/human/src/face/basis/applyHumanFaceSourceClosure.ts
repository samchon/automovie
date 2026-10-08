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
 *
 * @evidence contracts/common.md#principled-implementation Uses one anchored source pair mean and supplied sparse displacement rows before one requested blend, retaining translation covariance without coefficient normalization or a runtime solve.
 * @evidence contracts/common.md#clear-and-simple-design Source endpoint and request blend have separate responsibilities; native pose/replay and rigid contact stay with their consuming stage owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source owners select IDs and coefficients; no person, neck index, gap mask or tolerant coincidence substitutes for actual geometry qualification.
 * @evidence contracts/common.md#meaningful-documentation States fixed-state inputs, domains, ownership, numerical refusals and the separate physical acceptance boundary.
 * @evidence contracts/modeling.md#shared-boundaries A registered pair receives the same computed target and the exact endpoint survives weight one; the qualified source owns preserved neighboring boundaries.
 * @evidence contracts/modeling.md#spatial-conventions Positions retain one common performed metre/head frame; coefficients and request weight are dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Computes over existing surfaces and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Consumes an admitted request weight and defines no person authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Retains the existing vertex population and emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation Source compiler and face assembly observe their resulting geometry; this arithmetic helper displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The compiled endpoint is a numerical source convention, not measured tissue mechanics.
 * @evidenceExclude contracts/anatomy.md#permitted-range The request's arithmetic domain is not a clinical motion capacity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal vertex, curve or sculpt authoring input.
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
