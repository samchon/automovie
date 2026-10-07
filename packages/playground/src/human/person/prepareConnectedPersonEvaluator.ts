import type {
  IAutoMovieHumanPersonBodyView,
  IAutoMovieHumanPersonGenerationBuilderProps,
  IAutoMovieHumanPersonHeadView,
} from "@automovie/human";
import { compileHumanPersonGeneration } from "@automovie/human/human/build/compileHumanPersonGeneration";
import { createHumanPersonGenerationBuilder } from "@automovie/human/human/build/createHumanPersonGenerationBuilder";
import { joinHumanPersonGeneration } from "@automovie/human/human/build/joinHumanPersonGeneration";

import { describeConnectedBodyConstructionProgress } from "../body/describeConnectedBodyConstructionProgress";
import type { IConnectedPersonEvaluator } from "./IConnectedPersonEvaluator";
import { describeConnectedPersonFaceProgress } from "./describeConnectedPersonFaceProgress";

/**
 * Join a person generation's head and body views, compile it and build its
 * one-skin evaluator once both views have arrived. An optional face observer
 * reads that same evaluator's final model instead of compiling a second
 * whole-person evaluator for face measurements.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-measurements Compiles the evaluator person measurements are read and solved on.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements Joins the head and body views once both arrive and builds the one-skin evaluator.
 * @author Samchon
 */
export async function prepareConnectedPersonEvaluator(
  head: Promise<IAutoMovieHumanPersonHeadView>,
  body: Promise<IAutoMovieHumanPersonBodyView>,
  observeFaceMeasurements?: IAutoMovieHumanPersonGenerationBuilderProps["observeFaceMeasurements"],
  progress?: (stage: string) => void,
): Promise<IConnectedPersonEvaluator> {
  const generation = joinHumanPersonGeneration(await head, await body);
  return {
    compiled: compileHumanPersonGeneration(generation),
    build: createHumanPersonGenerationBuilder({
      generation,
      observeFaceMeasurements,
      observeStage: progress,
      observeFaceConstructionProgress:
        progress === undefined
          ? undefined
          : (value) => progress(describeConnectedPersonFaceProgress(value)),
      observeBodyConstructionProgress:
        progress === undefined
          ? undefined
          : (value) =>
              progress(describeConnectedBodyConstructionProgress(value)),
    }),
  };
}
