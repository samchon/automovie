import type { IAutoMovieDeliveryContentAudit } from "@automovie/interface";

type Audit = IAutoMovieDeliveryContentAudit.IProps;
type Decoded = Extract<
  IAutoMovieDeliveryContentAudit.Stream,
  { status: "decoded" }
>;
type Detector = IAutoMovieDeliveryContentAudit.Detector;
type Finding = IAutoMovieDeliveryContentAudit.Finding;
type Media = IAutoMovieDeliveryContentAudit.Media;
type Outcome = IAutoMovieDeliveryContentAudit.Outcome;
type Ratio = IAutoMovieDeliveryContentAudit.Ratio;
type Timestamp = IAutoMovieDeliveryContentAudit.ITimestamp;
type Interval = { start: Timestamp; end: Timestamp };

const ZERO: Timestamp = { ticks: 0, timeBase: [1, 1] };
const MEDIA: readonly Media[] = ["video", "audio"];

/**
 * Checks the decoded presentation and classifies each black, frozen and silent
 * interval: inside an authored allowance it is intentional; where the encoder's
 * own input (the drawn frames or the padded soundtrack, measured the same way)
 * shows the same condition it was drawn; elsewhere encoding introduced it, or,
 * without complete reference evidence, it stays unclassified. Unexpected and
 * unclassified intervals always block; drawn ones block unless the production
 * waives authored approval. When the commission carries loudness targets, the
 * decoded audio's measured integrated loudness must lie within the tolerance of
 * the target and its true peak at or under the maximum; each miss blocks with
 * the measured value. The audit reads the decoded delivery, because lossy
 * encoding can raise true peak above the value before encoding. Findings retain
 * the effective thresholds and the source evidence needed to reproduce the
 * audit.
 *
 * @param props The hashed artifact, commissioned clock, decoded stream evidence
 *   and the reference measurement of the encoder's input.
 * @returns The coverage and content findings and whether they permit delivering
 *   the artifact.
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

  if (
    expected.loudness !== undefined &&
    (![
      expected.loudness.integratedLufs,
      expected.loudness.toleranceLu,
      expected.loudness.maximumTruePeakDbtp,
    ].every(Number.isFinite) ||
      expected.loudness.toleranceLu < 0)
  )
    throw new Error("Invalid delivery loudness targets");

  const [frames, seconds] = expected.frameRate;
  const filmEnd: Timestamp = {
    ticks: expected.frameCount,
    timeBase: [seconds, frames],
  };
  const allowances = mergeAllowances(expected.allowances ?? [], filmEnd);
  const strict = expected.contentRequired !== false;
  const findings: Finding[] = [];
  for (const media of MEDIA) {
    const stream = streams[media];
    const drawn = referenceWindows(media, props.reference?.[media], filmEnd);
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
    if (!coversFilm(media, stream, filmEnd)) {
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
      const minimum = thresholds[detector].minimumDuration;
      if (
        compare(start, usableEnd) >= 0 ||
        !durationAtLeast(start, usableEnd, minimum)
      )
        continue;

      for (const piece of classify(
        { start, end: usableEnd },
        allowances[detector],
        drawn?.[detector] ?? null,
      )) {
        if (
          piece.outcome !== "intentional" &&
          !durationAtLeast(piece.start, piece.end, minimum)
        )
          continue;
        findings.push({
          kind: "content",
          outcome: piece.outcome,
          blocking:
            piece.outcome === "drawn"
              ? strict
              : piece.outcome !== "intentional",
          media,
          streamIndex: stream.index,
          detector,
          start: piece.start,
          end: piece.end,
          ...(media === "video"
            ? { firstOutputFrame: outputFrame(piece.start, expected.frameRate) }
            : {}),
        });
      }
    }
    if (media === "audio" && expected.loudness !== undefined)
      findings.push(...loudnessFindings(stream, expected.loudness));
  }
  return {
    source,
    expected,
    thresholds,
    streams,
    ...(props.reference === undefined ? {} : { reference: props.reference }),
    findings,
    passed: findings.every((finding) => !finding.blocking),
  };
}

/**
 * Checks the decoded audio's measured loudness against the targets: integrated
 * loudness outside the tolerance blocks, and so does a true peak over the
 * maximum. A stream without a measurement, or whose blocks all fall under the
 * absolute gate, has no loudness to accept and blocks as a loudness finding.
 */
