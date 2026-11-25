import type {
  IAutoMovieControlRecord,
  IAutoMovieDeliveryContentAudit,
  IAutoMovieDrawnVideoResult,
} from "@automovie/interface";
import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { IAutoMovieVerification } from "./IAutoMovieVerification";

type AutoMovieAuditedClock = Pick<
  IAutoMovieDeliveryContentAudit.IResult["expected"],
  "frameRate" | "frameCount"
>;

type AutoMovieReportedFrame = Pick<
  IAutoMovieDrawnVideoResult["frames"][number],
  "index" | "seconds"
>;

type AutoMovieDeliveryOutcome = Pick<
  IAutoMovieVerification.IResult,
  "state" | "message" | "evidence"
>;

/** Fields the existing render report publishes for its file and attempt. */
interface IRenderReport {
  readonly subject: string;
  readonly status: "published" | "blocked" | "failed";
  readonly video: string | null;
  readonly source: { readonly file: string; readonly sha256: string } | null;
  readonly frames?: readonly AutoMovieReportedFrame[];
  readonly delivery?: { readonly expected?: AutoMovieAuditedClock } | null;
  readonly failure?: { readonly message?: string };
}

/**
 * Verify the promoted movie beside its report using the digest of the staged
 * bytes audited before publication. Required controls carry the same digest. A
 * blocked or failed attempt reports any previous movie separately.
 *
 * @param check The production's delivery criterion.
 * @param root The directory holding the production and its outputs.
 * @returns The file-binding verdict and its owning report.
 */
