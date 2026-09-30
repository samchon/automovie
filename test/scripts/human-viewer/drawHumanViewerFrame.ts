import { PCFShadowMap, PCFSoftShadowMap } from "three";

/**
 * Apply the viewport's owned display settings before using the shared renderer.
 * Product stages retain their own exposure and shadow refresh state. Three 186
 * interprets the retired soft-PCF choice as PCF only during a shadow refresh;
 * normalize that documented equivalent before shader selection, including a
 * cached frame whose shadows need no refresh. Otherwise comparison samplers
 * can be used with non-comparison shader variants after a scene switch.
 *
 * @evidence contracts/common.md#principled-implementation Restores scene-owned state before drawing and carries completed shadow refresh state back to that owner.
 * @evidence contracts/common.md#clear-and-simple-design One adapter owns the shared renderer boundary; product stages keep their existing settings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the renderer's supported fields and Three's explicit soft-PCF-to-PCF equivalence without altering dependency methods.
 * @evidence contracts/common.md#meaningful-documentation Explains the sampler mismatch and the cached-frame boundary that requires normalization.
 */
export function drawHumanViewerFrame(settings: {
  outputColorSpace: string; toneMapping: number; toneMappingExposure: number;
  shadowMap: { enabled: boolean; type: number; autoUpdate: boolean; needsUpdate: boolean };
}, renderer: {
  outputColorSpace: string; toneMapping: number; toneMappingExposure: number;
  shadowMap: { enabled: boolean; type: number; autoUpdate: boolean; needsUpdate: boolean };
}, draw: () => void): void {
  renderer.outputColorSpace = settings.outputColorSpace;
  renderer.toneMapping = settings.toneMapping;
  renderer.toneMappingExposure = settings.toneMappingExposure;
  Object.assign(renderer.shadowMap, settings.shadowMap, {
    type: settings.shadowMap.type === PCFSoftShadowMap ? PCFShadowMap : settings.shadowMap.type,
  });
  draw();
  settings.shadowMap.needsUpdate = renderer.shadowMap.needsUpdate;
}
