import {
  type IAutoMovieNode,
  type IAutoMovieTransform,
} from "@automovie/interface";

const IDENTITY: IAutoMovieTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

/** Create the existing group-node fixture, borrowing the supplied transform or the original shared identity transform. */
export function createDriverNode(
  id: string,
  transform: IAutoMovieTransform = IDENTITY,
): IAutoMovieNode {
  return {
    id,
    name: null,
    parent: null,
    kind: "group",
    transform,
    mesh: null,
    camera: null,
    light: null,
    skin: null,
  };
}
