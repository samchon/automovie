import type { IHumanSourceSparseState } from "./structures/IHumanSourceSparseState.ts";
import type { IHumanSourceSparseStateInput } from "./structures/IHumanSourceSparseStateInput.ts";
import { assertHumanSourceSparseStateInput } from "./assertHumanSourceSparseStateInput.ts";

/** Decode one complete sparse native span without clipping or silent writes.
 * Every offset/count, native identity and delta is admitted before active-root
 * retirement can omit a row. Ordered native rows are unique. Rotation to the
 * public head/body frame is [X,Z,-Y], with no positional translation.
 * Empty row/landmark populations are valid; malformed spans and arithmetic
 * refuse by state rather than becoming zero fields or wrapped native indices.
 * @author Samchon
 */
export function decodeHumanSourceSparseState(input: IHumanSourceSparseStateInput): IHumanSourceSparseState {
  assertHumanSourceSparseStateInput(input);
  const vertices: number[] = [], deltas: number[] = [];
  for (let row = input.rowOffset; row < input.rowOffset + input.rowCount; row++) {
    const vertex = input.rowsVertex[row];
    const xyz = [input.rowsDelta[3 * row], input.rowsDelta[3 * row + 2], -input.rowsDelta[3 * row + 1]];
    vertices.push(vertex);
    deltas.push(...xyz);
  }
  const landmarks = new Float64Array(3 * input.landmarkCount);
  for (let landmark = 0; landmark < input.landmarkCount; landmark++) {
    const at = 3 * (input.landmarkOffset + landmark);
    const xyz = [input.landmarkDelta[at], input.landmarkDelta[at + 2], -input.landmarkDelta[at + 1]];
    landmarks.set(xyz, 3 * landmark);
  }
  return { vertices, deltas, landmarks };
}
