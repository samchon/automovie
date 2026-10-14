import path from "node:path";

import { main } from "./renderAndSee/main.ts";

export { main } from "./renderAndSee/main.ts";
export { captureRenderAndSee } from "./captureRenderAndSee.ts";
export type { IAutoMoviePlaygroundRenderAndSeeOptions } from "./IAutoMoviePlaygroundRenderAndSeeOptions";
export type { IAutoMoviePlaygroundRenderAndSeeArtifact } from "./IAutoMoviePlaygroundRenderAndSeeArtifact";

if (path.resolve(process.argv[1] ?? "") === path.resolve(import.meta.filename))
  void main().catch((error: unknown): void => {
    console.error(error);
    process.exitCode = 1;
  });
