import * as fs from "node:fs/promises";

import { readAutoMovieErrorCode } from "./readAutoMovieErrorCode";

/**
 * Installs the approved film, its control channels when the attempt drew them,
 * and then its report. The former film and former `controls/` wait in staging
 * until all are in place; when any step fails they return and whatever was
 * installed is removed, so the published film, channels and report always
 * belong to the same attempt.
 *
 * An attempt without control channels leaves a former `controls/` folder where
 * it is; its record's film digest then differs from the new report's
 * `source.sha256`, which is how a reader tells it is stale.
 */
export async function publishAutoMovieRenderAttempt(paths: {
  /** The staged encoded film. */
  candidate: string;

  /** Where the film is published. */
  video: string;

  /** The staged report. */
  pendingReport: string;

  /** Where the report is published. */
  report: string;

  /** Staging path the former film waits at. */
  previous: string;

  /** The attempt's control folder, when it drew control channels. */
  controls?: {
    /** The staged folder of frames and record. */
    candidate: string;

    /** Where the folder is published, `<out>/controls`. */
    installed: string;

    /** Staging path the former folder waits at. */
    previous: string;
  };
}): Promise<void> {
  const keep: (from: string, to: string) => Promise<boolean> = (
    from: string,
    to: string,
  ): Promise<boolean> =>
    fs
      .rename(from, to)
      .then(() => true)
      .catch((error: unknown): false => {
        if (readAutoMovieErrorCode(error) !== "ENOENT") throw error;
        return false;
      });
  const kept: boolean = await keep(paths.video, paths.previous);
  let keptControls: boolean = false;
  let installedControls: boolean = false;
  try {
    if (paths.controls !== undefined)
      keptControls = await keep(
        paths.controls.installed,
        paths.controls.previous,
      );
    await fs.rename(paths.candidate, paths.video);
    if (paths.controls !== undefined) {
      await fs.rename(paths.controls.candidate, paths.controls.installed);
      installedControls = true;
    }
    await fs.rename(paths.pendingReport, paths.report);
  } catch (cause) {
    try {
      if (kept) await fs.rename(paths.previous, paths.video);
      else await fs.rm(paths.video, { force: true });

      // Only this attempt's folder is removed; the former one returns.
      if (paths.controls !== undefined && installedControls)
        await fs.rm(paths.controls.installed, { recursive: true });
      if (paths.controls !== undefined && keptControls)
        await fs.rename(paths.controls.previous, paths.controls.installed);
    } catch (restoreFailure) {
      throw new AggregateError(
        [cause, restoreFailure],
        "Publishing failed and the previous film could not be restored to " +
          paths.video,
      );
    }
    throw cause;
  }
}
