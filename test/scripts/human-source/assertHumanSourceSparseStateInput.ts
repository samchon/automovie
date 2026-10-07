import type { IHumanSourceSparseStateInput } from "./structures/IHumanSourceSparseStateInput.ts";

/** Admit an original native state before rotation or active-root retirement.
 * Counts and offsets address complete element tuples. Ordered native rows
 * remain unique and every used delta is finite; empty spans retain emptiness.
 * Admission allocates no dense field and changes no source coordinate.
 * @author Samchon
 */
export function assertHumanSourceSparseStateInput(input: IHumanSourceSparseStateInput): void {
  const span = (offset: number, count: number, length: number): boolean =>
    Number.isSafeInteger(offset) && Number.isSafeInteger(count) &&
    Number.isSafeInteger(length) && offset >= 0 && count >= 0 &&
    count <= length && offset <= length - count;
  if (!Number.isSafeInteger(input.vertices) || input.vertices < 0 ||
      !Number.isSafeInteger(3 * input.vertices) ||
      input.rowsDelta.length !== 3 * input.rowsVertex.length ||
      input.landmarkDelta.length % 3 !== 0 ||
      !span(input.rowOffset, input.rowCount, input.rowsVertex.length) ||
      !span(input.landmarkOffset, input.landmarkCount, input.landmarkDelta.length / 3))
    throw new Error(`Source state ${input.name} has an invalid native row or landmark span.`);
  let previous = -1;
  for (let row = input.rowOffset; row < input.rowOffset + input.rowCount; row++) {
    const vertex = input.rowsVertex[row];
    if (!Number.isSafeInteger(vertex) || vertex <= previous || vertex >= input.vertices ||
        !Number.isFinite(input.rowsDelta[3 * row]) ||
        !Number.isFinite(input.rowsDelta[3 * row + 1]) || !Number.isFinite(input.rowsDelta[3 * row + 2]))
      throw new Error(`Source state ${input.name} has an invalid native sparse row ${row}.`);
    previous = vertex;
  }
  for (let landmark = 0; landmark < input.landmarkCount; landmark++)
    if (!Number.isFinite(input.landmarkDelta[3 * (input.landmarkOffset + landmark)]) ||
        !Number.isFinite(input.landmarkDelta[3 * (input.landmarkOffset + landmark) + 1]) ||
        !Number.isFinite(input.landmarkDelta[3 * (input.landmarkOffset + landmark) + 2]))
      throw new Error(`Source state ${input.name} has a nonfinite landmark ${landmark}.`);
}
