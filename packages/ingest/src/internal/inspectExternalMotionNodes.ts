import type { IAutoMovieExternalMotionNodeInspection } from "../IAutoMovieExternalMotionNodeInspection";
import { finiteTuple } from "./finiteTuple";
import { object } from "./object";

/**
 * Read glTF motion nodes as finite canonical local TRS records.
 *
 * The caller supplies a validated acyclic parent table. Omitted translation, rotation and scale use glTF defaults; present tuples must be finite, scales positive and quaternion magnitude within 1e-4 of one before normalization. Matrix transforms throw instead of being decomposed. Records use source-index ids, null for absent/empty names or root parents, and fresh transform objects.
 *
 * @evidence contracts/common.md#principled-implementation Three/four-component tuples use glTF defaults; positive scale and unit-quaternion tolerance precede rotation normalization.
 * @evidence contracts/common.md#clear-and-simple-design Node interpretation owns stable index ids, parent ids and local transforms, separate from animation channel decoding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Matrix transforms are refused rather than decomposed; rig names do not invent skeletal semantics.
 * @evidence contracts/common.md#meaningful-documentation Prose states defaults, matrix refusal, positive scale, quaternion normalization and absent name/parent meaning.
 * @evidence contracts/performance.md#efficient-algorithms N nodes require O(N) time and output records, with fixed-size tuple work per node.
 * @evidence contracts/performance.md#reuse-equivalent-work The admitted parent table is reused from structural hierarchy checks; each node transform is interpreted once per inspection.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned node records own new fixed-size transforms; source JSON arrays and tuple temporaries are not retained.
 * @author Samchon
 */
export const inspectExternalMotionNodes: (
  values: unknown[],
  parentByIndex: readonly (number | undefined)[],
) => IAutoMovieExternalMotionNodeInspection[] = (
  values: unknown[],
  parentByIndex: readonly (number | undefined)[],
): IAutoMovieExternalMotionNodeInspection[] =>
  values.map(
    (value: unknown, index: number): IAutoMovieExternalMotionNodeInspection => {
      const node: Record<string, unknown> = object(value, `nodes[${index}]`);
      if (node.matrix !== undefined)
        throw new Error(
          `nodes[${index}].matrix is unsupported by the glTF motion interpretation profile; declare translation, rotation, and scale explicitly.`,
        );
      if (node.name !== undefined && typeof node.name !== "string")
        throw new Error(`nodes[${index}].name must be a string.`);
      const translation: number[] = finiteTuple(
        node.translation,
        `nodes[${index}].translation`,
        [0, 0, 0],
      );
      const rotation: number[] = finiteTuple(
        node.rotation,
        `nodes[${index}].rotation`,
        [0, 0, 0, 1],
      );
      const scale: number[] = finiteTuple(
        node.scale,
        `nodes[${index}].scale`,
        [1, 1, 1],
      );
      if (scale.some((component: number): boolean => component <= 0))
        throw new Error(
          `nodes[${index}].scale must contain only positive values.`,
        );
      const magnitude: number = Math.hypot(...rotation);
      if (Math.abs(magnitude - 1) > 1e-4)
        throw new Error(`nodes[${index}].rotation must be a unit quaternion.`);
      const parent: number | undefined = parentByIndex[index];
      return {
        id: `node_${index}`,
        index,
        name:
          typeof node.name === "string" && node.name.length !== 0
            ? node.name
            : null,
        parent: parent === undefined ? null : `node_${parent}`,
        transform: {
          translation: {
            x: translation[0]!,
            y: translation[1]!,
            z: translation[2]!,
          },
          rotation: {
            x: rotation[0]! / magnitude,
            y: rotation[1]! / magnitude,
            z: rotation[2]! / magnitude,
            w: rotation[3]! / magnitude,
          },
          scale: { x: scale[0]!, y: scale[1]!, z: scale[2]! },
        },
      };
    },
  );
