import { assertHumanSourceSparseStateInput } from "./assertHumanSourceSparseStateInput.ts";
import type { IHumanSourceSample } from "./structures/IHumanSourceSample.ts";

/** Admit original sampled populations before topology or field consumers.
 * Complete finite coordinate/UV buffers and exact native corner spans prevent
 * undefined corners becoming integer zero. Every original raw sparse state
 * shares the decoder's allocation-free admission owner. Empty arrays retain
 * their actual populations; no malformed referenced item is clipped away.
 * This representation boundary certifies no anatomical or clinical geometry.
 * @author Samchon
 */
export function assertHumanSourceSampleBuffers(
  sample: IHumanSourceSample,
): void {
  const count = (value: number): boolean =>
    Number.isSafeInteger(value) && value >= 0;
  const finite = (values: Float64Array): boolean =>
    values.every(Number.isFinite);
  const n = sample.manifest.vertices,
    polygons = sample.manifest.polygons,
    loops = sample.manifest.loops;
  if (
    ![n, polygons, loops, 3 * n, 2 * loops].every(count) ||
    sample.neutral.length !== 3 * n ||
    !finite(sample.neutral) ||
    sample.landmarksNeutral.length !== 3 * sample.manifest.landmarkIds.length ||
    !finite(sample.landmarksNeutral) ||
    sample.loopStart.length !== polygons ||
    sample.loopTotal.length !== polygons ||
    sample.loopVertex.length !== loops ||
    sample.loopUv.length !== 2 * loops ||
    !finite(sample.loopUv) ||
    sample.rowsDelta.length !== 3 * sample.rowsVertex.length ||
    !finite(sample.rowsDelta) ||
    sample.landmarkDelta.length % 3 !== 0 ||
    !finite(sample.landmarkDelta)
  )
    throw new Error(
      "Sample raw populations or finite tuple buffers disagree with their manifest.",
    );
  for (let polygon = 0; polygon < polygons; polygon++) {
    const start = sample.loopStart[polygon],
      total = sample.loopTotal[polygon];
    if (
      !count(start) ||
      !count(total) ||
      total > loops ||
      start > loops - total
    )
      throw new Error(
        `Sample native polygon ${polygon} has an invalid corner span.`,
      );
  }
  for (const vertex of sample.loopVertex)
    if (!count(vertex) || vertex >= n)
      throw new Error(
        "Sample native corner references a nonexistent source vertex.",
      );
  for (const vertex of sample.rowsVertex)
    if (!count(vertex) || vertex >= n)
      throw new Error(
        "Sample raw sparse row references a nonexistent source vertex.",
      );
  if (
    sample.states.size !== sample.manifest.states.length ||
    new Set(sample.manifest.landmarkIds).size !==
      sample.manifest.landmarkIds.length ||
    sample.partPositions.size !== sample.manifest.parts.length
  )
    throw new Error(
      "Sample named native populations contain duplicate identities.",
    );
  for (const state of sample.manifest.states)
    assertHumanSourceSparseStateInput({
      name: state.name,
      vertices: n,
      rowsVertex: sample.rowsVertex,
      rowsDelta: sample.rowsDelta,
      rowOffset: state.rowOffset,
      rowCount: state.rowCount,
      landmarkDelta: sample.landmarkDelta,
      landmarkOffset: state.landmarkOffset,
      landmarkCount: sample.manifest.landmarkIds.length,
    });
  for (const [interior, boundary, operator] of [
    [sample.flattenInterior, sample.flattenBoundary, sample.flattenOperator],
    [sample.genitalInterior, sample.genitalBoundary, sample.genitalOperator],
  ] as const) {
    if (
      !count(interior.length * boundary.length) ||
      operator.length !== interior.length * boundary.length ||
      !finite(operator)
    )
      throw new Error(
        "Sample source fill operator disagrees with its original row/column population.",
      );
    for (const vertex of [...interior, ...boundary])
      if (!count(vertex) || vertex >= n)
        throw new Error(
          "Sample source fill operator has an invalid native address.",
        );
  }
  for (const part of sample.manifest.parts)
    for (const [level, values] of sample.partPositions.get(part.id)!) {
      const vertices = part.vertices[level],
        expected = 3 * vertices * sample.manifest.partStates.length;
      if (
        !count(vertices) ||
        !count(expected) ||
        values.length !== expected ||
        !finite(values)
      )
        throw new Error(
          `Sample part ${part.id} level ${level} has an invalid native tuple population.`,
        );
    }
}
