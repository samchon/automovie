import { buildHumanSourceAuthoredCut } from "./buildHumanSourceAuthoredCut.ts";
import { pruneHumanSourceWeights } from "./pruneHumanSourceWeights.ts";
import type { IHumanSourceAuthoredSkin } from "./structures/IHumanSourceAuthoredSkin.ts";
import type { IHumanSourceAuthoredSkinInput } from "./structures/IHumanSourceAuthoredSkinInput.ts";

/**
 * Derive neutral root and both P1 views from provider coordinates alone.
 * Frozen cut stencils interpolate the new root once for both views. Native
 * rig and facial attachment weights follow explicit appended-point support;
 * no published neutral or old surface replaces the provider. New offsets are
 * source-authored rest geometry, not a clinical or performed-motion claim.
 * The source compiler consumes these views before rebuilding registrations,
 * endpoints, normals and attached parts on their new address space.
 */
export function buildHumanSourceAuthoredSkin(
  input: IHumanSourceAuthoredSkinInput,
): IHumanSourceAuthoredSkin {
  const partition = buildHumanSourceAuthoredCut(input);
  const { cut } = partition;
  const count = input.root.topology.vertexCount;
  const positions = new Float64Array(3 * (count + cut.intersections.length));
  positions.set(input.root.topology.positions);
  cut.intersections.forEach((sample, index) => {
    for (let axis = 0; axis < 3; axis++)
      positions[3 * (count + index) + axis] =
        (1 - sample.t) * positions[3 * sample.a + axis] +
        sample.t * positions[3 * sample.b + axis];
  });
  const bindings = new Map(
    input.bindings.map((binding) => [binding.id, binding]),
  );
  const blend = (
    stencil: readonly (readonly [number, number])[],
    rows: readonly [string, number][][],
  ): [string, number][] => {
    const result = new Map<string, number>();
    for (const [parent, fraction] of stencil) {
      const source = rows[parent];
      if (source === undefined)
        throw new Error(`Native support ${parent} has no rig weight record.`);
      for (const [bone, weight] of source)
        result.set(bone, (result.get(bone) ?? 0) + fraction * weight);
    }
    return [...result].filter(([, weight]) => weight > 0);
  };
  const remap = (rows: [string, number][][]): [string, number][][] => {
    const result = Array.from(input.root.sourceToNative, (native) => {
      if (native < input.original.originalVertices) return rows[native];
      const binding = bindings.get(native);
      if (
        binding === undefined ||
        binding.nativeParents.length === 0 ||
        binding.nativeParents.some(
          (parent) =>
            parent.id < 0 ||
            parent.id >= input.original.originalVertices ||
            !Number.isFinite(parent.weight) ||
            parent.weight < 0,
        ) ||
        Math.abs(
          binding.nativeParents.reduce(
            (sum, parent) => sum + parent.weight,
            0,
          ) - 1,
        ) > 1e-12
      )
        throw new Error(
          `Appended native point ${native} lacks a normalized original support stencil.`,
        );
      return blend(
        binding.nativeParents.map((parent) => [parent.id, parent.weight]),
        rows,
      );
    });
    for (const sample of cut.intersections)
      result.push(
        blend(
          [
            [sample.a, 1 - sample.t],
            [sample.b, sample.t],
          ],
          result,
        ),
      );
    return result;
  };
  const bones = remap(input.weights.bones).map(pruneHumanSourceWeights);
  const attachments = remap(input.weights.attachments);
  const pick = (samples: Int32Array): Float64Array =>
    Float64Array.from(
      Array.from(samples).flatMap((vertex) =>
        Array.from(positions.subarray(3 * vertex, 3 * vertex + 3)),
      ),
    );
  return {
    partition,
    positions,
    bones,
    attachments,
    headPositions: pick(cut.faceToG1),
    bodyPositions: pick(cut.p1BodyToG1),
    headBones: Array.from(cut.faceToG1, (vertex) => bones[vertex]),
    bodyBones: Array.from(cut.p1BodyToG1, (vertex) => bones[vertex]),
    headAttachments: Array.from(cut.faceToG1, (vertex) => attachments[vertex]),
    bodyAttachments: Array.from(
      cut.p1BodyToG1,
      (vertex) => attachments[vertex],
    ),
  };
}
