import type { IHumanFaceHairRootReference } from "./IHumanFaceHairRootReference";

/**
 * Original root-feature support and proximity on one owned current collider snapshot.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootBoundary {
  /** Resolve original resident face ordinals incident on the root's actual support. */
  resolve: (root: IHumanFaceHairRootReference) => number[];

  /** Unsigned distance to one named original face, in current head-frame metres. */
  distance: (triangle: number, point: readonly number[]) => number;
}
