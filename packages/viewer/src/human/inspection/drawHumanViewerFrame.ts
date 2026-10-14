import { PCFShadowMap, PCFSoftShadowMap } from "three";

/**
 * Apply the viewport's owned display settings before using the shared renderer. Product stages retain their own exposure and shadow refresh state. Three 186 interprets the retired soft-PCF choice as PCF only during a shadow refresh; normalize that documented equivalent before shader selection, including a cached frame whose shadows need no refresh. Otherwise comparison samplers can be used with non-comparison shader variants after a scene switch.
 *
 * @evidence contracts/common.md#principled-implementation Viewport-owned color/tone/shadow settings are installed on the shared renderer before its actual draw, with Three's soft-PCF alias normalized before shader selection.
 * @evidence contracts/common.md#clear-and-simple-design A settings transfer, one draw callback and returned shadow-refresh state adapt an existing renderer rather than another render pass.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A cached frame does not depend on an absent shadow refresh to normalize soft-PCF shader selection, and the adapter preserves the viewport's exposure rather than borrowing another resident's state.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies shared-renderer ownership and the comparison-sampler mismatch prevented by normalizing the documented Three alias.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Fixed setting assignments introduce no scene traversal or rendering algorithm; actual draw work belongs to the supplied renderer callback.
 * @evidence contracts/performance.md#reuse-equivalent-work Residents share the renderer capability but restore their own settings before each draw; soft-PCF normalization uses the existing equivalent Three shadow method rather than a new cache key.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Settings and renderer are borrowed for this synchronous call and the adapter creates no texture, target or listener.
 */
export function drawHumanViewerFrame(
  settings: {
    outputColorSpace: string;
    toneMapping: number;
    toneMappingExposure: number;
    shadowMap: {
      enabled: boolean;
      type: number;
      autoUpdate: boolean;
      needsUpdate: boolean;
    };
  },
  renderer: {
    outputColorSpace: string;
    toneMapping: number;
    toneMappingExposure: number;
    shadowMap: {
      enabled: boolean;
      type: number;
      autoUpdate: boolean;
      needsUpdate: boolean;
    };
  },
  draw: () => void,
): void {
  renderer.outputColorSpace = settings.outputColorSpace;
  renderer.toneMapping = settings.toneMapping;
  renderer.toneMappingExposure = settings.toneMappingExposure;
  Object.assign(renderer.shadowMap, settings.shadowMap, {
    type:
      settings.shadowMap.type === PCFSoftShadowMap
        ? PCFShadowMap
        : settings.shadowMap.type,
  });
  draw();
  settings.shadowMap.needsUpdate = renderer.shadowMap.needsUpdate;
}
