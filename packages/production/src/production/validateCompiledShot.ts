import { appendValidation, engineDiagnostic, validateAutoMovieEffects, validateAutoMovieFormationGround, validateAutoMovieFormationMotions, validateAutoMovieFormationOverlap, validateAutoMovieFormationSlotMotions, validateModel, validateMotion, validateShotArtifact } from "@automovie/engine";
import { IAutoMovieCompiledShotSource, IAutoMovieDiagnostic, IAutoMovieShotContract, type IAutoMovieModel, type IAutoMovieMotion, type IAutoMovieSkeleton } from "@automovie/interface";
import { validateSceneArtifact } from "../validators/artifacts";
import { shotValidationMaterialBindings } from "./shotValidationMaterialBindings";

/**
 * Collect shot, scene, model, formation, effect, material and motion findings for one compiled output without publishing or repairing it. Shot id and duration are compared exactly with the contract.
 *
 * @evidence contracts/common.md#principled-implementation Existing validators own their physical/structural semantics; indexed motion ids and skeleton ids connect artifacts to resident definitions. Missing motion skeletons become engine diagnostics rather than guessed rigs.
 * @evidence contracts/common.md#clear-and-simple-design The post-compilation coordinator receives one ordered diagnostic list from this owner; simulated material binding has a separate resolver adapter while geometry and motion validation remain with the engine.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts All owned validators run and findings accumulate; exact numeric duration equality is retained. Shape-admitted compiled output is a premise because nested records are dereferenced directly, and unexpected foreign-validator throws still propagate.
 * @evidence contracts/common.md#meaningful-documentation Documents collective validation, exact contract comparisons, read-only output use, skeleton lookup, material refusal conversion and the admitted-shape/throw limitations.
 * @evidence contracts/performance.md#efficient-algorithms Local indices cost O(M+C) for motions and models, but total work includes every scene/model/motion validator and formation/effect geometry check. Material references each scan all model materials and canonicalize candidates, so repeated citations currently repeat that cost.
 * @evidence contracts/performance.md#reuse-equivalent-work One motion-id set and one skeleton map serve their local checks. Independent mutable artifacts are revalidated on each call and material resolutions are not memoized here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Input artifacts remain borrowed and unchanged; temporary indices expire on return and the caller owns returned findings, which can retain offending values from validators. No file, renderer, worker or task is acquired.
 */
export const validateCompiledShot: (contract: IAutoMovieShotContract, value: IAutoMovieCompiledShotSource) => IAutoMovieDiagnostic[] = (
  contract: IAutoMovieShotContract,
  value: IAutoMovieCompiledShotSource,
): IAutoMovieDiagnostic[] => {
  const id: string = contract.id;
  const diagnostics: IAutoMovieDiagnostic[] = [];
  if (value.shot.id !== id)
    diagnostics.push(
      engineDiagnostic(id, "shot.id", `must equal contract id "${id}"`),
    );
  if (value.shot.duration !== contract.durationSeconds)
    diagnostics.push(
      engineDiagnostic(
        id,
        "shot.duration",
        `must equal contract duration ${contract.durationSeconds}`,
      ),
    );
  appendValidation(
    diagnostics,
    id,
    validateSceneArtifact(value.scene, value.models),
  );
  const motionIds: Set<string> = new Set(value.motions.map((motion: IAutoMovieMotion) : string => motion.id));
  appendValidation(
    diagnostics,
    id,
    validateShotArtifact(value.shot, value.scene, motionIds),
  );
  diagnostics.push(...validateAutoMovieFormationMotions(contract, value));
  diagnostics.push(...validateAutoMovieFormationSlotMotions(contract, value));
  diagnostics.push(...validateAutoMovieFormationGround(contract, value));
  diagnostics.push(...validateAutoMovieFormationOverlap(contract, value));
  diagnostics.push(...validateAutoMovieEffects(contract, value));
  for (const model of value.models)
    appendValidation(diagnostics, id, validateModel({ model }));
  diagnostics.push(...shotValidationMaterialBindings(id, value));
  const skeletons: Map<string, IAutoMovieSkeleton> = new Map(
    value.models.flatMap((model: IAutoMovieModel) : [] | [readonly [string, IAutoMovieSkeleton]] =>
      model.skeleton === null
        ? []
        : [[model.skeleton.id, model.skeleton] as const],
    ),
  );
  for (const motion of value.motions) {
    const skeleton: IAutoMovieSkeleton | undefined = skeletons.get(motion.skeleton);
    if (skeleton === undefined)
      diagnostics.push(
        engineDiagnostic(
          id,
          `motion:${motion.id}`,
          `references missing skeleton "${motion.skeleton}"`,
        ),
      );
    else
      appendValidation(diagnostics, id, validateMotion({ motion, skeleton }));
  }
  return diagnostics;
};
