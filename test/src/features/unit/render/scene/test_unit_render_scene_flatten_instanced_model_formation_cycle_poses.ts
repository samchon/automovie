import type {
  IAutoMovieFormationPoseTake,
  IAutoMovieModel,
  IAutoMoviePose,
} from "@automovie/interface";
import {
  type IAutoMovieFormationCycle,
  type IAutoMovieFormationCycleTake,
  flattenInstancedModel,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { IDENTITY_TRANSFORM, createModel } from "../../../internal/fixtures";

/**
 * A formation cycle baked from a given pose table plays those poses: each
 * sample's part matrices carry the table's pose, the take keeps the table's
 * name, period and stride, and without a table the model's own gaits are baked
 * as before.
 *
 * Scenarios, a one-bone box model:
 *
 * 1. A take of eight poses whose root rises 0.1 m a sample: sample i's part matrix
 *    translates by 0.1 i m more than sample 0's along +Y, within the Float32
 *    table's precision (1e-6 m), for every part.
 * 2. The take is named as given and keeps its period and stride exactly.
 * 3. Two takes are both baked, each under its own name.
 * 4. A table whose takes hold different counts of poses is refused.
 * 5. Without takes and without gaits, nothing is baked (null cycle), as before the
 *    change.
 */
export function test_unit_render_scene_flatten_instanced_model_formation_cycle_poses(): void {
  const findings: string[] = [];
  const model: IAutoMovieModel = createModel({
    id: "box-rig",
    bones: [
      {
        bone: "hips",
        parent: null,
        rest: IDENTITY_TRANSFORM,
        constraint: null,
      },
    ],
  });
  model.parts[0]!.attachedBone = "hips";
  const skeleton: string = model.skeleton!.id;
  const take = (
    gait: string,
    count: number,
    rise: number,
  ): IAutoMovieFormationPoseTake => ({
    gait,
    periodSeconds: 1.25,
    strideMeters: 1.5,
    poses: Array.from(
      { length: count },
      (_: unknown, i: number): IAutoMoviePose => ({
        skeleton,
        root: {
          translation: { x: 0, y: rise * i, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        joints: [],
      }),
    ),
  });

  // 1 and 2. One take.
  const one: ReturnType<typeof flattenInstancedModel> = flattenInstancedModel(
    model,
    "poses",
    { takes: [take("march", 8, 0.1)] },
  );
  const cycle: IAutoMovieFormationCycle | null = one.cycle;
  if (cycle === null) findings.push("the pose table baked nothing");
  else {
    const baked: IAutoMovieFormationCycleTake | undefined =
      cycle.takes.get("march");
    if (baked === undefined) findings.push("the take is not named march");
    else {
      if (baked.periodSeconds !== 1.25 || baked.strideMeters !== 1.5)
        findings.push(
          `the take keeps ${baked.periodSeconds} s and ${baked.strideMeters} m`,
        );
      const samples: number = cycle.samples;
      const parts: number = cycle.names.length;
      for (let part: number = 0; part < parts; ++part)
        for (let sample: number = 0; sample < samples; ++sample) {
          const y = (s: number): number =>
            baked.matrices[((part * 3 + 1) * samples + s) * 4 + 3]!;
          if (Math.abs(y(sample) - y(0) - 0.1 * sample) > 1e-6) {
            findings.push(
              `part ${part} sample ${sample} rises ${(y(sample) - y(0)).toFixed(6)} m, ${(0.1 * sample).toFixed(6)} expected`,
            );
            break;
          }
        }
    }
  }

  // 3. Two takes.
  const two: ReturnType<typeof flattenInstancedModel> = flattenInstancedModel(
    model,
    "poses",
    { takes: [take("march", 8, 0.1), take("stand", 8, 0)] },
  );
  if (
    two.cycle === null ||
    !two.cycle.takes.has("march") ||
    !two.cycle.takes.has("stand")
  )
    findings.push("two takes were not both baked");

  // 4. Uneven takes.
  try {
    flattenInstancedModel(model, "poses", {
      takes: [take("march", 8, 0.1), take("stand", 6, 0)],
    });
    findings.push("takes of 8 and 6 poses were baked");
  } catch {
    // Refused: every take of a table holds the same count of poses.
  }

  // 5. No takes, no gaits.
  const none: ReturnType<typeof flattenInstancedModel> = flattenInstancedModel(
    model,
    "poses",
    {},
  );
  if (none.cycle !== null) findings.push("a model without gaits baked a cycle");
  TestValidator.equals("a formation cycle baked from poses", findings, []);
}
