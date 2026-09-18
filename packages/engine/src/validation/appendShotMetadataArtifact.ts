import { IAutoMovieConstraintViolation, IAutoMovieShot } from "@automovie/interface";
import { sampleTimes } from "../motion/sampleTimes";
import { asArray } from "./asArray";
import { isRecord } from "./isRecord";
import { pushViolation } from "./pushViolation";
import { validateArrayArtifact } from "./validateArrayArtifact";
import { validateNonEmptyId } from "./validateNonEmptyId";
import { validateObjectArtifact } from "./validateObjectArtifact";
import { validateRange } from "./validateRange";
import { validateUniqueBy } from "./validateUniqueBy";
import { validateVectorArtifact } from "./validateVectorArtifact";
import { validateClipArtifact } from "./validateClipArtifact";

/**
 * The shot metadata fields validators used to pass ungated: `events`,
 * `cameraIntent`, `coverage`, and camera clearance.
 *
 * A field the engine emits and a consumer dereferences is part of the artifact
 * contract, not decoration: `playbackEvents` and `reviewVisualRead` iterate
 * `shot.events` (a non-iterable value throws with no path), and a render or
 * diffusion host reads `cameraIntent` and `coverage` as the structural guide
 * metadata #1187 promised it. All three are optional on {@link IAutoMovieShot}
 * and documented as "absent means legacy", so absence stays valid; only a
 * PRESENT value is inspected.
 *
 * `sceneCameras` is the scene's camera-id set when the caller has a scene to
 * cross-reference (the submitted-artifact path) and `null` when it does not
 * (the stored-slice path, which reads one file with no scene beside it).
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `appendShotMetadataArtifact` locates invalid events, camera intent, and coverage entries under their owning shot metadata fields.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `appendShotMetadataArtifact` retains event index, time, subject references, camera identity, and coverage interval observations without widening them to the whole artifact.
 */
export const appendShotMetadataArtifact = (
  /**
   * Structural, not `IAutoMovieShot`, so both callers pass their own value
   * without a cast: the submitted artifact arrives already narrowed to a
   * record, the stored slice arrives as the typed shot.
   */
  shot: {
    duration?: unknown;
    camera?: unknown;
    events?: unknown;
    cameraIntent?: unknown;
    coverage?: unknown;
    cameraClearance?: unknown;
  },
  path: string,
  sceneCameras: ReadonlySet<string> | null,
  violations: IAutoMovieConstraintViolation[],
): void => {
  const duration = typeof shot.duration === "number" ? shot.duration : Infinity;
  if (shot.events !== undefined)
    appendShotEventsArtifact(
      shot.events,
      `${path}.events`,
      duration,
      violations,
    );
  if (shot.cameraIntent !== undefined)
    appendCameraIntentArtifact(
      shot.cameraIntent,
      `${path}.cameraIntent`,
      duration,
      violations,
    );
  if (shot.coverage !== undefined)
    appendShotCoverageArtifact(
      shot.coverage,
      `${path}.coverage`,
      duration,
      shot.camera,
      sceneCameras,
      violations,
    );
  if (shot.cameraClearance !== undefined)
    appendCameraClearanceArtifact(
      shot.cameraClearance,
      `${path}.cameraClearance`,
      duration,
      sceneCameras,
      violations,
    );
};

/** Count shared-clock intervals without allocating a hostile-sized grid. */
const clearanceIntervalCount = (
  duration: number,
  sampleRate: number,
): number | null => {
  const frames = Math.max(1, Math.ceil(duration * sampleRate));
  if (!Number.isSafeInteger(frames)) return null;
  return Math.min(duration, (frames - 1) / sampleRate) === duration
    ? frames - 1
    : frames;
};

/**
 * Validate the accepted clearance evidence a shot publishes.
 *
 * The report carries no revision of its own, so there is no revision pair to
 * compare here. A published report must be `clear`, and an evaluation returns
 * `stale` rather than `clear` whenever the revision it measured is not the one
 * current at its gate, so refusing every non-clear status is what keeps stored
 * clearance evidence tied to current geometry.
 */
