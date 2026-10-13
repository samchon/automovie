import type { IAutoMovieSemanticMaskCoverage as AutoMovieSemanticMaskCoverage, IAutoMovieScene, IAutoMovieSemanticMask } from "@automovie/interface";
import type * as THREE from "three";
import { maskRoots } from "./maskRoots.js";
import { nearest } from "./nearest.js";
import { unresolvedOf } from "./unresolvedOf.js";

/**
 * Hold one palette against one built scene, in both directions.
 *
 * This is the join the pipeline was missing. The mask is derived from the
 * compiled artifact and states which drawables one frame commits to; the scene
 * is what a viewer actually assembled. A production can declare a pond, a
 * curtain and a fern bed, compile clean, and render a room with none of them in
 * it, and nothing anywhere goes red, because each half was only ever checked
 * against itself. Holding the two against each other is what turns "declared"
 * into "drawn": an id in `unresolved` exists in the design and in no pixel, and
 * `unaddressed` counts the pixels the palette has no name for.
 *
 * Only entries that claim a drawable are checked for the first. A building
 * unit, a storey, a room, a wall opening and an instanced slot deliberately
 * paint nothing of their own and are reached through `owner`, so listing them
 * would report the whole ownership chain as missing on every well-drawn frame.
 *
 * Nothing here paints, hides, or suspends anything, so a host reads its
 * coverage once at build time and reports it beside every frame, instead of
 * opening a pass boundary it would then have to close.
 *
 * @author Samchon
 */
export const auditAutoMovieSemanticMaskScene = (props: {
  /** The built scene. */
  scene: THREE.Scene;

  /** The design the scene was built from, in its own declaration order. */
  design: IAutoMovieScene;

  /** Palette derived from the same production. */
  mask: IAutoMovieSemanticMask;
}): AutoMovieSemanticMaskCoverage => {
  const roots = maskRoots(props);
  let unaddressed = 0;
  props.scene.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh !== true) return;
    if (nearest(mesh, roots) === undefined) ++unaddressed;
  });
  return { unresolved: unresolvedOf(props.mask, roots), unaddressed };
};
