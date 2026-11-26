import { buildModel, AutoMovieRenderFormationCycle, AutoMovieRenderFormationGeometry } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { createSkinnedTubeModel } from "../../internal/createSkinnedTubeModel";

/** Tolerance of the baked rest matrices. */
const MATRIX_TOLERANCE: number = 1e-5;

/**
 * `bakeFormationCycle` bakes a model's pose takes into part-matrix tables.
 *
 * Scenarios:
 *
 * 1. Four rest poses of a one-part skinned model bake to a cycle of 4 samples
 *    and one part with one take, `walk`, and a 3 by 4 matrix per part and
 *    sample; every matrix is the identity, since the part stays at rest.
 * 2. A model without a skeleton and a bake with no take at all bake nothing.
 */
export function test_render_scene_bake_formation_cycle(): void {
  const model = createSkinnedTubeModel();
  const built = buildModel(model);
  built.object.updateMatrixWorld(true);
  const parts = AutoMovieRenderFormationGeometry.instancedModelParts(built.object);
  const rest = { skeleton: "tube-rig", root: null, joints: [] };
  const cycle = AutoMovieRenderFormationCycle.bakeFormationCycle({
    model,
    built,
    parts,
    takes: [{ gait: "walk", periodSeconds: 1, poses: [rest, rest, rest, rest] }],
  });
  TestValidator.equals(
    "shape",
    cycle === null
      ? null
      : [cycle.samples, cycle.names.length, [...cycle.takes.keys()]],
    [4, parts.length, ["walk"]],
  );
  const matrices = cycle?.takes.get("walk")?.matrices;
  TestValidator.equals("size", matrices?.length, parts.length * 3 * 4 * 4);
  TestValidator.predicate(
    "identity at rest",
    matrices !== undefined &&
      Array.from(
        { length: 4 },
        (_: unknown, sample: number): boolean =>
          [0, 1, 2].every((row: number): boolean =>
            [0, 1, 2, 3].every((column: number): boolean => {
              const expected: number = row === column ? 1 : 0;
              return (
                Math.abs(
                  matrices[(row * 4 + sample) * 4 + column]! - expected,
                ) < MATRIX_TOLERANCE
              );
            }),
          ),
      ).every((held: boolean): boolean => held),
  );
  TestValidator.equals(
    "no skeleton",
    AutoMovieRenderFormationCycle.bakeFormationCycle({
      model: { ...model, skeleton: null },
      built,
      parts,
      takes: [{ gait: "walk", periodSeconds: 1, poses: [rest] }],
    }),
    null,
  );
  TestValidator.equals(
    "no takes",
    AutoMovieRenderFormationCycle.bakeFormationCycle({ model, built, parts, takes: [] }),
    null,
  );
}