export async function inspectAutoMovieVerificationDelivery(
  check: IAutoMovieVerification.IDelivery,
  root: string,
  hashFile: (file: string) => Promise<string>,
): Promise<AutoMovieDeliveryOutcome> {
  const evidence: string = check.report;
  const reportPath: string = path.resolve(root, evidence);
  let report: IRenderReport;
  try {
    report = JSON.parse(await fs.readFile(reportPath, "utf8")) as IRenderReport;
  } catch (error) {
    if (error instanceof SyntaxError)
      return {
        state: "unobserved",
        message: `Rerender ${check.subject} to replace its malformed render report.`,
        evidence,
      };
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
  const auditedHash: string | undefined = report.source?.sha256;
  if (
    report.status !== "published" ||
    typeof report.video !== "string" ||
    report.video.length === 0 ||
    report.video !== path.basename(report.video) ||
    typeof report.source?.file !== "string" ||
    !report.source.file.trim() ||
    !validDigest(auditedHash)
  )
    return {
      state: "unobserved",
      message: "The report lacks a bound publication.",
      evidence,
    };
  const directory: string = path.dirname(reportPath);
  const file: string = path.join(directory, report.video);
  let hash: string;
  try {
    hash = await hashFile(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return {
      state: "unobserved",
      message: `Restore the published movie at ${path.relative(root, file)}.`,
      evidence,
    };
  }
  if (hash !== auditedHash)
    return {
      state: "stale",
      message: `The bytes of ${report.video} differ from its published report.`,
      evidence,
    };

  const match: string = `Published bytes match ${path.relative(root, file)}.`;
  if (check.controls === undefined || check.controls.length === 0)
    return { state: "passed", message: match, evidence };
  const frames: readonly AutoMovieReportedFrame[] | undefined = report.frames;
  const expected: AutoMovieAuditedClock | undefined = report.delivery?.expected;
  if (
    !Array.isArray(frames) ||
    frames.length === 0 ||
    frames.length !== expected?.frameCount ||
    frames.some(
      (frame: AutoMovieReportedFrame, index: number): boolean =>
        frame?.index !== index ||
        !Number.isFinite(frame.seconds) ||
        frame.seconds < 0,
    )
  )
    return {
      state: "unobserved",
      message: `Rerender ${check.subject} to record the frame indices and times for its required controls.`,
      evidence,
    };
  const recordPath: string = path.join(directory, "controls", "record.json");
  const controlEvidence: string = path.relative(root, recordPath);
  const controls: AutoMovieDeliveryOutcome = await inspectControlRecord({
    recordPath,
    evidence: controlEvidence,
    subject: check.subject,
    hash,
    expected,
    frames,
    required: check.controls,
  });
  return controls.state === "passed"
    ? { state: "passed", message: `${match} ${controls.message}`, evidence }
    : controls;
}

async function inspectControlRecord(props: {
  recordPath: string;
  evidence: string;
  subject: string;
  hash: string;
  expected: AutoMovieAuditedClock | undefined;
  frames: readonly AutoMovieReportedFrame[];
  required: readonly string[];
}): Promise<AutoMovieDeliveryOutcome> {
  const { recordPath, evidence, subject, hash, expected, frames } = props;
  const required: string[] = [...new Set(props.required)];
  const passes: string = required.join(", ");
  const unobserved = (message: string): AutoMovieDeliveryOutcome => ({
    state: "unobserved",
    message,
    evidence,
  });
  let controls: IAutoMovieControlRecord | null;
  try {
    controls = JSON.parse(
      await fs.readFile(recordPath, "utf8"),
    ) as IAutoMovieControlRecord | null;
  } catch (error) {
    if (
      (error as NodeJS.ErrnoException).code !== "ENOENT" &&
      !(error instanceof SyntaxError)
    )
      throw error;
    return unobserved(
      `Restore the control record for ${passes} at ${evidence}.`,
    );
  }
  if (
    controls === null ||
    typeof controls.film !== "string" ||
    !validDigest(controls.filmSha256)
  )
    return unobserved(
      `Render ${passes} to record the subject and film digest.`,
    );
  if (controls.film !== subject || controls.filmSha256 !== hash)
    return {
      state: "stale",
      message: "The control record is bound to a different film.",
      evidence,
    };
  if (!matchesClock(controls.clock, expected))
    return unobserved(
      `Render ${passes} with a control record matching the movie frame count and rate.`,
    );
  const channels: readonly IAutoMovieControlRecord.IChannel[] = Array.isArray(
    controls.channels,
  )
    ? controls.channels
    : [];
  const incomplete: string[] = required.filter((pass: string): boolean => {
    const matches: IAutoMovieControlRecord.IChannel[] = channels.filter(
      (channel: IAutoMovieControlRecord.IChannel): boolean =>
        channel?.pass === pass,
    );
    return matches.length !== 1 || !completeSequence(matches[0]!, frames);
  });
  if (incomplete.length !== 0)
    return unobserved(
      `Render a complete control record for ${incomplete.join(", ")}.`,
    );
  return {
    state: "passed",
    message: `The control record for ${passes} matches at ${evidence}. Use its frame digests to verify the image files for transfer.`,
    evidence,
  };
}

function matchesClock(
  clock: IAutoMovieControlRecord.IClock | null | undefined,
  expected: AutoMovieAuditedClock | null | undefined,
): boolean {
  const count: number | undefined = expected?.frameCount;
  const rate: AutoMovieAuditedClock["frameRate"] | undefined =
    expected?.frameRate;
  const controlRate: IAutoMovieControlRecord.IClock["frameRate"] | undefined =
    clock?.frameRate;
  return (
    typeof count === "number" &&
    Number.isSafeInteger(count) &&
    count > 0 &&
    clock?.frameCount === count &&
    Array.isArray(controlRate) &&
    controlRate.length === 2 &&
    Array.isArray(rate) &&
    rate.length === 2 &&
    rate.every(
      (term: number, index: number): boolean =>
        Number.isSafeInteger(term) && term > 0 && controlRate[index] === term,
    )
  );
}

function completeSequence(
  channel: IAutoMovieControlRecord.IChannel,
  reported: readonly AutoMovieReportedFrame[],
): boolean {
  if (
    channel.frameCount !== reported.length ||
    !Array.isArray(channel.frames) ||
    channel.frames.length !== reported.length ||
    channel.convention?.pass !== channel.pass ||
    typeof channel.inputPattern !== "string" ||
    channel.inputPattern.trim() === ""
  )
    return false;

  const sequence: ReturnType<typeof createHash> = createHash("sha256");
  for (const [index, frame] of channel.frames.entries()) {
    if (
      frame?.index !== index ||
      frame.seconds !== reported[index]!.seconds ||
      !validDigest(frame.sha256)
    )
      return false;
    sequence.update(`${frame.sha256}\n`);
  }
  return sequence.digest("hex") === channel.sequenceSha256;
}

function validDigest(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length === 64 &&
    /^[a-f0-9]+$/u.test(value)
  );
}
