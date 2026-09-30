import { TestValidator } from "@nestia/e2e";
import { PCFShadowMap, PCFSoftShadowMap, BasicShadowMap } from "three";
import { drawHumanViewerFrame } from "../../../scripts/human-viewer/drawHumanViewerFrame";

/**
 * Cached viewports keep their exposure and shadow sampler interpretation.
 * Scenarios:
 * 1. Soft-PCF becomes its documented PCF equivalent even without a shadow refresh.
 * 2. Another scene's tone and shadow state cannot leak into the next draw.
 * 3. Supported other shadow modes remain intact and completed refresh is retained.
 */
export function test_human_viewer_renderer_state(): void {
  const settings = { outputColorSpace: "srgb", toneMapping: 1, toneMappingExposure: 0.25,
    shadowMap: { enabled: true, type: PCFSoftShadowMap as number, autoUpdate: false, needsUpdate: true } };
  const renderer = { outputColorSpace: "other", toneMapping: 4, toneMappingExposure: 1,
    shadowMap: { enabled: false, type: BasicShadowMap as number, autoUpdate: true, needsUpdate: false } };
  let draws = 0;
  drawHumanViewerFrame(settings, renderer, () => {
    ++draws;
    TestValidator.equals("sampler", renderer.shadowMap.type, PCFShadowMap);
    TestValidator.equals("exposure", renderer.toneMappingExposure, 0.25);
    TestValidator.equals("tone", renderer.toneMapping, 1);
    TestValidator.equals("space", renderer.outputColorSpace, "srgb");
    renderer.shadowMap.needsUpdate = false;
  });
  TestValidator.equals("refresh retained", settings.shadowMap.needsUpdate, false);
  settings.shadowMap.type = BasicShadowMap;
  drawHumanViewerFrame(settings, renderer, () => { ++draws; });
  TestValidator.equals("other mode", renderer.shadowMap.type, BasicShadowMap);
  TestValidator.equals("draws", draws, 2);
}
