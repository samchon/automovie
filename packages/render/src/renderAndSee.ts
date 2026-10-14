import type { IAutoMovieRenderAndSeeRequest } from "./IAutoMovieRenderAndSeeRequest";
import type { IAutoMovieRenderAndSeeResult } from "./IAutoMovieRenderAndSeeResult";
import { renderVideo } from "./renderVideo";

/**
 * Render a clip and return the encoded output plus explicit frame artifacts. The function still performs only deterministic orchestration over injected host I/O; its value is the metadata contract that lets an agent inspect what was captured without guessing paths or sample times.
 *
 * @evidence contracts/common.md#principled-implementation The wrapper executes renderVideo with the supplied spec and seconds, then attaches the requested duration and a shallow spec copy; nested spec objects remain shared with the caller.
 * @evidence contracts/common.md#clear-and-simple-design Clip execution stays in renderVideo while this entry owns the inspectable artifact envelope used by a host or agent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The wrapper neither invents capture paths nor suppresses adapter errors, and the returned frames are those the delegated capture loop received.
 * @evidence contracts/common.md#meaningful-documentation Request members identify seconds, output paths and adapter ownership; the result documents the spec snapshot, whose nested values callers must keep stable while rendering.
 * @evidence contracts/performance.md#efficient-algorithms Beyond the delegated O(F) frame capture and metadata work, the wrapper performs a constant-size shallow spec copy and object merge.
 * @evidence contracts/performance.md#reuse-equivalent-work This wrapper performs one effectful render per invocation; the returned artifact can be retained by its caller but an equal spec does not authorize sharing host I/O.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned artifact owns its metadata arrays while host adapters own written files and running work; failures propagate from renderVideo without acquiring additional resources.
 */
export const renderAndSee: (
  request: IAutoMovieRenderAndSeeRequest,
) => Promise<IAutoMovieRenderAndSeeResult> = async (
  request: IAutoMovieRenderAndSeeRequest,
): Promise<IAutoMovieRenderAndSeeResult> => ({
  spec: { ...request.spec },
  durationSeconds: request.durationSeconds,
  ...(await renderVideo(
    request.spec,
    request.durationSeconds,
    request.frameDir,
    request.outputPath,
    request.adapters,
  )),
});
