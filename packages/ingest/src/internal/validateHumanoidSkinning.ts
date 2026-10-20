import type { IAccessorSource } from "./IAccessorSource";
import type { IExternalModelAccessorReader } from "./IExternalModelAccessorReader";
import { accessorReader } from "./accessorReader";
import { integerIndex } from "./integerIndex";
import { object } from "./object";
import { requiredArray } from "./requiredArray";

/**
 * Check complete mesh/skin bindings and collect joints actually receiving positive weights.
 *
 * Matched VEC4 joints/weights and POSITION counts drive each vertex read. Negative components throw before a finite positive sum establishes weighted coverage. This pass reads only JOINTS_0/WEIGHTS_0; it does not enforce weight-sum normalization, uniqueness of nonzero influences or complete coverage of additional joint sets, and does not establish anatomical validity.
 *
 * @evidence contracts/common.md#principled-implementation Matched VEC4 joint/weight counts drive each vertex read; individual negative weights throw before a finite positive sum establishes coverage.
 * @evidence contracts/common.md#clear-and-simple-design Mesh/skin pairs own weight admission, while the shared accessor reader owns stride, numeric decoding and resident views.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Negative weights cannot be hidden by cancellation with positive weights; malformed bindings throw without guessed or clamped influences.
 * @evidence contracts/common.md#meaningful-documentation Prose states nonnegative influence admission, positive finite total and the unresolved normalization/additional-set limits of this coverage pass.
 * @evidence contracts/performance.md#efficient-algorithms Cost is O(N plus unique bound mesh/skin vertex counts), with four weight reads and up to four joint-index reads per vertex, using expected constant-time membership sets.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated nodes binding the identical mesh/skin pair reuse completed checks within immutable synchronous inspection only.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The per-call pair set and weighted-joint set scale with bindings and joints; no mesh bytes or running resources survive.
 */
export const validateHumanoidSkinning: (props: {
  nodes: unknown[];
  meshes: unknown[];
  skins: unknown[];
  source: IAccessorSource;
}) => Set<number> = (props: {
  nodes: unknown[];
  meshes: unknown[];
  skins: unknown[];
  source: IAccessorSource;
}): Set<number> => {
  let skinnedPrimitiveCount: number = 0;
  const weightedNodes: Set<number> = new Set<number>();
  // Instanced characters bind the same mesh and skin on several nodes; the
  // weights are the same, so each pair is read once.
  const checkedBindings: Set<string> = new Set<string>();
  props.nodes.forEach((value: unknown, nodeIndex: number): void => {
    const node: Record<string, unknown> = object(value, `nodes[${nodeIndex}]`);
    if (node.skin === undefined) return;
    if (node.mesh === undefined)
      throw new Error(
        `nodes[${nodeIndex}] binds a skin without a render mesh.`,
      );
    const skinIndex: number = node.skin as number;
    const meshIndex: number = node.mesh as number;
    const binding: string = `${meshIndex}:${skinIndex}`;
    if (checkedBindings.has(binding)) return;
    checkedBindings.add(binding);
    const joints: unknown[] = requiredArray(
      object(props.skins[skinIndex], `skins[${skinIndex}]`).joints,
      `skins[${skinIndex}].joints`,
    );
    const mesh: Record<string, unknown> = object(
      props.meshes[meshIndex],
      `meshes[${meshIndex}]`,
    );
    requiredArray(mesh.primitives, `meshes[${meshIndex}].primitives`).forEach(
      (primitiveValue: unknown, primitiveIndex: number): void => {
        const path: string = `meshes[${meshIndex}].primitives[${primitiveIndex}]`;
        const primitive: Record<string, unknown> = object(primitiveValue, path);
        const attributes: Record<string, unknown> = object(
          primitive.attributes,
          `${path}.attributes`,
        );
        integerIndex(
          attributes.JOINTS_0,
          props.source.accessors.length,
          `${path}.attributes.JOINTS_0`,
          true,
        );
        integerIndex(
          attributes.WEIGHTS_0,
          props.source.accessors.length,
          `${path}.attributes.WEIGHTS_0`,
          true,
        );
        const jointIndex: number = attributes.JOINTS_0 as number;
        const weightIndex: number = attributes.WEIGHTS_0 as number;
        const position: Record<string, unknown> = object(
          props.source.accessors[attributes.POSITION as number],
          `accessors[${attributes.POSITION as number}]`,
        );
        const jointAccessor: Record<string, unknown> = object(
          props.source.accessors[jointIndex],
          `accessors[${jointIndex}]`,
        );
        const weightAccessor: Record<string, unknown> = object(
          props.source.accessors[weightIndex],
          `accessors[${weightIndex}]`,
        );
        if (
          jointAccessor.type !== "VEC4" ||
          (jointAccessor.componentType !== 5121 &&
            jointAccessor.componentType !== 5123) ||
          weightAccessor.type !== "VEC4" ||
          (weightAccessor.componentType !== 5126 &&
            weightAccessor.componentType !== 5121 &&
            weightAccessor.componentType !== 5123) ||
          (weightAccessor.componentType !== 5126 &&
            weightAccessor.normalized !== true) ||
          jointAccessor.count !== position.count ||
          weightAccessor.count !== position.count
        )
          throw new Error(
            `Skinned primitive ${meshIndex}:${primitiveIndex} needs count-matched JOINTS_0 and normalized WEIGHTS_0 VEC4 accessors.`,
          );
        const readWeight: IExternalModelAccessorReader = accessorReader(
          props.source,
          weightIndex,
          `Skin accessor ${weightIndex}`,
        );
        const readJoint: IExternalModelAccessorReader = accessorReader(
          props.source,
          jointIndex,
          `Skin accessor ${jointIndex}`,
        );
        for (
          let vertex: number = 0;
          vertex < (position.count as number);
          ++vertex
        ) {
          let weightSum: number = 0;
          for (let component: number = 0; component < 4; ++component) {
            const weight: number = readWeight(vertex, component);
            if (weight < 0)
              throw new Error(
                `Skinned primitive ${meshIndex}:${primitiveIndex} vertex ${vertex} component ${component} has negative skin weight ${weight}.`,
              );
            weightSum += weight;
            if (weight > 0 === false) continue;
            const joint: number = readJoint(vertex, component);
            if (Number.isSafeInteger(joint) === false || joint >= joints.length)
              throw new Error(
                `Skinned primitive ${meshIndex}:${primitiveIndex} vertex ${vertex} cites joint ${joint} outside skin ${skinIndex}.`,
              );
            weightedNodes.add(joints[joint] as number);
          }
          if (Number.isFinite(weightSum) === false || weightSum <= 0)
            throw new Error(
              `Skinned primitive ${meshIndex}:${primitiveIndex} vertex ${vertex} has no positive skin weight.`,
            );
        }
        ++skinnedPrimitiveCount;
      },
    );
  });
  if (skinnedPrimitiveCount === 0)
    throw new Error(
      "Humanoid profiles require at least one mesh node with a complete skin binding.",
    );
  return weightedNodes;
};
