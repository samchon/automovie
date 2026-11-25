import type { IAutoMovieNode } from "@automovie/interface";

/** A group node under a parent at a local place, no rotation and unit scale. */
const place: (
  id: string,
  parent: string | null,
  x: number,
  y: number,
  z: number,
) => IAutoMovieNode = (
  id: string,
  parent: string | null,
  x: number,
  y: number,
  z: number,
): IAutoMovieNode => ({
  id,
  name: null,
  parent,
  kind: "group",
  transform: {
    translation: { x, y, z },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  mesh: null,
  camera: null,
  light: null,
  skin: null,
});

/**
 * A small typed scene of five group nodes for the resolve and render tests: an
 * arm `root` -> `mid` -> `tip` of two 1 m segments along +X, a `goal` 2 m above
 * the origin, and a `ball` 3 m along +Z under the root.
 *
 * @returns Fresh nodes, each a local place with no rotation and unit scale.
 */
export const resolveScene: () => IAutoMovieNode[] = (): IAutoMovieNode[] => [
  place("root", null, 0, 0, 0),
  place("mid", "root", 1, 0, 0),
  place("tip", "mid", 1, 0, 0),
  place("goal", null, 0, 2, 0),
  place("ball", "root", 0, 0, 3),
];
