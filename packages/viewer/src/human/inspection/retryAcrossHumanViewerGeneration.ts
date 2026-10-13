import type { IRetryAcrossHumanViewerGenerationProps } from "./IRetryAcrossHumanViewerGenerationProps.js";
import { isHumanViewerGenerationChange } from "./isHumanViewerGenerationChange.js";

/**
 * Run a capture again on the generation that replaced the one it started on.
 * A request that arrives while the source rebuilds, or straddles the moment a
 * new generation is published, fails only because two generations met; the
 * capture is idempotent and writes its response after it succeeds, so running
 * it again on the settled generation answers the same question. `settle`
 * waits until a generation can draw again, and the attempts are bounded so a
 * source that keeps changing still ends in the last refusal. Any other error
 * is returned at once, unchanged.
 */
export async function retryAcrossHumanViewerGeneration<T>(
  run: () => Promise<T>,
  props: IRetryAcrossHumanViewerGenerationProps,
): Promise<T> {
  for (let attempt = 1; ; ++attempt) {
    try {
      return await run();
    } catch (error) {
      if (attempt >= props.attempts || !isHumanViewerGenerationChange(error))
        throw error;
      await props.settle();
    }
  }
}
