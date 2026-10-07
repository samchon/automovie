import type * as THREE from "three";

/**
 * The shadow-map controls the body viewport needs from its WebGL renderer.
 *
 * The viewport enables shadows, selects their type and invalidates the static
 * map on publication, visibility, pass and caster changes.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Lets the display stage keep the committed body's shadows current.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Gives the viewport static shadow invalidation without other renderer access.
 * @author Samchon
 */
export interface IConnectedBodyShadowRenderer {
  /**
   * Shadow-map switches the viewport sets and invalidates.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Shows shadows under the posed body.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Exposes only enable, type, auto-update and needs-update control.
   */
  shadowMap: Pick<
    THREE.WebGLShadowMap,
    "enabled" | "type" | "autoUpdate" | "needsUpdate"
  >;
}
