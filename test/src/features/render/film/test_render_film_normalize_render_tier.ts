import {
  normalizeRenderTier
} from "../../../../../packages/render/src/film/internal/normalizeRenderTier";
import { TestValidator } from "@nestia/e2e";

/**
 * `normalizeRenderTier` admits the final tier or a bounded cheaper proxy.
 *
 * Scenarios:
 *
 * 1. An omitted tier is final at scale 1 and step 1.
 * 2. A proxy at scale 0.5 and step 2 is returned as a copy.
 * 3. A final that is not 1 and 1, a proxy that is not cheaper, a scale above 1,
 *    a scale of 0 and a step of 17 are refused.
 */
export function test_render_film_normalize_render_tier(): void {
  TestValidator.equals("default", normalizeRenderTier(undefined), {
    kind: "final",
    resolutionScale: 1,
    frameStep: 1,
  });
  const proxy: { kind: "proxy"; resolutionScale: number; frameStep: number } = {
    kind: "proxy",
    resolutionScale: 0.5,
    frameStep: 2,
  };
  const copy: { kind: "proxy" | "final" } = normalizeRenderTier(proxy);
  TestValidator.equals("proxy", copy, proxy);
  TestValidator.predicate("copy", copy !== proxy);
  for (const [kind, resolutionScale, frameStep] of [
    ["final", 0.5, 1],
    ["final", 1, 2],
    ["proxy", 1, 1],
    ["proxy", 1.5, 1],
    ["proxy", 0, 1],
    ["proxy", 0.5, 17],
  ] as const)
    TestValidator.error(`${kind} ${resolutionScale} ${frameStep}`, (): void => {
      normalizeRenderTier({ kind, resolutionScale, frameStep });
    });
}