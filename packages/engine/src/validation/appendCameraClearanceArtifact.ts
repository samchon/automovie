import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { sampleTimes } from "../motion/sampleTimes";
import { asArray } from "./asArray";
import { isRecord } from "./isRecord";
import { pushViolation } from "./pushViolation";
import { validateArrayArtifact } from "./validateArrayArtifact";
import { validateNonEmptyId } from "./validateNonEmptyId";
import { validateObjectArtifact } from "./validateObjectArtifact";
import { validateRange } from "./validateRange";
import { validateUniqueBy } from "./validateUniqueBy";

/** Count shared-clock intervals without allocating a hostile-sized grid. */
const clearanceIntervalCount: (
  duration: number,
  sampleRate: number,
) => number | null = (duration: number, sampleRate: number): number | null => {
  const frames: number = Math.max(1, Math.ceil(duration * sampleRate));
  if (!Number.isSafeInteger(frames)) return null;
  return Math.min(duration, (frames - 1) / sampleRate) === duration
    ? frames - 1
    : frames;
};

/**
 * Inspect carried camera-clearance status, camera identity and sample-plan
 * evidence.
 */

export const appendCameraClearanceArtifact: (
  reports: unknown,
  path: string,
  duration: number,
  sceneCameras: ReadonlySet<string> | null,
  violations: IAutoMovieConstraintViolation[],
) => void = (
  reports: unknown,
  path: string,
  duration: number,
  sceneCameras: ReadonlySet<string> | null,
  violations: IAutoMovieConstraintViolation[],
): void => {
  if (
    !validateArrayArtifact(
      reports,
      path,
      "camera clearance reports",
      violations,
    )
  )
    return;
  validateUniqueBy(
    Array.from(
      reports,
      (report: unknown, index: number): { id: unknown; path: string } => ({
        id: isRecord(report) ? report.camera : undefined,
        path: `${path}[${index}].camera`,
      }),
    ),
    "camera clearance report camera",
    violations,
  );
  for (
    let index: number = 0, indexLimit: number = reports.length;
    index < indexLimit;
    ++index
  ) {
    const report: unknown = reports[index];
    const reportPath: string = `${path}[${index}]`;
    if (
      !validateObjectArtifact(
        report,
        reportPath,
        "camera clearance report",
        violations,
      )
    )
      continue;
    validateNonEmptyId(
      report.camera,
      `${reportPath}.camera`,
      "clearance camera",
      violations,
    );
    if (
      typeof report.camera === "string" &&
      sceneCameras !== null &&
      !sceneCameras.has(report.camera)
    )
      pushViolation(
        violations,
        "type",
        `${reportPath}.camera`,
        `clearance camera "${report.camera}" must reference a scene camera`,
        report.camera,
      );
    validateRange(
      report.sampleRate,
      `${reportPath}.sampleRate`,
      0,
      Infinity,
      "clearance sample rate",
      violations,
      false,
    );
    validateRange(
      report.intervals,
      `${reportPath}.intervals`,
      0,
      Infinity,
      "clearance interval count",
      violations,
    );
    if (
      typeof report.intervals === "number" &&
      !Number.isSafeInteger(report.intervals)
    )
      pushViolation(
        violations,
        "type",
        `${reportPath}.intervals`,
        "clearance interval count must be a safe integer",
        report.intervals,
      );
    const validSampleTimes: boolean = validateArrayArtifact(
      report.sampleTimes,
      `${reportPath}.sampleTimes`,
      "clearance sample times",
      violations,
    );
    const reportedSampleTimes: unknown[] = asArray(report.sampleTimes);
    if (validSampleTimes)
      for (
        let index: number = 0, indexLimit: number = reportedSampleTimes.length;
        index < indexLimit;
        ++index
      ) {
        const time: unknown = reportedSampleTimes[index];
        const previous: unknown = reportedSampleTimes[index - 1];
        if (
          typeof time !== "number" ||
          !Number.isFinite(time) ||
          time < 0 ||
          time > duration
        )
          pushViolation(
            violations,
            "range",
            `${reportPath}.sampleTimes[${index}]`,
            `clearance sample time must be finite and within [0, ${duration}]`,
            time,
          );
        if (
          index > 0 &&
          typeof time === "number" &&
          typeof previous === "number" &&
          time <= previous
        )
          pushViolation(
            violations,
            "temporal",
            `${reportPath}.sampleTimes[${index}]`,
            "clearance sample times must be strictly increasing",
            time,
          );
      }
    if (
      validSampleTimes &&
      typeof report.intervals === "number" &&
      Number.isSafeInteger(report.intervals) &&
      report.intervals !== Math.max(0, reportedSampleTimes.length - 1)
    )
      pushViolation(
        violations,
        "range",
        `${reportPath}.intervals`,
        "clearance interval count must exactly match the carried sample plan",
        report.intervals,
      );
    if (
      typeof report.sampleRate === "number" &&
      Number.isFinite(report.sampleRate) &&
      report.sampleRate > 0 &&
      Number.isFinite(duration) &&
      duration >= 0
    ) {
      const expectedIntervals: number | null = clearanceIntervalCount(
        duration,
        report.sampleRate,
      );
      if (expectedIntervals === null)
        pushViolation(
          violations,
          "range",
          `${reportPath}.sampleRate`,
          "clearance duration and sample rate must produce a safe-integer interval count",
          report.sampleRate,
        );
      else if (validSampleTimes) {
        const supplied: Set<unknown> = new Set(reportedSampleTimes);
        if (
          reportedSampleTimes.length - 1 < expectedIntervals ||
          sampleTimes(duration, report.sampleRate).some(
            (time: number): boolean => !supplied.has(time),
          )
        )
          pushViolation(
            violations,
            "range",
            `${reportPath}.sampleTimes`,
            "clearance sample plan must retain every endpoint-inclusive fixed-clock instant",
            report.sampleTimes,
          );
      }
    }
    if (report.status !== "clear")
      pushViolation(
        violations,
        "type",
        `${reportPath}.status`,
        "a shot may publish only a clear camera-clearance report",
        report.status,
      );
    if (
      !validateArrayArtifact(
        report.findings,
        `${reportPath}.findings`,
        "clearance findings",
        violations,
      )
    )
      continue;
    if (report.findings.length !== 0)
      pushViolation(
        violations,
        "range",
        `${reportPath}.findings`,
        "a published clear report must contain no contact findings",
        report.findings,
      );
  }
};
