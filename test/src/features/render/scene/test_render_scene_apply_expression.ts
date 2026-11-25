import { applyExpression } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../../internal/predicates";

/**
 * Viseme weights reach a VRM or imported model as its five mouth presets summed
 * by weight.
 *
 * Scenarios:
 *
 * 1. Weights `{ aa: 0.5, O: 0.5 }` give `jawOpen` = 0.5 × 1 + 0.5 × 0.6 = 0.8 and
 *    `mouthFunnel` = 0.5 × 0.75 = 0.375.
 * 2. A closed viseme, `PP` at 1, sets no mouth channel, so the mouth closes.
 * 3. The mouth layer replaces the authored expression's channels it sets and
 *    leaves the others: an authored `surprised` keeps its brows while the
 *    visemes set `jawOpen`.
 */
export function test_render_scene_apply_expression(): void {
  const apply: (
    expression: Parameters<typeof applyExpression>[1],
    visemes: Parameters<typeof applyExpression>[2],
  ) => Map<string, number> = (
    expression: Parameters<typeof applyExpression>[1],
    visemes: Parameters<typeof applyExpression>[2],
  ): Map<string, number> => {
    const values: Map<string, number> = new Map();
    applyExpression(
      {
        object: new THREE.Group(),
        bones: new Map(),
        parts: new Map(),
        expressionTargets: [
          {
            setExpressionValue: (name: string, weight: number): void => {
              values.set(name, weight);
            },
          },
        ],
      },
      expression,
      visemes,
    );
    return values;
  };

  const open: Map<string, number> = apply(null, { aa: 0.5, O: 0.5 });
  TestValidator.predicate(
    "aa and O sum to jawOpen 0.8 and mouthFunnel 0.375",
    nclose(open.get("jawOpen") ?? NaN, 0.8, 1e-9) &&
      nclose(open.get("mouthFunnel") ?? NaN, 0.375, 1e-9),
  );

  const closed: Map<string, number> = apply(null, { PP: 1 });
  TestValidator.predicate(
    "a bilabial sets no mouth channel",
    (closed.get("jawOpen") ?? 0) === 0 &&
      (closed.get("mouthFunnel") ?? 0) === 0,
  );

  const layered: Map<string, number> = apply(
    { preset: "surprised", intensity: 1, blendshapes: null },
    { aa: 0.25, sil: 0.75 },
  );
  TestValidator.predicate(
    "the mouth replaces the jaw and keeps the authored brows",
    nclose(layered.get("jawOpen") ?? NaN, 0.25, 1e-9) &&
      nclose(layered.get("browInnerUp") ?? NaN, 1, 1e-9),
  );
}
