import type {
  IAutoMovieSequenceRenderAndSeeRequest,
  IAutoMovieSequenceRenderAndSeeResult,
} from "@automovie/interface";

import { planSequenceRender } from "./planSequenceRender.js";
import { renderSequenceVideo } from "./renderSequenceVideo.js";

/*
 * Build a sequence render manifest, execute it through host adapters, and
 * return an artifact an agent can inspect without recomputing the cut.
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
