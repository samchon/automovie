import { randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { readAutoMovieErrorCode } from "../../readAutoMovieErrorCode";

/** Publish the latest receipt and preserve the first failure when requested. */
export async function writeAutoMovieProductionCheckReceipt(
  file: string,
  contents: string,
  retainFailure: boolean,
): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  if (retainFailure)
    await publish(
      file.replace(/\.json$/u, ".first-failure.json"),
      contents,
      true,
    );
  await publish(file, contents, false);
}

/** Stage complete receipt bytes before exclusive creation or replacement. */
async function publish(
  file: string,
  contents: string,
  exclusive: boolean,
): Promise<void> {
  const temporary: string = `${file}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, contents, { flag: "wx" });
    if (exclusive) {
      // The link installs a complete witness and leaves any prior one intact.
      await fs.link(temporary, file).catch((error: unknown): void => {
        if (readAutoMovieErrorCode(error) !== "EEXIST") throw error;
      });
      await fs.unlink(temporary);
    } else await fs.rename(temporary, file);
  } catch (error) {
    try {
      await fs.unlink(temporary);
    } catch (cleanup) {
      if (readAutoMovieErrorCode(cleanup) !== "ENOENT")
        throw new AggregateError(
          [error, cleanup],
          "Verification receipt publication and cleanup both failed.",
        );
    }
    throw error;
  }
}
