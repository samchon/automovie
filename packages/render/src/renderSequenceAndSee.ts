import type { IAutoMovieSequenceRenderAndSeeRequest } from "./IAutoMovieSequenceRenderAndSeeRequest";
import type { IAutoMovieSequenceRenderAndSeeResult } from "./IAutoMovieSequenceRenderAndSeeResult";
import { planSequenceRender } from "./planSequenceRender";
import { renderSequenceVideo } from "./renderSequenceVideo";

/**
 * Build a sequence render manifest, execute it through host adapters, and return an artifact an agent can inspect without recomputing the cut.
 *
 * @evidence contracts/common.md#principled-implementation planSequenceRender resolves the cut once, and renderSequenceVideo executes that same manifest; the envelope records sequence id, editorial fps and a shallow spec snapshot.
 * @evidence contracts/common.md#clear-and-simple-design Planning, host execution and the agent-facing envelope have separate owners, so this composition adds no second timing or capture implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A planning or adapter failure escapes unchanged and no missing shot is replaced by an unrelated source; all frame metadata comes from the executed plan.
 * @evidence contracts/common.md#meaningful-documentation The request explains sequence target equality and adapter ownership; the result names editorial fps and the spec snapshot, including its shared nested values.
 * @evidence contracts/performance.md#efficient-algorithms For S supplied shots, E cut entries and F frames, delegated planning and scheduling take O(S+E+F) metadata work and the envelope adds a constant-size merge; actual drawing and encoding costs remain host-dependent and are not bounded by this record count.
 * @evidence contracts/performance.md#reuse-equivalent-work The manifest produced once is shared by capture and the returned artifact, ensuring inspection uses the same resolution that drove rendering.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the result envelope is added to the retained manifest and frame records; frame files, capture sessions and encoder lifetimes stay with the supplied host adapters.
 */
export const renderSequenceAndSee: (
  request: IAutoMovieSequenceRenderAndSeeRequest,
) => Promise<IAutoMovieSequenceRenderAndSeeResult> = async (
  request: IAutoMovieSequenceRenderAndSeeRequest,
): Promise<IAutoMovieSequenceRenderAndSeeResult> => {
  const plan: ReturnType<typeof planSequenceRender> = planSequenceRender({
    sequence: request.sequence,
    shots: request.shots,
    spec: request.spec,
    frameDir: request.frameDir,
    outputPath: request.outputPath,
  });
  return {
    spec: { ...request.spec },
    sequence: { id: request.sequence.id, fps: request.sequence.fps },
    ...(await renderSequenceVideo(plan, request.adapters)),
  };
};
