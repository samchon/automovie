import fs from "node:fs";
import path from "node:path";

import { repositoryRoot } from "../repositoryRoot";

/**
 * Read one stored fixture file, fresh on every call.
 *
 * The file lies under `test/src/features/internal/fixtures/`, found from the
 * repository root (`repositoryRoot`), so it is the same file under `pnpm test`
 * and `pnpm test:esbuild`. It holds the JSON `recordTestFixtures` wrote for the
 * record type the caller names as `T`; the parsed value is that record, neither
 * cast nor checked. Nothing is kept between calls, so a test may change what it
 * reads without reaching another test.
 *
 * @param relative The file's path under the fixtures folder, such as
 *   `humans/m-average.json`.
 * @returns The parsed record.
 * @throws {Error} When the file does not exist or is not JSON.
 */
export async function readFixture<T>(relative: string): Promise<T> {
  const value: T = JSON.parse(
    await fs.promises.readFile(
      path.join(repositoryRoot(), readFixture.FOLDER, relative),
      "utf8",
    ),
  );
  return value;
}

/** Companion constants of {@link readFixture}. */
export namespace readFixture {
  /** The fixtures folder, relative to the repository root. */
  export const FOLDER: string = "test/src/features/internal/fixtures";
}
