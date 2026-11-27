import type {
  IAutoMovieRenderAndSeeRequest,
  IAutoMovieRenderAndSeeResult,
} from "@automovie/interface";

import { renderVideo } from "./renderVideo.js";

/*
 * Render a clip and return the encoded output plus explicit frame artifacts.
 * The function still performs only deterministic orchestration over injected
 * host I/O; its value is the metadata contract that lets an agent inspect what
 * was captured without guessing paths or sample times.
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
