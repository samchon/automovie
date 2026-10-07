import type { IHumanSourceAuthoredEndpointInput } from "./structures/IHumanSourceAuthoredEndpointInput.ts";

/**
 * Read a verified provider recipe or transport a declared historical residual.
 * Recipe recovery owns whether the first branch applies and its common frame
 * shift. Otherwise each retained original native point keeps its displacement;
 * appended points use the provider's explicit original-native support weights.
 * This second branch is the existing prototype transport convention, never
 * upstream regeneration or measured expression. Retired points are not emitted.
 * Head and body cut interpolation remains with the consuming partition.
 */
export function readHumanSourceAuthoredEndpoint(input: IHumanSourceAuthoredEndpointInput): Float64Array {
  if (input.recipe !== undefined) {
    if (input.shiftMetres === undefined) throw new Error(`Recovered face endpoint ${input.name} has no original frame shift.`);
    const delta = input.reader.skin(input.recipe);
    for (let at = 0; at < delta.length; at++) delta[at] -= input.shiftMetres[at % 3];
    return delta;
  }
  const originalDelta = new Float64Array(3 * (input.original.originalVertices + input.original.intersections.length));
  for (let at = 0; at < input.originalRows.length; at += 4) originalDelta.set(input.originalRows.slice(at + 1, at + 4), 3 * input.originalRows[at]);
  const binding = new Map(input.packet.appendedBindings.map((record) => [record.id, record.nativeParents]));
  const delta = new Float64Array(3 * input.root.topology.vertexCount);
  input.root.sourceToNative.forEach((native, vertex) => {
    const parents = native < input.original.originalVertices ? [{ id: native, weight: 1 }] : binding.get(native);
    if (parents === undefined) throw new Error(`Carried endpoint ${input.name} has no support for appended native point ${native}.`);
    for (const parent of parents) for (let axis = 0; axis < 3; axis++) delta[3 * vertex + axis] += parent.weight * originalDelta[3 * parent.id + axis];
  });
  return delta;
}
