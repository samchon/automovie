import type { IAutoMovieControlRecord } from "@automovie/interface";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { IAutoMovieVerification } from "./IAutoMovieVerification";
import { hashAutoMovieFile } from "./hashAutoMovieFile";

/** Fields the existing render report publishes for its file and attempt. */
interface IRenderReport {
  readonly subject: string;
  readonly status: "published" | "blocked" | "failed";
  readonly video: string | null;
  readonly source: { readonly file: string; readonly sha256: string } | null;
  readonly failure?: { readonly message?: string };
}

/**
 * Verify that a published report and requested controls name the actual current
 * movie. Blocked and failed reports never establish current delivery, even when
 * a previous movie is still present beside them.
 *
 * @param check The production's delivery criterion.
 * @param root The directory holding the production and its outputs.
 * @returns The file-binding verdict and its owning report.
 */
export async function inspectAutoMovieVerificationDelivery(
  check: IAutoMovieVerification.IDelivery,
  root: string,
): Promise<
  Pick<IAutoMovieVerification.IResult, "state" | "message" | "evidence">
> {
  const evidence: string = check.report;
  const reportPath: string = path.resolve(root, evidence);
  let report: IRenderReport;
  try {
    report = JSON.parse(await fs.readFile(reportPath, "utf8")) as IRenderReport;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return {
      state: "not-run",
      message: `Render ${check.subject} and inspect its latest report.`,
      evidence,
    };
  }
  if (report?.subject !== check.subject)
    return {
      state: "unobserved",
      message: `The report does not describe ${check.subject}.`,
      evidence,
    };
  if (report.status === "blocked" || report.status === "failed") {
    const previous: string[] = [];
    for (const file of ["film.mp4", "film.mov"]) {
      const candidate: string = path.resolve(path.dirname(reportPath), file);
      try {
        if ((await fs.stat(candidate)).isFile())
          previous.push(path.relative(root, candidate));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
    return {
      state: "failed",
      message:
        `Latest render ${report.status}. ${report.failure?.message ?? "Inspect the render report."}` +
        (previous.length === 0
          ? ""
          : ` Previous output: ${previous.join(", ")}.`),
      evidence,
    };
  }
  if (
    report.status !== "published" ||
    typeof report.video !== "string" ||
    report.video.length === 0 ||
    report.video !== path.basename(report.video) ||
    report.source?.file !== report.video ||
    !/^[a-f\d]{64}$/u.test(report.source.sha256)
  )
    return {
      state: "unobserved",
      message: "The report lacks a bound publication.",
      evidence,
    };
  const directory: string = path.dirname(reportPath);
  const file: string = path.join(directory, report.video);
  try {
    const hash: string = await hashAutoMovieFile(file);
    if (hash !== report.source.sha256)
      return {
        state: "stale",
        message: `The bytes of ${report.video} differ from its published report.`,
        evidence,
      };
    if (check.controls !== undefined && check.controls.length !== 0) {
      const controlsPath: string = path.join(
        directory,
        "controls",
        "record.json",
      );
      const controls: IAutoMovieControlRecord = JSON.parse(
        await fs.readFile(controlsPath, "utf8"),
      ) as IAutoMovieControlRecord;
      if (controls?.film !== check.subject || controls.filmSha256 !== hash)
        return {
          state: "stale",
          message: "The controls were recorded for different film bytes.",
          evidence: path.relative(root, controlsPath),
        };
      const passes: Set<string> = new Set(
        Array.isArray(controls.channels)
          ? controls.channels.map(
              (channel: IAutoMovieControlRecord.IChannel): string =>
                channel.pass,
            )
          : [],
      );
      const missing: string[] = check.controls.filter(
        (pass: string): boolean => !passes.has(pass),
      );
      if (missing.length !== 0)
        return {
          state: "unobserved",
          message: `Render the required controls: ${missing.join(", ")}.`,
          evidence,
        };
    }
    return {
      state: "passed",
      message: `Published bytes match ${path.relative(root, file)}.`,
      evidence,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return {
      state: "unobserved",
      message: "Restore the published movie or required control record.",
      evidence,
    };
  }
}
