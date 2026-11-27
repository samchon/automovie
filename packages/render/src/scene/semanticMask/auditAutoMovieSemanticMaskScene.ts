import type {
  IAutoMovieSemanticMaskCoverage as AutoMovieSemanticMaskCoverage,
  IAutoMovieScene,
  IAutoMovieSemanticMask,
} from "@automovie/interface";
import type * as THREE from "three";

import { AutoMovieThreeKind } from "../AutoMovieThreeKind.js";
import { maskRoots } from "./internal/maskRoots.js";
import { nearest } from "./internal/nearest.js";
import { unresolvedOf } from "./internal/unresolvedOf.js";

/**
 * Join a supplied palette to assembled scene roots in both directions without
 * painting or mutating the scene. Unresolved lists drawable entries with no
 * claimed object root; unaddressed counts Mesh objects lacking a nearest
 * semantic owner, including hidden geometry. Ownership-only room/opening/slot
 * entries do not require their own drawable. Empty unresolved establishes root
 * membership, while actual visibility, submission and pixels remain separate
 * observations; a cached build audit needs renewal after relevant graph
 * changes.
 */
export const auditAutoMovieSemanticMaskScene: (props: {
  /** The built scene. */
  scene: THREE.Scene;

  /** The design the scene was built from, in its own declaration order. */
  design: IAutoMovieScene;

  /** Palette derived from the same production. */
  mask: IAutoMovieSemanticMask;
}) => AutoMovieSemanticMaskCoverage = (props: {
  /** The built scene. */
  scene: THREE.Scene;

  /** The design the scene was built from, in its own declaration order. */
  design: IAutoMovieScene;

  /** Palette derived from the same production. */
  mask: IAutoMovieSemanticMask;
}): AutoMovieSemanticMaskCoverage => {
  const roots: ReturnType<typeof maskRoots> = maskRoots(props);
  let unaddressed: number = 0;
  props.scene.traverse((object: THREE.Object3D): void => {
    if (!AutoMovieThreeKind.isMesh(object)) return;
    if (nearest(object, roots) === undefined) ++unaddressed;
  });
  return { unresolved: unresolvedOf(props.mask, roots), unaddressed };
};
