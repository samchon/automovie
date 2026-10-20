import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";
import type {
  Document,
  Node as GLTFNode,
  Skin,
  vec3,
  vec4,
} from "@gltf-transform/core";

import { composeLocalTransform } from "./internal/composeLocalTransform";
import { humanoidBoneOfName } from "./internal/humanoidBoneOfName";

/**
 * Retarget a parsed glTF's skins onto a normalized humanoid {@link IAutoMovieSkeleton} by matching joint names to {@link AutoMovieHumanoidBone} slots.
 *
 * This naming-based mapper currently has test callers in this repository. Production motion adoption uses an explicit mapping against inspected nodes, so this export does not establish a production rig-inference flow.
 *
 * Every skin is read in document order and the first joint to claim a slot keeps it, because exporters bind clothes, hair and accessories as separate skins in no guaranteed order and the body rig must be found wherever it sits. A joint name maps through the supported Blender-style, Mixamo, VRM-style and Unreal mannequin aliases; fingers, eyes and jaw are not mapped.
 *
 * The hierarchy is rebuilt over mapped joints only: a bone's parent is its nearest mapped ancestor in the node tree, and the local TRS of every skipped helper node between them composes into the bone's rest, because {@link IAutoMovieBone.rest} is relative to `parent` and a dropped helper offset or roll would misplace every bone beneath it. With finite unit-quaternion TRS inputs, composition represents the affine product up to floating-point rounding when each helper scale commutes with its child rotation; otherwise it drops shear. This mapper does not admit or normalize raw node TRS. A root bone keeps its own local TRS, since armature and scene transforms belong to the imported object rather than the skeleton. Bones carry no constraint.
 *
 * @param doc Parsed document; it is only read.
 * @param skeletonId Id for the returned skeleton.
 * @returns The skeleton with bones in first-claim order, or `null` when no skin joint maps to the required `hips` slot.
 *
 * @evidence contracts/common.md#principled-implementation Slots come from a normalized alias table, the hierarchy from a child-to-parent map walked to the nearest mapped ancestor, and each rest from composing skipped helper TRS with `composeLocalTransform`; that composition drops the shear a non-uniform helper scale under a rotated child would need, the limitation the documentation states.
 * @evidence contracts/common.md#clear-and-simple-design The function owns slot claiming and hierarchy rebuilding, while name normalization and transform composition live in internal modules the byte inspector and motion adoption share, so the alias table and the composition formula each exist once.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias table is this importer's declared naming vocabulary, not proof of bone anatomy; the table is a `Map`, so a joint named after an `Object.prototype` member such as `constructor` maps to nothing instead of an inherited function, and first-claim order is the documented rule for duplicate slots.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the every-skin first-claim rule and its reason, the covered naming conventions and unmapped fingers, eyes and jaw, the helper composition and its exactness, the root-bone exception, the null cases, and that constraints are left empty.
 * @evidence contracts/performance.md#efficient-algorithms Work follows skins and joints, joint-name text normalization, nodes and child links, and each mapped bone's walk to the nearest mapped ancestor; hash lookups have expected constant cost, while each helper walk may revisit ancestors.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Slot and parent maps are call-local; repeated ancestor walks remain bounded by mapped slots and document depth, while mutable Document contents and the requested skeleton id preclude a retained identity-only cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The slot and parent maps and the helper arrays are local and released on return or throw; the returned skeleton holds new transform objects proportional to the mapped bones, at most the humanoid slot count, owned by the caller.
 */
export const humanoidSkeleton: (
  doc: Document,
  skeletonId?: string,
) => IAutoMovieSkeleton | null = (
  doc: Document,
  skeletonId: string = "skeleton",
): IAutoMovieSkeleton | null => {
  const skins: Skin[] = doc.getRoot().listSkins();
  if (skins.length === 0) return null;

  const slotByNode: Map<GLTFNode, AutoMovieHumanoidBone> = new Map<
    GLTFNode,
    AutoMovieHumanoidBone
  >();
  const used: Set<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>();
  for (const skin of skins)
    for (const joint of skin.listJoints()) {
      const slot: AutoMovieHumanoidBone | undefined = humanoidBoneOfName(
        joint.getName(),
      );
      if (slot !== undefined && used.has(slot) === false) {
        slotByNode.set(joint, slot);
        used.add(slot);
      }
    }
  if (used.has("hips") === false) return null;

  const parentNode: Map<GLTFNode, GLTFNode> = new Map<GLTFNode, GLTFNode>();
  for (const node of doc.getRoot().listNodes())
    for (const child of node.listChildren()) parentNode.set(child, node);

  const bones: IAutoMovieBone[] = [];
  for (const [node, slot] of slotByNode) {
    const helpers: GLTFNode[] = [];
    let ancestor: GLTFNode | undefined = parentNode.get(node);
    let parent: AutoMovieHumanoidBone | null = null;
    while (ancestor !== undefined) {
      const mapped: AutoMovieHumanoidBone | undefined =
        slotByNode.get(ancestor);
      if (mapped !== undefined) {
        parent = mapped;
        break;
      }
      helpers.push(ancestor);
      ancestor = parentNode.get(ancestor);
    }
    let rest: IAutoMovieTransform = localTransform(node);
    if (parent !== null)
      for (const helper of helpers)
        rest = composeLocalTransform(localTransform(helper), rest);
    bones.push({ bone: slot, parent, rest, constraint: null });
  }
  return { id: skeletonId, bones };
};

const localTransform: (node: GLTFNode) => IAutoMovieTransform = (
  node: GLTFNode,
): IAutoMovieTransform => {
  const t: vec3 = node.getTranslation();
  const r: vec4 = node.getRotation();
  const s: vec3 = node.getScale();
  return {
    translation: { x: t[0], y: t[1], z: t[2] },
    rotation: { x: r[0], y: r[1], z: r[2], w: r[3] },
    scale: { x: s[0], y: s[1], z: s[2] },
  };
};
