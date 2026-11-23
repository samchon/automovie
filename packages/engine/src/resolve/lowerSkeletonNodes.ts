import {
  type IAutoMovieLowerSkeletonNodes,
  IAutoMovieNode,
} from "@automovie/interface";

import { Transform } from "../math/Transform";
import { MOTION_ROOT_NODE_ID } from "./constants/MOTION_ROOT_NODE_ID";

/**
 * Lower an admitted skeleton into a fresh identity group root and bone rest
 * nodes. Prefixes concatenate onto node/parent ids and rootParent seats the
 * synthetic root under a placement. Root records are independent; bone rest
 * translation/rotation are borrowed and bone scales are fresh unit vectors.
 */
export const lowerSkeletonNodes: (
  props: IAutoMovieLowerSkeletonNodes.IProps,
) => IAutoMovieNode[] = (
  props: IAutoMovieLowerSkeletonNodes.IProps,
): IAutoMovieNode[] => {
  const prefix: string = props.prefix ?? "";
  const rootId: string = `${prefix}${MOTION_ROOT_NODE_ID}`;
  const nodes: IAutoMovieNode[] = [
    {
      id: rootId,
      name: null,
      parent: props.rootParent ?? null,
      kind: "group",
      transform: Transform.identity(),
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
      transform: Transform.of(bone.rest.translation, bone.rest.rotation),
      mesh: null,
      camera: null,
      light: null,
      skin: null,
    });
  return nodes;
};