function loudnessFindings(
  stream: Decoded,
  targets: NonNullable<Audit["expected"]["loudness"]>,
): Finding[] {
  const findings: Finding[] = [];
  const measuredLufs: number | null = stream.loudness?.integratedLufs ?? null;
  if (
    measuredLufs === null ||
    Math.abs(measuredLufs - targets.integratedLufs) > targets.toleranceLu
  )
    findings.push({
      kind: "loudness",
      blocking: true,
      media: "audio",
      streamIndex: stream.index,
      measuredLufs,
      targetLufs: targets.integratedLufs,
      toleranceLu: targets.toleranceLu,
      reason:
        measuredLufs === null
          ? `The decoded audio has no integrated loudness to compare with the ${targets.integratedLufs} LUFS target`
          : `Integrated loudness ${measuredLufs.toFixed(2)} LUFS misses the ${targets.integratedLufs} LUFS target by ${Math.abs(measuredLufs - targets.integratedLufs).toFixed(2)} LU, beyond ${targets.toleranceLu} LU`,
    });
  const measuredDbtp: number | null = stream.loudness?.truePeakDbtp ?? null;
  if (measuredDbtp !== null && measuredDbtp > targets.maximumTruePeakDbtp)
    findings.push({
      kind: "true-peak",
      blocking: true,
      media: "audio",
      streamIndex: stream.index,
      measuredDbtp,
      maximumDbtp: targets.maximumTruePeakDbtp,
      reason: `True peak ${measuredDbtp.toFixed(2)} dBTP exceeds the ${targets.maximumTruePeakDbtp} dBTP maximum`,
    });
  return findings;
}

/**
 * Checks that decoded evidence starts at zero and continuously covers the
 * commissioned presentation.
 */
function coversFilm(
  media: Media,
  stream: Decoded,
  filmEnd: Timestamp,
): boolean {
  return (
    Number.isSafeInteger(stream.index) &&
    stream.index >= 0 &&
    validTimestamp(stream.start) &&
    validTimestamp(stream.end) &&
    stream.start.ticks === 0 &&
    stream.end.ticks > 0 &&
    stream.continuous &&
    matchesEnd(media, stream, filmEnd)
  );
}

/**
 * Indexes the drawn source's own detector intervals for one medium, clipped to
 * the film. Returns null when the reference does not completely cover the film,
 * so no interval can be attributed to it.
 */
function referenceWindows(
  media: Media,
  reference: IAutoMovieDeliveryContentAudit.Stream | undefined,
  filmEnd: Timestamp,
): Record<Detector, Interval[]> | null {
  if (reference?.status !== "decoded" || !coversFilm(media, reference, filmEnd))
    return null;
  const windows: IAutoMovieDeliveryContentAudit.IAllowance[] = [];
  for (const observation of reference.observations) {
    const end = observation.end ?? reference.end;
    if (
      (observation.detector === "silence") !== (media === "audio") ||
      !validTimestamp(observation.start) ||
      !validTimestamp(end) ||
      observation.start.ticks < 0 ||
      compare(observation.start, end) >= 0 ||
      compare(end, reference.end) > 0
    )
      return null;
    const clipped = compare(end, filmEnd) > 0 ? filmEnd : end;
    if (compare(observation.start, clipped) < 0)
      windows.push({
        detector: observation.detector,
        start: observation.start,
        end: clipped,
      });
  }
  return mergeAllowances(windows, filmEnd);
}

/**
 * Splits one measured interval at every allowance and reference boundary and
 * labels each piece: allowed pieces are intentional, the rest are drawn when
 * the reference shows the same condition, unexpected when the reference is
 * complete but clear, and unclassified without a complete reference. Adjacent
 * pieces with the same label are joined.
 */
function classify(
  measured: Interval,
  allowed: readonly Interval[],
  drawn: readonly Interval[] | null,
): { outcome: Outcome; start: Timestamp; end: Timestamp }[] {
  const cuts: Timestamp[] = [measured.start, measured.end];
  for (const window of [...allowed, ...(drawn ?? [])])
    for (const edge of [window.start, window.end])
      if (compare(edge, measured.start) > 0 && compare(edge, measured.end) < 0)
        cuts.push(edge);
  cuts.sort(compare);

  const pieces: { outcome: Outcome; start: Timestamp; end: Timestamp }[] = [];
  for (let index = 0; index + 1 < cuts.length; ++index) {
    const start = cuts[index]!;
    const end = cuts[index + 1]!;
    if (compare(start, end) >= 0) continue;
    const outcome: Outcome = contains(allowed, start)
      ? "intentional"
      : drawn === null
        ? "unclassified"
        : contains(drawn, start)
          ? "drawn"
          : "unexpected";
    const last = pieces.at(-1);
    if (last?.outcome === outcome) last.end = end;
    else pieces.push({ outcome, start, end });
  }
  return pieces;
}

/** Whether a sorted list of half-open windows contains an instant. */
function contains(windows: readonly Interval[], instant: Timestamp): boolean {
  return windows.some(
    (window) =>
      compare(window.start, instant) <= 0 && compare(instant, window.end) < 0,
  );
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
  stream: Decoded,
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
