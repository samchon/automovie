import { IAutoMovieNode, IAutoMovieSkeleton } from "@automovie/interface";

import { MOTION_ROOT_NODE_ID } from "./constants/MOTION_ROOT_NODE_ID";

/**
 * Lower an admitted skeleton into a fresh identity group root and bone rest nodes. Prefixes concatenate onto node/parent ids and rootParent seats the synthetic root under a placement. Root records are independent; bone rest translation/rotation are borrowed and bone scales are fresh unit vectors.
 *
 * @evidence contracts/common.md#principled-implementation Lower admitted bones beneath a fresh identity root, prefixing bone/parent ids and borrowing rest translation/rotation; composeScene separately admits graph uniqueness and cycles.
 * @evidence contracts/common.md#clear-and-simple-design One bridge joins scene lowering to motion clip naming, with the caller explicitly choosing prefix and root parent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fresh nested root records prevent one lowering's mutation from contaminating another; bone rest data stays borrowed rather than silently cloned or repaired.
 * @evidence contracts/common.md#meaningful-documentation Props document defaults, root placement and rest ownership; the output contains nodes rather than geometry or current motion state.
 * @evidence contracts/performance.md#efficient-algorithms B bones require O(B) new node wrappers and id text, with fixed-size transforms and one root.
 * @evidence contracts/performance.md#reuse-equivalent-work Scene/motion consumers share naming; changed mutable skeleton contents require new lowering instead of an identity-only cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns node/root records and the skeleton owns borrowed rest data; no native node, handle or task is retained.
 */
export const lowerSkeletonNodes: (props: { skeleton: IAutoMovieSkeleton; prefix?: string; rootParent?: string | null; }) => IAutoMovieNode[] = (props: {
  /** The rig to lower. */
  skeleton: IAutoMovieSkeleton;
  /** Node-id prefix for every lowered node. Defaults to `""` (bare names). */
  prefix?: string;
  /** Parent node id for the synthetic root, or `null` for a graph root. */
  rootParent?: string | null;
}): IAutoMovieNode[] => {
  const prefix: string = props.prefix ?? "";
  const rootId: string = `${prefix}${MOTION_ROOT_NODE_ID}`;
  const nodes: IAutoMovieNode[] = [
    {
      id: rootId,
      name: null,
      parent: props.rootParent ?? null,
      kind: "group",
      transform: {
        translation: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
      mesh: null,
      camera: null,
      light: null,
      skin: null,
    },
  ];
  for (const bone of props.skeleton.bones)
    nodes.push({
      id: `${prefix}${bone.bone}`,
      name: null,
      parent: bone.parent === null ? rootId : `${prefix}${bone.parent}`,
      kind: "bone",
      transform: {
        translation: bone.rest.translation,
        rotation: bone.rest.rotation,
        scale: { x: 1, y: 1, z: 1 },
      },
      mesh: null,
      camera: null,
      light: null,
      skin: null,
    });
  return nodes;
};
