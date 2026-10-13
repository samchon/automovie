import { PCFShadowMap, PCFSoftShadowMap } from "three";

/**
 * Apply the viewport's owned display settings before using the shared renderer.
 * Product stages retain their own exposure and shadow refresh state. Three 186
 * interprets the retired soft-PCF choice as PCF only during a shadow refresh;
 * normalize that documented equivalent before shader selection, including a
 * cached frame whose shadows need no refresh. Otherwise comparison samplers
 * can be used with non-comparison shader variants after a scene switch.
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
