import type {
  IAutoMovieCameraClearanceReport,
  IAutoMovieConstraintViolation,
} from "@automovie/interface";

import { sampleTimes } from "../../motion/internal/sampleTimes";
import { pushViolation } from "./pushViolation";
import { validateRange } from "./validateRange";
import { validateUniqueBy } from "./validateUniqueBy";

/** Count shared-clock intervals without allocating a hostile-sized grid. */
function clearanceIntervalCount(
  duration: number,
  sampleRate: number,
): number | null {
  const frames: number = Math.max(1, Math.ceil(duration * sampleRate));
  if (frames > Number.MAX_SAFE_INTEGER) return null;
  return Math.min(duration, (frames - 1) / sampleRate) === duration
    ? frames - 1
    : frames;
}

/**
 * Inspect carried camera-clearance status, camera identity and sample-plan
 * evidence.
 */
export function appendCameraClearanceArtifact(
  reports: readonly IAutoMovieCameraClearanceReport[],
  path: string,
  duration: number,
  sceneCameras: ReadonlySet<string> | null,
  violations: IAutoMovieConstraintViolation[],
): void {
  validateUniqueBy(
    reports.map(
      (
        report: IAutoMovieCameraClearanceReport,
        index: number,
      ): { id: string; path: string } => ({
        id: report.camera,
        path: `${path}[${index}].camera`,
      }),
    ),
    "camera clearance report camera",
    violations,
  );
  reports.forEach(
    (report: IAutoMovieCameraClearanceReport, index: number): void => {
      const reportPath: string = `${path}[${index}]`;
      if (sceneCameras !== null && !sceneCameras.has(report.camera))
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

      const reportedSampleTimes: readonly number[] = report.sampleTimes;
      reportedSampleTimes.forEach((time: number, at: number): void => {
        if (time < 0 || time > duration)
          pushViolation(
            violations,
            "range",
            `${reportPath}.sampleTimes[${at}]`,
            `clearance sample time must be finite and within [0, ${duration}]`,
            time,
          );
        if (at > 0 && time <= reportedSampleTimes[at - 1]!)
          pushViolation(
            violations,
            "temporal",
            `${reportPath}.sampleTimes[${at}]`,
            "clearance sample times must be strictly increasing",
            time,
          );
      });
      if (report.intervals !== Math.max(0, reportedSampleTimes.length - 1))
        pushViolation(
          violations,
          "range",
          `${reportPath}.intervals`,
          "clearance interval count must exactly match the carried sample plan",
          report.intervals,
        );
      if (report.sampleRate > 0 && duration >= 0) {
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
        else {
          const supplied: Set<number> = new Set(reportedSampleTimes);
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
      if (report.findings.length !== 0)
        pushViolation(
          violations,
          "range",
          `${reportPath}.findings`,
          "a published clear report must contain no contact findings",
          report.findings,
        );
    },
  );
}
