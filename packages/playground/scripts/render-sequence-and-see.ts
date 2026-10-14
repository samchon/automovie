import path from "node:path";

import { main } from "./renderSequenceAndSee/main.ts";

export { main } from "./renderSequenceAndSee/main.ts";
export { captureSequenceRenderAndSee } from "./captureSequenceRenderAndSee.ts";
export type { IAutoMoviePlaygroundSequenceRenderOptions } from "./IAutoMoviePlaygroundSequenceRenderOptions";
export type { IAutoMoviePlaygroundSequenceMetadata } from "./IAutoMoviePlaygroundSequenceMetadata";
export type { IAutoMovieSequenceDissolvePixelCheck } from "./IAutoMovieSequenceDissolvePixelCheck";
export type { IAutoMoviePlaygroundSequenceRenderArtifact } from "./IAutoMoviePlaygroundSequenceRenderArtifact";

if (path.resolve(process.argv[1] ?? "") === path.resolve(import.meta.filename))
  void main().catch((error: unknown): void => {
    console.error(error);
    process.exitCode = 1;
  });
