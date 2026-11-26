import type {
  IAutoMovieCaptureCellRecord,
  IAutoMovieCaptureFindingDiff,
  IAutoMovieCaptureRecord,
  IAutoMovieInspectionDiagnostics,
  IAutoMovieProductionCheck,
} from "@automovie/interface";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { hashAutoMovieFile } from "./hashAutoMovieFile";
import { loadAutoMovieProductionModule } from "./loadAutoMovieProductionModule";

/**
 * Read one source-owned diagnostic from a capture's selected camera and pass. A
 * still covers one second. A frame interval needs a drawn cell and checked
 * diagnostic coverage for each consecutive frame in its half-open range. The
 * aggregate capture audit carries no cell address, so a record mixing views or
 * passes at one of the chosen times cannot establish this particular
 * observation.
 *
 * @param check The authored capture criterion.
 * @param record The capture writer's persisted JSON.
 * @param root The production directory resolving the record and its stills.
 * @returns The supported verdict with the exact record to reopen.
 */
export async function inspectAutoMovieProductionCheckCapture(
  check: IAutoMovieProductionCheck.ICapture,
  record: unknown,
  root: string,
  hashFile: (file: string) => Promise<string> = hashAutoMovieFile,
): Promise<
  Pick<IAutoMovieProductionCheck.IResult, "state" | "message" | "evidence">
> {
  const evidence: string = check.record;
  const absent = (message: string) => ({
    state: "unobserved" as const,
    message,
    evidence,
  });
  if (record === null || typeof record !== "object" || !("state" in record))
    return absent("Run the scoped capture to write its record.");
  if (record.state !== "complete")
    return absent("The capture has not finished.");
  const capture: Extract<IAutoMovieCaptureRecord, { state: "complete" }> =
    record as Extract<IAutoMovieCaptureRecord, { state: "complete" }>;
  if (
    capture.subject?.name !== check.subject ||
    !Array.isArray(capture.rows) ||
    !Array.isArray(capture.diagnostics?.episodes) ||
    !Array.isArray(capture.diagnostics?.coverage)
  )
    return absent("Capture the selected subject with its diagnostic enabled.");

  const at: IAutoMovieProductionCheck.ICapture["at"] = check.at;
  if (!validSelection(at))
    throw new Error(
      "A capture check needs a finite second or a nonempty frame interval.",
    );
  const atTime = (time: IAutoMovieInspectionDiagnostics.ITime): boolean =>
    "second" in at
      ? time.filmSeconds === at.second
      : time.outputFrame !== undefined &&
        at.fromFrame <= time.outputFrame &&
        time.outputFrame < at.endFrame;
  const rows: IAutoMovieCaptureCellRecord[] = capture.rows.filter(
    (row: IAutoMovieCaptureCellRecord): boolean =>
      atTime({
        filmSeconds: row.time.seconds,
        ...(row.time.frame === null ? {} : { outputFrame: row.time.frame }),
      }),
  );
  if (
    rows.some(
      (row: IAutoMovieCaptureCellRecord): boolean =>
        row.view !== check.view || row.pass !== check.pass,
    )
  )
    return absent(
      `Capture the selected interval through only ${check.view} / ${check.pass}; this audit combines other views or passes.`,
    );
  if (rows.length === 0)
    return absent("The requested samples were not captured.");
  if (
    rows.some(
      (row: IAutoMovieCaptureCellRecord): boolean => row.state === "failed",
    )
  )
    return {
      state: "failed",
      message: "A selected capture cell failed to draw.",
      evidence,
    };

  const coverage: readonly IAutoMovieInspectionDiagnostics.ICoverageRange[] =
    capture.diagnostics.coverage.filter(
      (range: IAutoMovieInspectionDiagnostics.ICoverageRange): boolean =>
        range.scope === check.occurrence &&
        range.coverage.check === check.diagnostic.check &&
        range.coverage.key === check.diagnostic.key,
    );
  const expected: number = "second" in at ? 1 : at.endFrame - at.fromFrame;
  const observed: Set<number> = new Set();
  const directory: string = path.resolve(root, path.dirname(check.record));
  let from: number = Infinity;
  let to: number = -Infinity;
  for (const row of rows) {
    if (row.state !== "drawn") continue;
    const { frame, seconds }: IAutoMovieCaptureCellRecord["time"] = row.time;
    const matching: readonly IAutoMovieInspectionDiagnostics.ICoverageRange[] =
      coverage.filter(
        (range: IAutoMovieInspectionDiagnostics.ICoverageRange): boolean =>
          frame !== null &&
          range.first.outputFrame !== undefined &&
          range.last.outputFrame !== undefined
            ? range.first.outputFrame <= frame &&
              frame <= range.last.outputFrame &&
              range.samples ===
                range.last.outputFrame - range.first.outputFrame + 1
            : range.first.filmSeconds === seconds &&
              range.last.filmSeconds === seconds,
      );
    if (
      matching.length !== 0 &&
      matching.every(
        (range: IAutoMovieInspectionDiagnostics.ICoverageRange): boolean =>
          range.coverage.status === "checked",
      ) &&
      (await retainsStill(row, directory, root, hashFile))
    ) {
      observed.add(frame ?? seconds);
      from = Math.min(from, seconds);
      to = Math.max(to, seconds);
    }
  }
  if (observed.size !== expected)
    return absent(
      `Only ${observed.size}/${expected} requested samples have checked coverage and matching stills. Recapture the requested samples.`,
    );

  const episodes: readonly IAutoMovieInspectionDiagnostics.IEpisode[] =
    capture.diagnostics.episodes.filter(
      (episode: IAutoMovieInspectionDiagnostics.IEpisode): boolean =>
        episode.scope === check.occurrence &&
        episode.worst.finding.check === check.diagnostic.check &&
        episode.worst.finding.key === check.diagnostic.key &&
        overlaps(episode, from, to),
    );
  const failure: IAutoMovieInspectionDiagnostics.IEpisode | undefined =
    episodes.find(
      (episode: IAutoMovieInspectionDiagnostics.IEpisode): boolean =>
        episode.worst.finding.category === "error" &&
        episode.worst.finding.confidence === "confirmed" &&
        atTime(episode.worst.time),
    );
  if (failure !== undefined)
    return {
      state: "failed",
      message: failure.worst.finding.message,
      evidence,
    };
  if (episodes.length !== 0)
    return absent(
      "Retake the finding's interval to separate possible or neighboring defects.",
    );

  const difference: IAutoMovieCaptureFindingDiff | undefined =
    capture.comparison?.findings;
  if (
    difference?.state === "compared" &&
    difference.entries.some(
      (entry): boolean =>
        entry.category === "error" &&
        entry.scope === check.occurrence &&
        entry.check === check.diagnostic.check &&
        entry.key === check.diagnostic.key &&
        entry.state === "unmatched" &&
        touchesUncovered(entry.uncovered, from, to),
    )
  )
    return absent(
      "The comparison lacks coverage of an error affecting this selection. Capture both affected intervals.",
    );
  return {
    state: "passed",
    message: `${observed.size} requested samples checked.`,
    evidence,
  };
}

