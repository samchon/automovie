import type { IAutoMovieDeliveryContentAudit } from "@automovie/interface";

type Audit = IAutoMovieDeliveryContentAudit.IProps;
type Detector = IAutoMovieDeliveryContentAudit.Detector;
type Finding = IAutoMovieDeliveryContentAudit.Finding;
type Media = IAutoMovieDeliveryContentAudit.Media;
type Ratio = IAutoMovieDeliveryContentAudit.Ratio;
type Timestamp = IAutoMovieDeliveryContentAudit.ITimestamp;
type Interval = { start: Timestamp; end: Timestamp };

const ZERO: Timestamp = { ticks: 0, timeBase: [1, 1] };
const MEDIA: readonly Media[] = ["video", "audio"];

/**
 * Checks the decoded presentation and reconciles black, frozen and silent
 * intervals against explicitly authored allowances. Findings retain the
 * effective thresholds and the source evidence needed to reproduce the audit.
 *
 * @param props The hashed artifact, commissioned clock and complete decoded stream evidence.
 * @returns The coverage and content findings and whether they permit delivering the artifact.
 * @evidence contracts/development/common.md#meaningful-documentation Specifies the decoded evidence consumed, the authored allowance comparison and the delivery decision returned.
 * @evidence contracts/development/implementation.md#principled-implementation Compares signed native timestamps by exact integer cross products. Requires a contiguous video grid at the commissioned duration and permits only floor or ceiling sample quantization for decoded audio. An open detector interval can use an end only after that stream passes timing validation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Validates the commissioned policy, independently audits video and audio, and partitions each measured interval against the applicable merged allowance windows.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses typed stream and finding discriminants and guards safe integer inputs before BigInt conversion. A report retains incomplete or invalid decoder evidence as findings.
 * @evidence contracts/development/implementation.md#efficient-algorithms Sorts authored windows once per detector and merges overlaps. Each observation scans only the windows for its detector until its end. The audit reads no pixels or samples.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each artifact is audited independently. Inside a call the sorted and merged allowances are shared across its observations.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The pure audit acquires no handles and retains no state between calls. The report retains its supplied evidence and findings.
 */
export function auditAutoMovieDeliveryContent(
  props: Audit,
): IAutoMovieDeliveryContentAudit.IResult {
  const { source, expected, thresholds, streams } = props;
  if (
    source.file.length === 0 ||
    !/^[a-f0-9]{64}$/iu.test(source.sha256) ||
    !Number.isSafeInteger(expected.frameCount) ||
    expected.frameCount < 1 ||
    !validRatio(expected.frameRate)
  )
    throw new Error("Invalid delivery artifact identity or commissioned clock");

  for (const threshold of [
    thresholds.black.minimumDuration,
    thresholds.frozen.minimumDuration,
    thresholds.silence.minimumDuration,
  ])
    if (!validTimestamp(threshold) || threshold.ticks < 0)
      throw new Error("Invalid delivery detector duration");

  for (const threshold of [
    thresholds.black.minimumPictureRatio,
    thresholds.black.maximumPixelThreshold,
    thresholds.frozen.maximumMeanDifference,
    thresholds.silence.maximumAmplitude,
  ])
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1)
      throw new Error("Invalid delivery detector threshold");

  const [frames, seconds] = expected.frameRate;
  const filmEnd: Timestamp = {
    ticks: expected.frameCount,
    timeBase: [seconds, frames],
  };
  const allowances = mergeAllowances(expected.allowances ?? [], filmEnd);
  const findings: Finding[] = [];
  for (const media of MEDIA) {
    const stream = streams[media];
    const required = media === "video" || expected.audioRequired;
    if (stream.status === "missing") {
      if (required)
        findings.push({
          kind: "missing-stream",
          blocking: true,
          media,
          reason: "The commissioned stream is absent",
        });
      continue;
    }
    if (stream.status === "uncovered") {
      findings.push({
        kind: "uncovered",
        blocking: required,
        media,
        reason: stream.reason,
      });
      continue;
    }
    if (
      !Number.isSafeInteger(stream.index) ||
      stream.index < 0 ||
      !validTimestamp(stream.start) ||
      !validTimestamp(stream.end) ||
      stream.start.ticks !== 0 ||
      stream.end.ticks <= 0 ||
      !stream.continuous ||
      !matchesEnd(media, stream, filmEnd)
    ) {
      findings.push({
        kind: "timing-mismatch",
        blocking: true,
        media,
        streamIndex: stream.index,
        reason:
          "The decoded stream does not cover the commissioned presentation",
      });
      continue;
    }

    for (const observation of stream.observations) {
      const { detector, start } = observation;
      const end = observation.end ?? stream.end;
      if (
        (detector === "silence") !== (media === "audio") ||
        !validTimestamp(start) ||
        !validTimestamp(end) ||
        start.ticks < 0 ||
        compare(start, end) >= 0 ||
        compare(end, stream.end) > 0
      ) {
        findings.push({
          kind: "invalid-observation",
          blocking: true,
          media,
          streamIndex: stream.index,
          reason: "The detector interval does not belong to the decoded stream",
        });
        continue;
      }
      const usableEnd = compare(end, filmEnd) > 0 ? filmEnd : end;
      if (
        compare(start, usableEnd) >= 0 ||
        !durationAtLeast(start, usableEnd, thresholds[detector].minimumDuration)
      )
        continue;

      const emit = (
        outcome: "intentional" | "unexpected" | "unclassified",
        from: Timestamp,
        to: Timestamp,
      ): void => {
        findings.push({
          kind: "content",
          outcome,
          blocking: outcome === "unexpected",
          media,
          streamIndex: stream.index,
          detector,
          start: from,
          end: to,
          ...(media === "video"
            ? { firstOutputFrame: outputFrame(from, expected.frameRate) }
            : {}),
        });
      };
      if (expected.contentRequired === false) {
        emit("unclassified", start, usableEnd);
        continue;
      }

      let cursor = start;
      for (const allowed of allowances[detector]) {
        if (compare(allowed.end, cursor) <= 0) continue;
        if (compare(allowed.start, usableEnd) >= 0) break;
        if (compare(cursor, allowed.start) < 0) {
          emit("unexpected", cursor, allowed.start);
          cursor = allowed.start;
        }
        const coveredEnd =
          compare(allowed.end, usableEnd) < 0 ? allowed.end : usableEnd;
        emit("intentional", cursor, coveredEnd);
        cursor = coveredEnd;
        if (compare(cursor, usableEnd) === 0) break;
      }
      if (compare(cursor, usableEnd) < 0) emit("unexpected", cursor, usableEnd);
    }
  }
  return {
    source,
    expected,
    thresholds,
    streams,
    findings,
    passed: findings.every((finding) => !finding.blocking),
  };
}

