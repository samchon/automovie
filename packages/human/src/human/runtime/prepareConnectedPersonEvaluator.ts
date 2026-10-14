import type {
  IAutoMovieHumanPersonBodyView,
  IAutoMovieHumanPersonGenerationBuilderProps,
  IAutoMovieHumanPersonHeadView,
} from "@automovie/human";
import { describeConnectedBodyConstructionProgress } from "@automovie/human/body/runtime/describeConnectedBodyConstructionProgress";
import { compileHumanPersonGeneration } from "@automovie/human/human/build/compileHumanPersonGeneration";
import { createHumanPersonGenerationBuilder } from "@automovie/human/human/build/createHumanPersonGenerationBuilder";
import { joinHumanPersonGeneration } from "@automovie/human/human/build/joinHumanPersonGeneration";
import type { IConnectedPersonEvaluator } from "@automovie/human/human/runtime/IConnectedPersonEvaluator";
import { describeConnectedPersonFaceProgress } from "@automovie/human/human/runtime/describeConnectedPersonFaceProgress";

/**
 * Join a person's head and body views, compile the generation and create its one-skin evaluator once both views have arrived. An optional face observer reads this evaluator's final model rather than compiling a second whole-person evaluator for face measurements. Supplied view promises already own their loading; this function neither starts nor cancels them.
 *
 * @evidence contracts/common.md#principled-implementation The canonical join/compile/builder owners retain generation coordinates and precision; this adapter forwards actual face/body construction progress instead of treating a stage label as admission.
 * @evidence contracts/common.md#clear-and-simple-design One joined generation supplies both the compiled channel metadata and build closure, with optional observation callbacks at the existing builder seams.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source arrival is not model health or acceptance, and face measurement observation uses the actual final model rather than a second substitute evaluator.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes view-loading ownership, shared evaluator observation and the returned builder's later construction work.
 * @evidence contracts/performance.md#efficient-algorithms Joining and compiling traverse supplied generation definitions/channels; builder creation prepares its owner state and later model construction retains its full geometry cost. Awaiting head then body does not restart the already supplied promises.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned compiled metadata and build closure share the exact joined generation, and optional face readings observe that build's final model. Calls with other view identities are independently prepared rather than sharing an unkeyed cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned evaluator retains its joined generation and observation callbacks for the resident numerical owner's lifetime. This adapter owns no worker or GPU handle and cannot cancel unresolved input promises; the surrounding worker lifecycle releases its evaluator reference.
 *
 * @author Samchon
 */
export async function prepareConnectedPersonEvaluator(
  head: Promise<IAutoMovieHumanPersonHeadView>,
  body: Promise<IAutoMovieHumanPersonBodyView>,
  observeFaceMeasurements?: IAutoMovieHumanPersonGenerationBuilderProps["observeFaceMeasurements"],
  progress?: (stage: string) => void,
): Promise<IConnectedPersonEvaluator> {
  const generation: ReturnType<typeof joinHumanPersonGeneration> =
    joinHumanPersonGeneration(await head, await body);
  return {
    compiled: compileHumanPersonGeneration(generation),
    build: createHumanPersonGenerationBuilder({
      generation,
      observeFaceMeasurements,
      observeStage: progress,
      observeFaceConstructionProgress:
        progress === undefined
          ? undefined
          : (
              value: Parameters<
                NonNullable<
                  IAutoMovieHumanPersonGenerationBuilderProps["observeFaceConstructionProgress"]
                >
              >[0],
            ): void => progress(describeConnectedPersonFaceProgress(value)),
      observeBodyConstructionProgress:
        progress === undefined
          ? undefined
          : (
              value: Parameters<
                NonNullable<
                  IAutoMovieHumanPersonGenerationBuilderProps["observeBodyConstructionProgress"]
                >
              >[0],
            ): void =>
              progress(describeConnectedBodyConstructionProgress(value)),
    }),
  };
}
