import type * as THREE from "three";

/**
 * The shadow-map controls the body viewport needs from its WebGL renderer.
 *
 * The viewport enables shadows, selects their type and invalidates the static
 * map on publication, visibility, pass and caster changes.
 *
 * @author Samchon
 */
export interface IConnectedBodyShadowRenderer {
  /** Shadow-map switches the viewport sets and invalidates. */
  shadowMap: Pick<
    THREE.WebGLShadowMap,
    "enabled" | "type" | "autoUpdate" | "needsUpdate"
  >;
}