/** Checks the positive integer components of a native clock. */
function validRatio(ratio: Ratio): boolean {
  return ratio.every((value) => Number.isSafeInteger(value) && value > 0);
}

/** Guards exact conversion of a timestamp into a rational number. */
function validTimestamp({ ticks, timeBase }: Timestamp): boolean {
  return Number.isSafeInteger(ticks) && validRatio(timeBase);
}

/** Returns the numerator of a timestamp expressed in seconds. */
function numerator({ ticks, timeBase }: Timestamp): bigint {
  return BigInt(ticks) * BigInt(timeBase[0]);
}

/** Returns the denominator of a timestamp expressed in seconds. */
function denominator({ timeBase }: Timestamp): bigint {
  return BigInt(timeBase[1]);
}

/** Orders two timestamps without rounding either clock. */
function compare(left: Timestamp, right: Timestamp): number {
  const delta =
    numerator(left) * denominator(right) - numerator(right) * denominator(left);
  return delta < 0n ? -1 : delta > 0n ? 1 : 0;
}

/** Checks an interval against a duration without rounding its boundaries. */
function durationAtLeast(
  start: Timestamp,
  end: Timestamp,
  minimum: Timestamp,
): boolean {
  const duration =
    numerator(end) * denominator(start) - numerator(start) * denominator(end);
  return (
    duration * denominator(minimum) >=
    numerator(minimum) * denominator(start) * denominator(end)
  );
}

/** Checks the native video endpoint or the two nearest audio sample boundaries. */
function matchesEnd(
  media: Media,
  stream: Extract<Audit["streams"][Media], { status: "decoded" }>,
  filmEnd: Timestamp,
): boolean {
  if (media === "video") return compare(stream.end, filmEnd) === 0;
  const { sampleRate } = stream;
  if (
    sampleRate === undefined ||
    !Number.isSafeInteger(sampleRate) ||
    sampleRate < 1
  )
    return false;
  const rate = BigInt(sampleRate);
  const actual = numerator(stream.end) * rate;
  const actualDenominator = denominator(stream.end);
  if (actual % actualDenominator !== 0n) return false;
  const samples = actual / actualDenominator;
  const expected = numerator(filmEnd) * rate;
  const expectedDenominator = denominator(filmEnd);
  const floor = expected / expectedDenominator;
  return (
    samples === floor ||
    (expected % expectedDenominator !== 0n && samples === floor + 1n)
  );
}

/** Locates the authored delivery frame containing a measured video boundary. */
function outputFrame(timestamp: Timestamp, [frames, seconds]: Ratio): number {
  return Number(
    (numerator(timestamp) * BigInt(frames)) /
      (denominator(timestamp) * BigInt(seconds)),
  );
}

/** Indexes authored half-open windows and joins overlapping or adjoining ranges. */
function mergeAllowances(
  authored: readonly IAutoMovieDeliveryContentAudit.IAllowance[],
  filmEnd: Timestamp,
): Record<Detector, Interval[]> {
  const indexed: Record<Detector, Interval[]> = {
    black: [],
    frozen: [],
    silence: [],
  };
  for (const { detector, start, end } of authored) {
    if (
      !validTimestamp(start) ||
      !validTimestamp(end) ||
      compare(start, ZERO) < 0 ||
      compare(start, end) >= 0 ||
      compare(end, filmEnd) > 0
    )
      throw new Error(
        "A delivery allowance lies outside the commissioned film",
      );
    indexed[detector].push({ start, end });
  }
  const detectors: readonly Detector[] = ["black", "frozen", "silence"];
  for (const detector of detectors) {
    const merged: Interval[] = [];
    for (const next of indexed[detector].sort((left, right) =>
      compare(left.start, right.start),
    )) {
      const last = merged.at(-1);
      if (last === undefined || compare(next.start, last.end) > 0)
        merged.push(next);
      else if (compare(next.end, last.end) > 0) last.end = next.end;
    }
    indexed[detector] = merged;
  }
  return indexed;
}
