import { performance } from "node:perf_hooks";
import type { IAutoMovieHumanFaceConstructionProgress } from "@automovie/human/face/structures/IAutoMovieHumanFaceConstructionProgress";
import type { IHumanBodyConstructionProgress } from "@automovie/human/body/structures/IHumanBodyConstructionProgress";
import type { AutoMovieHumanPersonConstructionStage } from "@automovie/human/human/structures/AutoMovieHumanPersonConstructionStage";
import type { IAutoMovieHumanPersonGeneration } from "@automovie/human/human/structures/IAutoMovieHumanPersonGeneration";
import type { IAutoMovieHumanPersonGenerationBuilderProps } from "@automovie/human/human/structures/IAutoMovieHumanPersonGenerationBuilderProps";

type ConstructionProgressOwner = "person" | "face" | "body";
type ConstructionProgress = AutoMovieHumanPersonConstructionStage |
  IAutoMovieHumanFaceConstructionProgress | IHumanBodyConstructionProgress;

/**
 * Report the normal construction owner's existing completed-stage events.
 * Event identities, counters and verdicts travel unchanged. Elapsed
 * milliseconds use one monotonic clock started before builder construction;
 * nested event intervals must not be added as independent construction costs.
 * No timer, fraction, geometry or acceptance calculation creates progress.
 * A thrown stage reports no completion, and output errors propagate through
 * the same synchronous observer contract as the construction itself.
 *
 * @evidence contracts/common.md#principled-implementation Observes actual owner completions and preserves their original payloads beside one monotonic elapsed reading.
 * @evidence contracts/common.md#clear-and-simple-design Existing named builder options supply the three actual completion observers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No heartbeat, profiler injection or alternate construction path supplies a stage.
 * @evidence contracts/common.md#meaningful-documentation States event authority, elapsed-time overlap and failure behavior.
 */
export function createHumanBodyConstructionProgressObservers(generation: IAutoMovieHumanPersonGeneration): IAutoMovieHumanPersonGenerationBuilderProps {
  const started = performance.now();
  const write = (owner: ConstructionProgressOwner, completed: ConstructionProgress): void => {
    console.log(JSON.stringify({ stage: "construction-progress", generation: generation.id,
      owner, elapsedMs: performance.now() - started, completed }));
  };
  return {
    generation,
    observeStage: (stage) => write("person", stage),
    observeFaceConstructionProgress: (progress) => write("face", progress),
    observeBodyConstructionProgress: (progress) => write("body", progress),
  };
}
