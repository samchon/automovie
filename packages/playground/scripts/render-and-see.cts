import path from "node:path";
import { main } from "./renderAndSee/main.cts";

export { main } from "./renderAndSee/main.cts";
export { captureRenderAndSee } from "./captureRenderAndSee.cts";
export type { IAutoMoviePlaygroundRenderAndSeeOptions } from "./IAutoMoviePlaygroundRenderAndSeeOptions";
export type { IAutoMoviePlaygroundRenderAndSeeArtifact } from "./IAutoMoviePlaygroundRenderAndSeeArtifact";

if (path.resolve(process.argv[1] ?? "") === path.resolve(__filename))
  void main().catch((error: unknown): void => {
    console.error(error);
    process.exitCode = 1;
  });
