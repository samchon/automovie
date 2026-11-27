import type { IAutoMovieSemanticMaskCoverage as AutoMovieSemanticMaskCoverage } from "@automovie/interface";
import type * as THREE from "three";
import type { AutoMovieRenderSemanticMask } from "../../AutoMovieRenderSemanticMask";

import { AutoMovieRenderThreeKind } from "../../AutoMovieRenderThreeKind";
import { maskRoots } from "./maskRoots";
import { nearest } from "./nearest";
import { unresolvedOf } from "./unresolvedOf";

/*
 * Join a supplied palette to assembled scene roots in both directions without
 * painting or mutating the scene. Unresolved lists drawable entries with no
 * claimed object root; unaddressed counts Mesh objects lacking a nearest
 * semantic owner, including hidden geometry. Ownership-only room/opening/slot
 * entries do not require their own drawable. Empty unresolved establishes root
 * membership, while actual visibility, submission and pixels remain separate
 * observations; a cached build audit needs renewal after relevant graph
 * changes.
 */
export function auditSemanticMaskSceneImplementation(props: AutoMovieRenderSemanticMask.IAuditSceneProps): AutoMovieSemanticMaskCoverage {
  const roots: ReturnType<typeof maskRoots> = maskRoots(props);
  let unaddressed: number = 0;
  props.scene.traverse((object: THREE.Object3D): void => {
    if (!AutoMovieRenderThreeKind.isMesh(object)) return;
    if (nearest(object, roots) === undefined) ++unaddressed;
  });
  return { unresolved: unresolvedOf(props.mask, roots), unaddressed };
}
