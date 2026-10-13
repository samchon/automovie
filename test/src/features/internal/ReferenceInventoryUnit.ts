import type { IAutoMovieReferenceIdentity } from "@automovie/mcp";
import path from "node:path";

import { loadSourceModule } from "./loadSourceModule";

const directory = path.resolve(__dirname, "../../../../packages/mcp/src/internal");

/** Typed access to the native reader's real policy owners through the normal source hook. */
export const ReferenceInventoryUnit = {
  append: loadSourceModule<{
    appendReferenceInventoryFile(files: string[], file: string): void;
  }>(path.join(directory, "appendReferenceInventoryFile.ts")).appendReferenceInventoryFile,
  admit: loadSourceModule<{
    admitReferenceInventoryIdentity(entry: IAutoMovieReferenceIdentity): void;
  }>(path.join(directory, "admitReferenceInventoryIdentity.ts")).admitReferenceInventoryIdentity,
  fail: loadSourceModule<{
    resolveReferenceIoFailure(error: unknown): never;
  }>(path.join(directory, "resolveReferenceIoFailure.ts")).resolveReferenceIoFailure,
  initial: loadSourceModule<{
    observeInitialReferenceLayer<T>(inspect: () => Promise<T>, recheck: () => Promise<void>): Promise<T | null>;
  }>(path.join(directory, "observeInitialReferenceLayer.ts")).observeInitialReferenceLayer,
};
