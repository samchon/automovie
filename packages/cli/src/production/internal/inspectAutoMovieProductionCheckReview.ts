import type { IAutoMovieProductionCheck } from "@automovie/interface";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { AutoMovieCliReview } from "../../review/AutoMovieCliReview";
import type { IAutoMovieCliReviewObservation } from "../../review/IAutoMovieCliReviewObservation";
import { sameAutoMovieReviewFile } from "../../review/internal/sameAutoMovieReviewFile";

/*
 * Check the existing review owner's explicit observation of the exact file. Its
 * author, activity, actual frame scope and decision are all required. A machine
 * locator or a still satisfies no playback or listening check.
 * Parameter check: The production's required file observation and frame interval.
 * Parameter root: The production directory that resolves both source files.
 * Returns: The current review outcome and its owning observation.
 */
export async function inspectAutoMovieProductionCheckReview(
  check: IAutoMovieProductionCheck.IReview,
  root: string,
  hashFile: (file: string) => Promise<string>,
): Promise<
  Pick<IAutoMovieProductionCheck.IResult, "state" | "message" | "evidence">
> {
  const evidence: string = check.observation;
  const { fromFrame, endFrame }: IAutoMovieProductionCheck.IReview["frames"] =
    check.frames;
  if (
    !Number.isSafeInteger(fromFrame) ||
    !Number.isSafeInteger(endFrame) ||
    fromFrame < 0 ||
    fromFrame >= endFrame
  )
    throw new Error(
      "A review check needs a nonempty zero-based frame interval.",
    );
  const pending = (message: string) => ({
    state: "awaiting-review" as const,
    message,
    evidence,
  });
  let source: string;
  try {
    source = await fs.readFile(path.resolve(root, evidence), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return pending(
      `Record ${check.viewed} review of frames ${fromFrame}–${endFrame - 1}.`,
    );
  }
  let value: IAutoMovieCliReviewObservation;
  try {
    value = AutoMovieCliReview.readObservation(JSON.parse(source) as unknown);
  } catch (error) {
    const reason: string =
      error instanceof SyntaxError
        ? "Invalid file review JSON"
        : error instanceof Error
          ? error.message
          : String(error);
    return {
      state: "unobserved",
      message: `${reason}. Select a valid ${check.viewed} receipt for frames ${fromFrame}–${endFrame - 1}.`,
      evidence,
    };
  }
  const file: string = path.resolve(root, check.file);
  if (
    value.subject !== check.subject ||
    !(await sameAutoMovieReviewFile(path.resolve(root, value.file), file))
  )
    return pending("The observation addresses a different subject or video.");
  try {
    if ((await hashFile(file)) !== value.sha256)
      return {
        state: "stale",
        message: "The reviewer observed earlier bytes at this path.",
        evidence,
      };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return {
      state: "unobserved",
      message: `Restore or render ${check.file} before requesting review.`,
      evidence,
    };
  }
  if (
    value.viewed !== check.viewed ||
    value.observed === null ||
    value.observed.firstFrame > fromFrame ||
    value.observed.endFrame < endFrame ||
    value.reviewer === null ||
    value.decision === null ||
    (check.occurrence !== undefined &&
      (value.cut.state !== "resolved" ||
        value.cut.entry !== check.occurrence.entry ||
        value.cut.shot !== check.occurrence.shot))
  )
    return pending(
      `Record ${check.viewed} and a named decision for the current video over frames ${fromFrame}–${endFrame - 1}.`,
    );
  const observation: NonNullable<IAutoMovieCliReviewObservation["observed"]> =
    value.observed;
  if (check.viewed === "still" && endFrame - fromFrame !== 1)
    return pending("A still decision can cover only one frame.");
  if (check.viewed !== "still") {
    // Frame selection can intersect a piece of a frame outside a reviewer’s
    // requested interval. Compare the actual reported span as well.
    const stride: number =
      (observation.end.ticks - observation.start.ticks) /
      (observation.endFrame - observation.firstFrame);
    const [numerator, denominator]: typeof observation.start.timeBase =
      observation.start.timeBase;
    const frameStart: (frame: number) => number = (frame: number): number =>
      (frame * stride * numerator) / denominator;
    if (
      value.requested.to === null ||
      value.requested.from > frameStart(fromFrame) ||
      value.requested.to < frameStart(endFrame)
    )
      return pending(
        "The recorded continuous review covers only part of the required span.",
      );
  }
  return {
    state: value.decision === "accepted" ? "passed" : "failed",
    message: `Recorded ${value.viewed} ${value.decision} by ${value.reviewer}. ${value.note}`,
    evidence,
  };
}
