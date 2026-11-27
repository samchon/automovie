import {
  type IAutoMovieLowerSkeletonNodes,
  IAutoMovieNode,
} from "@automovie/interface";

import { AutoMovieEngineTransform } from "../../math/AutoMovieEngineTransform";
import { AutoMovieEngineMotionRootNodeId } from "../AutoMovieEngineMotionRootNodeId";

/*
 * Lower an admitted skeleton into a fresh identity group root and bone rest
 * nodes. Prefixes concatenate onto node/parent ids and rootParent seats the
 * synthetic root under a placement. Root records are independent; bone rest
 * translation/rotation are borrowed and bone scales are fresh unit vectors.
 */
export function lowerSkeletonNodes(
  props: IAutoMovieLowerSkeletonNodes.IProps,
): IAutoMovieNode[] {
  const prefix: string = props.prefix ?? "";
  const rootId: string = `${prefix}${AutoMovieEngineMotionRootNodeId}`;
  const nodes: IAutoMovieNode[] = [
    {
      id: rootId,
      name: null,
      parent: props.rootParent ?? null,
      kind: "group",
      transform: AutoMovieEngineTransform.identity(),
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
      transform: AutoMovieEngineTransform.of(bone.rest.translation, bone.rest.rotation),
      mesh: null,
      camera: null,
      light: null,
      skin: null,
    });
  return nodes;
}
