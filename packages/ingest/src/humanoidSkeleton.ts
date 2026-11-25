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
 * Retarget a parsed glTF's skins onto a normalized humanoid
 * {@link IAutoMovieSkeleton} by matching joint names to
 * {@link AutoMovieHumanoidBone} slots.
 *
 * This naming-based mapper currently has test callers in this repository.
 * Production motion adoption uses an explicit mapping against inspected nodes,
 * so this export does not establish a production rig-inference flow.
 *
 * Every skin is read in document order and the first joint to claim a slot
 * keeps it, because exporters bind clothes, hair and accessories as separate
 * skins in no guaranteed order and the body rig must be found wherever it sits.
 * A joint name maps through the supported Blender-style, Mixamo, VRM-style and
 * Unreal mannequin aliases; fingers, eyes and jaw are not mapped.
 *
 * The hierarchy is rebuilt over mapped joints only: a bone's parent is its
 * nearest mapped ancestor in the node tree, and the local TRS of every skipped
 * helper node between them composes into the bone's rest, because
 * {@link IAutoMovieBone.rest} is relative to `parent` and a dropped helper
 * offset or roll would misplace every bone beneath it. With finite
 * unit-quaternion TRS inputs, composition represents the affine product up to
 * floating-point rounding when each helper scale commutes with its child
 * rotation; otherwise it drops shear. This mapper does not admit or normalize
 * raw node TRS. A root bone keeps its own local TRS, since armature and scene
 * transforms belong to the imported object rather than the skeleton. Bones
 * carry no constraint.
 *
 * @param doc Parsed document; it is only read.
 * @param skeletonId Id copied verbatim to the returned skeleton; defaults to
 *   "skeleton" and is not validated here.
 * @returns The skeleton with bones in first-claim order, or `null` when no skin
 *   joint maps to the required `hips` slot.
 * @throws {Error} When a mapped joint's ancestors loop, which no glTF node
 *   hierarchy may.
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

    // glTF's node hierarchy is a set of disjoint strict trees (glTF 2.0,
    // section 3.5, "Nodes and Hierarchy"), so the walk meets each ancestor
    // once and ends after at most every node; a document whose children
    // loop, which glTF-transform's `addChild` does not prevent, is refused
    // instead of circled.
    const walked: Set<GLTFNode> = new Set<GLTFNode>([node]);
    let ancestor: GLTFNode | undefined = parentNode.get(node);
    let parent: AutoMovieHumanoidBone | null = null;
    while (ancestor !== undefined) {
      if (walked.has(ancestor))
        throw new Error(
          `glTF node "${node.getName()}" has an ancestor cycle through "${ancestor.getName()}"`,
        );
      walked.add(ancestor);
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
