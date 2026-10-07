import type { IHumanSourceTongueRestParameters } from "./structures/IHumanSourceTongueRestParameters.ts";
import type { IHumanSourceTongueRestProblem } from "./structures/IHumanSourceTongueRestProblem.ts";

/**
 * Evaluate a root-preserving source tongue deformation from immutable material
 * coordinates. Smoothstep starts at the declared posterior-quarter root;
 * sinusoidal dorsal relief vanishes at both free-body endpoints. Every
 * vertex's material weights stay fixed for endpoint transport, so static
 * authoring and all source deltas use the same per-vertex affine map.
 * Mathematical scalar domains add no clinical bounds; actual anatomy/contact
 * feasibility belongs to the source evaluator and normal admission.
 */
export function evaluateHumanSourceTongueRestPositions(
  problem: IHumanSourceTongueRestProblem,
  parameters: IHumanSourceTongueRestParameters,
): number[] {
  if (
    !Number.isFinite(parameters.widthScale) ||
    parameters.widthScale <= 0 ||
    parameters.widthScale > 1 ||
    !Number.isFinite(parameters.tipRetractionMetres) ||
    parameters.tipRetractionMetres < 0 ||
    !Number.isFinite(parameters.dorsumRiseMetres) ||
    parameters.dorsumRiseMetres < 0
  )
    throw new Error(
      "Source tongue authoring requires positive width scale at most one and finite nonnegative metre displacements.",
    );
  const positions = [...problem.positions];
  for (let vertex = 0; vertex < positions.length / 3; vertex++) {
    const v = problem.coordinateV[vertex];
    if (v <= problem.rootEndV) continue;
    const t = (v - problem.rootEndV) / (problem.maximumV - problem.rootEndV);
    const rootWeight = t * t * (3 - 2 * t),
      dorsalWeight = Math.sin(Math.PI * t) ** 2;
    for (let axis = 0; axis < 3; axis++)
      positions[3 * vertex + axis] +=
        rootWeight *
          (parameters.widthScale - 1) *
          problem.coordinateU[vertex] *
          problem.upper.lateral[axis] -
        rootWeight *
          t *
          t *
          parameters.tipRetractionMetres *
          problem.upper.forward[axis] +
        dorsalWeight * parameters.dorsumRiseMetres * problem.upper.apical[axis];
  }
  if (
    !positions.every(
      (value) => Number.isFinite(value) && Number.isFinite(Math.fround(value)),
    )
  )
    throw new Error("Source tongue deformation exceeds Float32 coordinates.");
  return positions;
}
