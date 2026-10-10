import { triangleAreaVector } from "../../common/mesh/triangleAreaVector";
import type { IAutoMovieHumanPersonSourceCellArea } from "../structures/IAutoMovieHumanPersonSourceCellArea";
import type { IAutoMovieHumanPersonSourceCellEvaluation } from "../structures/IAutoMovieHumanPersonSourceCellEvaluation";
import type { IAutoMovieHumanPersonSourceCellEvaluationProps } from "../structures/IAutoMovieHumanPersonSourceCellEvaluationProps";

/**
 * Admit one performed pair of complementary source skins before shading.
 * Population and finite coordinates must match the compiled source plan.
 * Shared canonical samples agree in the renderer's Float32 frame; each Double
 * cell remains nonzero and retains positive direction after Float32 emission.
 * Actual child areas must agree with their complete performed raw-parent area.
 * These checks describe geometry, independently of a later normal-star zero.
 * Arrays are read only; returned parent areas and canonical source positions
 * are owned. Source positions retain the first partition's Double coordinates
 * after the shared Float32 check, and use metres/Y-up/Z-forward.
 */
export function evaluateHumanPersonSourceCells(
  props: IAutoMovieHumanPersonSourceCellEvaluationProps,
): IAutoMovieHumanPersonSourceCellEvaluation {
  const { plan, faceIndices, bodyIndices, input } = props;
  const used = [faceIndices, bodyIndices].map((indices) => new Set(indices));
  if (
    input.face.length !== plan.face.samples.length * 3 ||
    input.body.length !== plan.body.samples.length * 3 ||
    input.bodyIndices.length !== bodyIndices.length ||
    [...input.bodyIndices].some((id, at) => id !== bodyIndices[at])
  )
    throw new Error(
      "Performed person source cells changed population without source lineage.",
    );
  const parentAreas = new Array<number>(plan.face.parentTriangles.length).fill(
    0,
  );
  const samples = new Map<number, number[]>();
  const sourcePositions = new Map<number, readonly number[]>();
  const cells: IAutoMovieHumanPersonSourceCellArea[] = [];
  const domains = [
    { positions: input.face, indices: faceIndices, record: plan.face },
    { positions: input.body, indices: bodyIndices, record: plan.body },
  ];
  for (const [side, domain] of domains.entries()) {
    if ([...domain.positions].some((value) => !Number.isFinite(value)))
      throw new Error(
        "Person source normals need finite performed coordinates.",
      );
    const emittedPositions = domain.positions.map(Math.fround);
    for (const vertex of used[side]) {
      const id = domain.record.samples[vertex];
      const point = emittedPositions.slice(vertex * 3, vertex * 3 + 3);
      if (point.some((value) => !Number.isFinite(value)))
        throw new Error(
          "Person source samples must survive the renderer's Float32 frame.",
        );
      const existing = samples.get(id);
      if (
        existing !== undefined &&
        point.some((value, axis) => value !== existing[axis])
      )
        throw new Error(
          "Performed person source samples disagree at a shared identity.",
        );
      samples.set(id, point);
      if (!sourcePositions.has(id))
        sourcePositions.set(
          id,
          domain.positions.slice(vertex * 3, vertex * 3 + 3),
        );
    }
    for (let at = 0; at < domain.indices.length; at += 3) {
      const area = triangleAreaVector(domain.positions, domain.indices, at);
      const vector = [area.x, area.y, area.z];
      // Float32-representable used coordinates bound area vectors and their
      // finite-array sums within Float64. A zero cell has no normal.
      if (!(Math.hypot(...vector) > 0))
        throw new Error(
          "Person source shading cannot admit a zero performed cell.",
        );
      const emitted = triangleAreaVector(emittedPositions, domain.indices, at);
      if (
        !(
          vector[0] * emitted.x +
            vector[1] * emitted.y +
            vector[2] * emitted.z >
          0
        )
      )
        throw new Error(
          "Person source Float32 cell is zero or reverses its performed source direction.",
        );
      const parent = domain.record.parents[at / 3] * 3;
      cells.push({ parent, vector });
      for (let axis = 0; axis < 3; axis++)
        parentAreas[parent + axis] += vector[axis];
    }
  }
  for (const { parent, vector } of cells)
    if (
      !(
        vector.reduce(
          (sum, value, axis) => sum + value * parentAreas[parent + axis],
          0,
        ) > 0
      )
    )
      throw new Error(
        "Performed person source cell opposes its complete parent area field.",
      );
  return { parentAreas, sourcePositions };
}