const appendCameraClearanceArtifact = (
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
    reports.map((report, index) => ({
      id: isRecord(report) ? report.camera : undefined,
      path: `${path}[${index}].camera`,
    })),
    "camera clearance report camera",
    violations,
  );
  reports.forEach((report, index) => {
    const reportPath = `${path}[${index}]`;
    if (
      !validateObjectArtifact(
        report,
        reportPath,
        "camera clearance report",
        violations,
      )
    )
      return;
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
    const validSampleTimes = validateArrayArtifact(
      report.sampleTimes,
      `${reportPath}.sampleTimes`,
      "clearance sample times",
      violations,
    );
    const reportedSampleTimes = asArray(report.sampleTimes);
    if (validSampleTimes)
      reportedSampleTimes.forEach((time, index) => {
        const previous = reportedSampleTimes[index - 1];
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
      });
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
      const expectedIntervals = clearanceIntervalCount(
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
        const supplied = new Set(reportedSampleTimes);
        if (
          reportedSampleTimes.length - 1 < expectedIntervals ||
          sampleTimes(duration, report.sampleRate).some(
            (time) => !supplied.has(time),
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
      return;
    if (report.findings.length !== 0)
      pushViolation(
        violations,
        "range",
        `${reportPath}.findings`,
        "a published clear report must contain no contact findings",
        report.findings,
      );
  });
};

const appendShotEventsArtifact = (
  events: unknown,
  path: string,
  duration: number,
  violations: IAutoMovieConstraintViolation[],
): void => {
  if (!validateArrayArtifact(events, path, "shot events", violations)) return;
  events.forEach((event, i) => {
    const eventPath = `${path}[${i}]`;
    if (!validateObjectArtifact(event, eventPath, "shot event", violations))
      return;
    validateNonEmptyId(
      event.id,
      `${eventPath}.id`,
      "shot event id",
      violations,
    );
    if (typeof event.kind !== "string" || !EVENT_KINDS.has(event.kind))
      pushViolation(
        violations,
        "type",
        `${eventPath}.kind`,
        `shot event kind must be one of ${[...EVENT_KINDS].join(", ")}, but was "${String(event.kind)}"`,
        event.kind,
      );
    if (typeof event.source !== "string" || !EVENT_SOURCES.has(event.source))
      pushViolation(
        violations,
        "type",
        `${eventPath}.source`,
        `shot event source must be one of ${[...EVENT_SOURCES].join(", ")}, but was "${String(event.source)}"`,
        event.source,
      );
    // The shot-local clock: `playbackEvents` maps this onto the output timeline,
    // so a time outside the shot lands somewhere no entry plays. The upper bound
    // carries the SAME slack `performShot`'s landing gate allows (it refuses a
    // hit only past `duration + 1e-9`), or a launch that lands exactly on the
    // shot end would produce a shot this validator refuses: validator/engine
    // drift in the direction #1097 warned about.
    const time = event.time;
    if (
      typeof time !== "number" ||
      !Number.isFinite(time) ||
      time < 0 ||
      time > duration + EVENT_TIME_EPSILON
    )
      pushViolation(
        violations,
        "temporal",
        `${eventPath}.time`,
        `shot event time must be finite and within [0, ${duration}] (the shot), but was ${String(time)}`,
        time,
      );
    for (const field of ["actor", "target", "object", "reaction"] as const)
      if (event[field] !== null)
        validateNonEmptyId(
          event[field],
          `${eventPath}.${field}`,
          `shot event ${field}`,
          violations,
        );
    // A non-finite point makes `reviewVisualRead`'s contact distance NaN, and
    // `NaN > contactRadius` is false, so a genuine miss reads as a connect.
    if (event.point !== null)
      validateVectorArtifact(
        event.point,
        `${eventPath}.point`,
        "shot event point",
        violations,
      );
    if (event.actionIndex !== null && !Number.isInteger(event.actionIndex))
      pushViolation(
        violations,
        "range",
        `${eventPath}.actionIndex`,
        `shot event actionIndex must be null or an integer, but was ${String(event.actionIndex)}`,
        event.actionIndex,
      );
  });
};

const appendCameraIntentArtifact = (
  intents: unknown,
  path: string,
  duration: number,
  violations: IAutoMovieConstraintViolation[],
): void => {
  if (!validateArrayArtifact(intents, path, "camera intent spans", violations))
    return;
  intents.forEach((intent, i) => {
    const intentPath = `${path}[${i}]`;
    if (
      !validateObjectArtifact(intent, intentPath, "camera intent", violations)
    )
      return;
    validateRange(
      intent.start,
      `${intentPath}.start`,
      0,
      duration,
      "camera intent start",
      violations,
    );
    if (
      typeof intent.framing !== "string" ||
      !CAMERA_FRAMINGS.has(intent.framing)
    )
      pushViolation(
        violations,
        "type",
        `${intentPath}.framing`,
        `camera intent framing must be one of ${[...CAMERA_FRAMINGS].join(", ")}, but was "${String(intent.framing)}"`,
        intent.framing,
      );
    if (typeof intent.move !== "string" || !CAMERA_MOVES.has(intent.move))
      pushViolation(
        violations,
        "type",
        `${intentPath}.move`,
        `camera intent move must be one of ${[...CAMERA_MOVES].join(", ")}, but was "${String(intent.move)}"`,
        intent.move,
      );
    if (intent.focus !== null)
      validateVectorArtifact(
        intent.focus,
        `${intentPath}.focus`,
        "camera intent focus",
        violations,
      );
    // The input gate refuses a focal length <= 0 mm; the artifact must agree.
    if (intent.focalLength !== null)
      validateRange(
        intent.focalLength,
        `${intentPath}.focalLength`,
        0,
        Infinity,
        "camera intent focal length",
        violations,
        false,
      );
  });
};

const appendShotCoverageArtifact = (
  coverage: unknown,
  path: string,
  duration: number,
  heroCamera: unknown,
  sceneCameras: ReadonlySet<string> | null,
  violations: IAutoMovieConstraintViolation[],
): void => {
  if (!validateArrayArtifact(coverage, path, "shot coverage", violations))
    return;
  const seen = new Map<string, number>();
  coverage.forEach((take, i) => {
    const takePath = `${path}[${i}]`;
    if (!validateObjectArtifact(take, takePath, "coverage take", violations))
      return;
    validateNonEmptyId(
      take.camera,
      `${takePath}.camera`,
      "coverage camera",
      violations,
    );
    if (typeof take.camera === "string") {
      if (sceneCameras !== null && !sceneCameras.has(take.camera))
        pushViolation(
          violations,
          "type",
          `${takePath}.camera`,
          `coverage camera "${take.camera}" must reference a scene camera`,
          take.camera,
        );
      // The same rule the engine enforces when compiling the take: coverage
      // plays ANOTHER angle, so the hero camera can never also cover the beat,
      // and one camera never covers it twice.
      if (take.camera === heroCamera)
        pushViolation(
          violations,
          "type",
          `${takePath}.camera`,
          `coverage plays another angle of the beat, but "${take.camera}" is already this shot's live camera`,
          take.camera,
        );
      const first = seen.get(take.camera);
      if (first !== undefined)
        pushViolation(
          violations,
          "type",
          `${takePath}.camera`,
          `coverage camera "${take.camera}" is duplicated; first declared at ${path}[${first}].camera`,
          take.camera,
        );
      else seen.set(take.camera, i);
    }
    if (take.cameraMotion === undefined)
      pushViolation(
        violations,
        "type",
        `${takePath}.cameraMotion`,
        "coverage cameraMotion must be null or a clip",
        take.cameraMotion,
      );
    else if (take.cameraMotion !== null)
      validateClipArtifact(
        take.cameraMotion,
        `${takePath}.cameraMotion`,
        violations,
      );
    appendCameraIntentArtifact(
      take.cameraIntent,
      `${takePath}.cameraIntent`,
      duration,
      violations,
    );
  });
};

/** Count shared-clock intervals without allocating a hostile-sized grid. */
const clearanceIntervalCount = (
  duration: number,
  sampleRate: number,
): number | null => {
  const frames = Math.max(1, Math.ceil(duration * sampleRate));
  if (!Number.isSafeInteger(frames)) return null;
  return Math.min(duration, (frames - 1) / sampleRate) === duration
    ? frames - 1
    : frames;
};

/**
 * Validate the accepted clearance evidence a shot publishes.
 *
 * The report carries no revision of its own, so there is no revision pair to
 * compare here. A published report must be `clear`, and an evaluation returns
 * `stale` rather than `clear` whenever the revision it measured is not the one
 * current at its gate, so refusing every non-clear status is what keeps stored
 * clearance evidence tied to current geometry.
 */
const appendCameraClearanceArtifact = (
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
    reports.map((report, index) => ({
      id: isRecord(report) ? report.camera : undefined,
      path: `${path}[${index}].camera`,
    })),
    "camera clearance report camera",
    violations,
  );
  reports.forEach((report, index) => {
    const reportPath = `${path}[${index}]`;
    if (
      !validateObjectArtifact(
        report,
        reportPath,
        "camera clearance report",
        violations,
      )
    )
      return;
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
    const validSampleTimes = validateArrayArtifact(
      report.sampleTimes,
      `${reportPath}.sampleTimes`,
      "clearance sample times",
      violations,
    );
    const reportedSampleTimes = asArray(report.sampleTimes);
    if (validSampleTimes)
      reportedSampleTimes.forEach((time, index) => {
        const previous = reportedSampleTimes[index - 1];
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
      });
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
      const expectedIntervals = clearanceIntervalCount(
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
        const supplied = new Set(reportedSampleTimes);
        if (
          reportedSampleTimes.length - 1 < expectedIntervals ||
          sampleTimes(duration, report.sampleRate).some(
            (time) => !supplied.has(time),
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
      return;
    if (report.findings.length !== 0)
      pushViolation(
        violations,
        "range",
        `${reportPath}.findings`,
        "a published clear report must contain no contact findings",
        report.findings,
      );
  });
};

const appendShotEventsArtifact = (
  events: unknown,
  path: string,
  duration: number,
  violations: IAutoMovieConstraintViolation[],
): void => {
  if (!validateArrayArtifact(events, path, "shot events", violations)) return;
  events.forEach((event, i) => {
    const eventPath = `${path}[${i}]`;
    if (!validateObjectArtifact(event, eventPath, "shot event", violations))
      return;
    validateNonEmptyId(
      event.id,
      `${eventPath}.id`,
      "shot event id",
      violations,
    );
    if (typeof event.kind !== "string" || !EVENT_KINDS.has(event.kind))
      pushViolation(
        violations,
        "type",
        `${eventPath}.kind`,
        `shot event kind must be one of ${[...EVENT_KINDS].join(", ")}, but was "${String(event.kind)}"`,
        event.kind,
      );
    if (typeof event.source !== "string" || !EVENT_SOURCES.has(event.source))
      pushViolation(
        violations,
        "type",
        `${eventPath}.source`,
        `shot event source must be one of ${[...EVENT_SOURCES].join(", ")}, but was "${String(event.source)}"`,
        event.source,
      );
    // The shot-local clock: `playbackEvents` maps this onto the output timeline,
    // so a time outside the shot lands somewhere no entry plays. The upper bound
    // carries the SAME slack `performShot`'s landing gate allows (it refuses a
    // hit only past `duration + 1e-9`), or a launch that lands exactly on the
    // shot end would produce a shot this validator refuses: validator/engine
    // drift in the direction #1097 warned about.
    const time = event.time;
    if (
      typeof time !== "number" ||
      !Number.isFinite(time) ||
      time < 0 ||
      time > duration + EVENT_TIME_EPSILON
    )
      pushViolation(
        violations,
        "temporal",
        `${eventPath}.time`,
        `shot event time must be finite and within [0, ${duration}] (the shot), but was ${String(time)}`,
        time,
      );
    for (const field of ["actor", "target", "object", "reaction"] as const)
      if (event[field] !== null)
        validateNonEmptyId(
          event[field],
          `${eventPath}.${field}`,
          `shot event ${field}`,
          violations,
        );
    // A non-finite point makes `reviewVisualRead`'s contact distance NaN, and
    // `NaN > contactRadius` is false, so a genuine miss reads as a connect.
    if (event.point !== null)
      validateVectorArtifact(
        event.point,
        `${eventPath}.point`,
        "shot event point",
        violations,
      );
    if (event.actionIndex !== null && !Number.isInteger(event.actionIndex))
      pushViolation(
        violations,
        "range",
        `${eventPath}.actionIndex`,
        `shot event actionIndex must be null or an integer, but was ${String(event.actionIndex)}`,
        event.actionIndex,
      );
  });
};

const appendCameraIntentArtifact = (
  intents: unknown,
  path: string,
  duration: number,
  violations: IAutoMovieConstraintViolation[],
): void => {
  if (!validateArrayArtifact(intents, path, "camera intent spans", violations))
    return;
  intents.forEach((intent, i) => {
    const intentPath = `${path}[${i}]`;
    if (
      !validateObjectArtifact(intent, intentPath, "camera intent", violations)
    )
      return;
    validateRange(
      intent.start,
      `${intentPath}.start`,
      0,
      duration,
      "camera intent start",
      violations,
    );
    if (
      typeof intent.framing !== "string" ||
      !CAMERA_FRAMINGS.has(intent.framing)
    )
      pushViolation(
        violations,
        "type",
        `${intentPath}.framing`,
        `camera intent framing must be one of ${[...CAMERA_FRAMINGS].join(", ")}, but was "${String(intent.framing)}"`,
        intent.framing,
      );
    if (typeof intent.move !== "string" || !CAMERA_MOVES.has(intent.move))
      pushViolation(
        violations,
        "type",
        `${intentPath}.move`,
        `camera intent move must be one of ${[...CAMERA_MOVES].join(", ")}, but was "${String(intent.move)}"`,
        intent.move,
      );
    if (intent.focus !== null)
      validateVectorArtifact(
        intent.focus,
        `${intentPath}.focus`,
        "camera intent focus",
        violations,
      );
    // The input gate refuses a focal length <= 0 mm; the artifact must agree.
    if (intent.focalLength !== null)
      validateRange(
        intent.focalLength,
        `${intentPath}.focalLength`,
        0,
        Infinity,
        "camera intent focal length",
        violations,
        false,
      );
  });
};

const appendShotCoverageArtifact = (
  coverage: unknown,
  path: string,
  duration: number,
  heroCamera: unknown,
  sceneCameras: ReadonlySet<string> | null,
  violations: IAutoMovieConstraintViolation[],
): void => {
  if (!validateArrayArtifact(coverage, path, "shot coverage", violations))
    return;
  const seen = new Map<string, number>();
  coverage.forEach((take, i) => {
    const takePath = `${path}[${i}]`;
    if (!validateObjectArtifact(take, takePath, "coverage take", violations))
      return;
    validateNonEmptyId(
      take.camera,
      `${takePath}.camera`,
      "coverage camera",
      violations,
    );
    if (typeof take.camera === "string") {
      if (sceneCameras !== null && !sceneCameras.has(take.camera))
        pushViolation(
          violations,
          "type",
          `${takePath}.camera`,
          `coverage camera "${take.camera}" must reference a scene camera`,
          take.camera,
        );
      // The same rule the engine enforces when compiling the take: coverage
      // plays ANOTHER angle, so the hero camera can never also cover the beat,
      // and one camera never covers it twice.
      if (take.camera === heroCamera)
        pushViolation(
          violations,
          "type",
          `${takePath}.camera`,
          `coverage plays another angle of the beat, but "${take.camera}" is already this shot's live camera`,
          take.camera,
        );
      const first = seen.get(take.camera);
      if (first !== undefined)
        pushViolation(
          violations,
          "type",
          `${takePath}.camera`,
          `coverage camera "${take.camera}" is duplicated; first declared at ${path}[${first}].camera`,
          take.camera,
        );
      else seen.set(take.camera, i);
    }
    if (take.cameraMotion === undefined)
      pushViolation(
        violations,
        "type",
        `${takePath}.cameraMotion`,
        "coverage cameraMotion must be null or a clip",
        take.cameraMotion,
      );
    else if (take.cameraMotion !== null)
      validateClipArtifact(
        take.cameraMotion,
        `${takePath}.cameraMotion`,
        violations,
      );
    appendCameraIntentArtifact(
      take.cameraIntent,
      `${takePath}.cameraIntent`,
      duration,
      violations,
    );
  });
};
