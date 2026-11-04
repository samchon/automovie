import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanBodyLaw } from "../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import type { AutoMovieHumanMouth } from "../../../../packages/human/src/generation/AutoMovieHumanMouth";
import type { IAutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { f1 } from "../../../../packages/playground/src/human-parameters/f1";
import { nclose } from "../internal/predicates";

/**
 * Full body calibration retains stature and independently changed lip dimensions.
 *
 * Scenarios:
 *
 * 1. A whole person retains the requested crown height, finite complete chains,
 * bilateral globes and a closed lip boundary.
 * 2. Updating that same input object's mouth width changes calibrated mouth
 * and lip span in the requested direction while keeping height and adult teeth.
 * 3. Updating stature on that same object moves the crown to the new input and
 * retains the independently supplied mouth width and adult crown dimensions.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the public body calibration three times while mutating public dimensions in place, checks crown height, finite layer coefficients, complete anatomical chain inventory, assembled mouth width, lip extent and tooth dimensions. It catches stale input identity, omitted whole-ring output, altered adult dentition or lost independent mouth response.
 * @evidence contracts/testing.md#independent-expectations A standing person's crown is at requested stature, a closed lip boundary spans the requested mouth width within the existing 1 mm head-dimension tolerance, permanent adult teeth retain their dimensions when stature changes, and finite coefficients are required to evaluate every declared chain. Anatomical head, trunk and bilateral limb presence supplies the inventory expectation; these checks do not establish surface health or kilograms, which calibration does not produce.
 * @evidence contracts/testing.md#distinguishing-cases Covers original dimensions, changed mouth width on the identical parameter object, and changed stature with the mouth held fixed. Existing Human anatomy/curve tests own the full parameter domain and physical shape; the focused radius and mouth tests own analytic convergence and dental occlusion.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reaches the full calibration producer and its in-memory public outputs, without skin tessellation, a renderer, process, browser or GPU.
 */
export function test_human_calibration_dimensions(): void {
  const defects: string[] = [];
  const params: IAutoMovieHumanParameters = structuredClone(f1);
  const originalWidth: number = params.head.face.mouth.width;
  const originalHeight: number = params.body.anatomy.stature!;
  for (let scenario: number = 0; scenario < 3; scenario++) {
    if (scenario === 1) params.head.face.mouth.width = originalWidth + 6;
    if (scenario === 2) params.body.anatomy.stature = originalHeight + 100;
    const output: AutoMovieHumanBodyLaw.IOutput =
      AutoMovieHumanBodyLaw.calibrate(params);
    const crown: number | undefined = output.body.poles.find(
      (pole: (typeof output.body.poles)[number]): boolean =>
        pole.chain === "head.upper",
    )?.point[1];
    if (
      crown === undefined ||
      !nclose(crown, params.body.anatomy.stature!, 1e-6)
    )
      defects.push(`${scenario}: crown stature`);
    const mouthWidth: number | undefined = output.body.mouth?.width;
    if (
      mouthWidth === undefined ||
      !nclose(2 * mouthWidth, params.head.face.mouth.width, 1)
    )
      defects.push(`${scenario}: independent mouth width`);
    const z: number[] = output.vermilion.spans.flatMap(
      (span: (typeof output.vermilion.spans)[number]): number[] => [
        span.start[2],
        span.end[2],
      ],
    );
    if (
      z.length === 0 ||
      !nclose(Math.max(...z) - Math.min(...z), params.head.face.mouth.width, 1)
    )
      defects.push(`${scenario}: complete lip boundary`);
    const first: (typeof output.vermilion.spans)[number] | undefined =
      output.vermilion.spans[0];
    const last: (typeof output.vermilion.spans)[number] | undefined =
      output.vermilion.spans.at(-1);
    if (
      first === undefined ||
      last === undefined ||
      first.start.some(
        (coordinate: number, k: number): boolean =>
          !nclose(coordinate, last.end[k]!, 1e-10),
      )
    )
      defects.push(`${scenario}: closed lip boundary`);
    for (const chain of output.body.chains)
      for (const layer of chain.layers)
        if (
          ![
            layer.y,
            ...layer.coefficients,
            ...layer.slopes,
            ...(layer.lift ?? []),
            ...(layer.liftSlopes ?? []),
          ].every(Number.isFinite)
        )
          defects.push(`${scenario}/${chain.name}: finite complete chain`);
    if (
      output.body.eyes.length !== 2 ||
      output.body.eyes.some(
        (eye: (typeof output.body.eyes)[number]): boolean =>
          !eye.centre.every(Number.isFinite) || !(eye.radius > 0),
      )
    )
      defects.push(`${scenario}: both generated globes`);
    const mouth: AutoMovieHumanMouth.IMouth | undefined = output.body.mouth;
    if (
      mouth === undefined ||
      mouth.teeth.length !== 28 ||
      mouth.teeth.some(
        (tooth: AutoMovieHumanMouth.ITooth): boolean =>
          tooth.name.endsWith("centralIncisor") &&
          !nclose(tooth.crown.width, tooth.jaw === "upper" ? 8.5 : 5, 0),
      )
    )
      defects.push(`${scenario}: adult permanent dentition`);
    for (const name of [
      "head",
      "head.lower",
      "head.middle",
      "head.upper",
      "trunk",
      "upper",
      "arm.left",
      "arm.right",
      "leg.left",
      "leg.right",
    ])
      if (
        !output.body.chains.some(
          (chain: IAutoMovieHumanLoftChain): boolean => chain.name === name,
        )
      )
        defects.push(`${scenario}/${name}: required anatomical chain`);
  }
  TestValidator.equals("independent full calibration dimensions", defects, []);
}