/** Admit a nonnegative subject second or an ordered zero-based frame range. */
function validSelection(at: IAutoMovieProductionCheck.ICapture["at"]): boolean {
  return "second" in at
    ? Number.isFinite(at.second) && at.second >= 0
    : Number.isSafeInteger(at.fromFrame) &&
        Number.isSafeInteger(at.endFrame) &&
        0 <= at.fromFrame &&
        at.fromFrame < at.endFrame;
}

/**
 * Relate a finding's observed extent to a requested time. Unknown frame
 * identity stays unresolved.
 */
function overlaps(
  episode: IAutoMovieInspectionDiagnostics.IEpisode,
  from: number,
  to: number,
): boolean {
  const first: number = episode.first.time.filmSeconds;
  const last: number = episode.last.filmSeconds;
  const worst: number = episode.worst.time.filmSeconds;
  return (
    Math.min(first, last, worst) <= to && from <= Math.max(first, last, worst)
  );
}

function touchesUncovered(
  ranges: readonly IAutoMovieInspectionDiagnostics.IInterval[] | undefined,
  from: number,
  to: number,
): boolean {
  return (
    !Array.isArray(ranges) ||
    ranges.length === 0 ||
    ranges.some(
      (range: IAutoMovieInspectionDiagnostics.IInterval): boolean =>
        !Number.isFinite(range?.from) ||
        !Number.isFinite(range?.to) ||
        range.from > range.to ||
        (range.from <= to && from <= range.to),
    )
  );
}

/**
 * Availability of an existing still. Keep permission and other read failures
 * visible.
 */
async function retainsStill(
  row: Extract<IAutoMovieCaptureCellRecord, { state: "drawn" }>,
  directory: string,
  root: string,
  hashFile: (file: string) => Promise<string>,
): Promise<boolean> {
  if (
    typeof row.file !== "string" ||
    !row.file.endsWith(".png") ||
    row.file !== path.basename(row.file)
  )
    return false;
  const file: string = path.join(directory, row.file);
  let bytes: Buffer;
  try {
    if (!(await fs.stat(file)).isFile()) return false;
    if (row.fileSha256 !== undefined)
      return (
        /^[a-f\d]{64}$/u.test(row.fileSha256) &&
        (await hashFile(file)) === row.fileSha256
      );
    if (typeof row.hash !== "string" || !/^sha256:[a-f\d]{64}$/u.test(row.hash))
      return false;
    bytes = await fs.readFile(file);
  } catch (error) {
    const code: string | undefined = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR" || code === "EISDIR")
      return false;
    throw error;
  }

  const render: typeof import("@automovie/render") =
    await import("@automovie/render").catch(
      (error: unknown): typeof import("@automovie/render") => {
        const code: string | undefined = (error as NodeJS.ErrnoException).code;
        if (code !== "ERR_MODULE_NOT_FOUND" && code !== "MODULE_NOT_FOUND")
          throw error;
        return loadAutoMovieProductionModule(
          root,
          "@automovie/render",
        ) as typeof import("@automovie/render");
      },
    );
  try {
    return (
      render.hashAutoMovieRasterImage(
        await render.decodeAutoMovieRasterPng(bytes),
      ) === row.hash
    );
  } catch {
    return false;
  }
}
