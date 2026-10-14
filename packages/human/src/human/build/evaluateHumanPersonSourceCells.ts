import { triangleAreaVector } from "../../common/mesh/triangleAreaVector";
import type { IAutoMovieHumanPersonSourceCellArea } from "../structures/IAutoMovieHumanPersonSourceCellArea";
import type { IAutoMovieHumanPersonSourceCellEvaluation } from "../structures/IAutoMovieHumanPersonSourceCellEvaluation";
import type { IAutoMovieHumanPersonSourceCellEvaluationProps } from "../structures/IAutoMovieHumanPersonSourceCellEvaluationProps";

/**
 * Admit performed complementary skins before shading. Current populations and body indices match captured topology, all coordinates are finite, and used canonical samples agree exactly after Float32 emission. Double cells are nonzero, emitted cells retain positive direction, and every child area has positive agreement with the summed performed parent area. This orientation admission checks neither self-intersection nor tissue mechanics.
 *
 * Inputs remain unchanged in common metre/Y-up/Z-forward frame. Returned parent vectors use square metres; returned canonical positions retain the first encountered Double coordinates after Float32 alias admission. Complete captured chart coverage is a plan premise, and normal-star admission occurs separately.
 *
 * @evidence contracts/common.md#principled-implementation Captured topology and canonical IDs bind actual finite performed triangles; exact export-grid alias identity and oriented child/parent area agreement admit the geometry consumed by shading.
 * @evidence contracts/common.md#clear-and-simple-design This owner admits geometry and accumulates areas only; compiled chart coverage and later source/differential normal construction remain separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Changed populations, collapsed/reversed emitted cells and opposing parent-area cells refuse; neutral coordinates or smooth normals do not substitute for current geometry.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre/area units, Float32 versus first Double identity, unchanged inputs and orientation-only scope.
 * @evidence contracts/performance.md#efficient-algorithms Dense finite/export conversion is O(V), topology/area work is O(T), and used-sample maps are O(U); a final cell pass compares parent area without pairwise geometry queries.
 * @evidence contracts/performance.md#reuse-equivalent-work One export conversion per half serves alias and triangle checks, and one parent-area sum serves every incident child's agreement test and downstream shading.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Export buffers, used sets and child vectors are call-local; owned parent-area and canonical-position maps escape to the caller without retaining tasks or source input arrays.
 */
export function evaluateHumanPersonSourceCells(
  props: IAutoMovieHumanPersonSourceCellEvaluationProps,
): IAutoMovieHumanPersonSourceCellEvaluation {
  const {
    plan,
    faceIndices,
    bodyIndices,
    input,
  }: IAutoMovieHumanPersonSourceCellEvaluationProps = props;
  const used: Set<number>[] = [faceIndices, bodyIndices].map(
    (indices: readonly number[]): Set<number> => new Set(indices),
  );
  if (
    input.face.length !== plan.face.samples.length * 3 ||
    input.body.length !== plan.body.samples.length * 3 ||
    input.bodyIndices.length !== bodyIndices.length ||
    [...input.bodyIndices].some(
      (id: number, at: number): boolean => id !== bodyIndices[at],
    )
  )
    throw new Error(
      "Performed person source cells changed population without source lineage.",
    );
  const parentAreas: number[] = new Array<number>(
    plan.face.parentTriangles.length,
  ).fill(0);
  const samples: Map<number, number[]> = new Map<number, number[]>();
  const sourcePositions: Map<number, readonly number[]> = new Map<
    number,
    readonly number[]
  >();
  const cells: IAutoMovieHumanPersonSourceCellArea[] = [];
  const domains: {
    positions: readonly number[];
    indices: readonly number[];
    record: typeof plan.face;
  }[] = [
    { positions: input.face, indices: faceIndices, record: plan.face },
    { positions: input.body, indices: bodyIndices, record: plan.body },
  ];
  for (const [side, domain] of domains.entries()) {
    if (
      [...domain.positions].some(
        (value: number): boolean => !Number.isFinite(value),
      )
    )
      throw new Error(
        "Person source normals need finite performed coordinates.",
      );
    const emittedPositions: number[] = domain.positions.map(Math.fround);
    for (const vertex of used[side]) {
      const id: number = domain.record.samples[vertex];
      const point: number[] = emittedPositions.slice(
        vertex * 3,
        vertex * 3 + 3,
      );
      if (point.some((value: number): boolean => !Number.isFinite(value)))
        throw new Error(
          "Person source samples must survive the renderer's Float32 frame.",
        );
      const existing: number[] | undefined = samples.get(id);
      if (
        existing !== undefined &&
        point.some(
          (value: number, axis: number): boolean => value !== existing[axis],
        )
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
    for (let at: number = 0; at < domain.indices.length; at += 3) {
      const area: ReturnType<typeof triangleAreaVector> = triangleAreaVector(
        domain.positions,
        domain.indices,
        at,
      );
      const vector: number[] = [area.x, area.y, area.z];
      // Float32-representable used coordinates bound area vectors and their
      // finite-array sums within Float64. A zero cell has no normal.
      if (!(Math.hypot(...vector) > 0))
        throw new Error(
          "Person source shading cannot admit a zero performed cell.",
        );
      const emitted: ReturnType<typeof triangleAreaVector> = triangleAreaVector(
        emittedPositions,
        domain.indices,
        at,
      );
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
      const parent: number = domain.record.parents[at / 3] * 3;
      cells.push({ parent, vector });
      for (let axis: number = 0; axis < 3; axis++)
        parentAreas[parent + axis] += vector[axis];
    }
  }
  for (const { parent, vector } of cells)
    if (
      !(
        vector.reduce(
          (sum: number, value: number, axis: number): number =>
            sum + value * parentAreas[parent + axis],
          0,
        ) > 0
      )
    )
      throw new Error(
        "Performed person source cell opposes its complete parent area field.",
      );
  return { parentAreas, sourcePositions };
}
