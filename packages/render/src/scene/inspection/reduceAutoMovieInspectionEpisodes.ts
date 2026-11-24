import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";

import { compareAutoMovieInspectionFindings } from "./compareAutoMovieInspectionFindings.js";

/** An episode while its end and worst witness can still advance. */
type IMutableEpisode = {
  -readonly [K in keyof IAutoMovieInspectionDiagnostics.IEpisode]: IAutoMovieInspectionDiagnostics.IEpisode[K];
};

/** A coverage range while its last observed clock can still advance. */
type IMutableCoverage = {
  -readonly [K in keyof IAutoMovieInspectionDiagnostics.ICoverageRange]: IAutoMovieInspectionDiagnostics.ICoverageRange[K];
};

/** The previous observation and open ranges for one continuity occurrence. */
interface IOpenScope {
  /** Last distinct sample seen for this occurrence. */
  packet: IAutoMovieInspectionDiagnostics;

  /** Episodes with checked coverage in that sample. */
  episodes: Map<string, IMutableEpisode>;

  /** Coverage ranges with an observation in that sample. */
  coverage: Map<string, IMutableCoverage>;
}

/**
 * Group ordered scene observations into episodes and coalesce their coverage.
 *
 * A repeat of the same scoped sample must carry the same serialized packet. It
 * counts once, even when several capture cells draw it. Only consecutive output
 * indices within one continuity occurrence can extend a range.
 *
 * @param packets Packets in nondecreasing film time for one inspection run. The
 *   producers supply every expected obligation within the visited samples.
 * @param expectedOutputFrames Size of the zero-based delivery frame schedule
 *   when the run must cover it. Sparse capture can omit it.
 * @returns The first and worst witnesses, observed coverage ranges and
 *   independent delivery gate facts.
 */
export function reduceAutoMovieInspectionEpisodes(
  packets: Iterable<IAutoMovieInspectionDiagnostics>,
  expectedOutputFrames?: number,
): IAutoMovieInspectionDiagnostics.IAudit {
  if (
    expectedOutputFrames !== undefined &&
    (!Number.isSafeInteger(expectedOutputFrames) || expectedOutputFrames < 1)
  )
    throw new Error(
      "Expected inspection output frames must be a positive integer.",
    );

  const episodes: IMutableEpisode[] = [];
  const coverage: IMutableCoverage[] = [];
  const scopes: Map<string, IOpenScope> = new Map();
  let filmSeconds: number = -Infinity;
  let previousOutputFrame: number = -1;
  let previousOutputSeconds: number = -Infinity;
  let observedOutputFrames: number = 0;
  for (const packet of packets) {
    const { time } = packet;
    if (
      !Number.isFinite(time.filmSeconds) ||
      time.filmSeconds < 0 ||
      time.filmSeconds < filmSeconds
    )
      throw new Error(
        "Inspection samples must be ordered by finite film seconds.",
      );
    filmSeconds = time.filmSeconds;

    const frame: number | undefined = time.outputFrame;
    if (frame !== undefined) {
      if (
        !Number.isSafeInteger(frame) ||
        frame < 0 ||
        (expectedOutputFrames !== undefined && frame >= expectedOutputFrames)
      )
        throw new Error(
          "Inspection output frame is outside the expected schedule.",
        );
      if (
        frame < previousOutputFrame ||
        (frame === previousOutputFrame &&
          time.filmSeconds !== previousOutputSeconds) ||
        (frame > previousOutputFrame &&
          time.filmSeconds === previousOutputSeconds)
      )
        throw new Error(
          "Inspection output indices must agree with the film clock.",
        );
      if (frame !== previousOutputFrame) {
        ++observedOutputFrames;
        previousOutputFrame = frame;
        previousOutputSeconds = time.filmSeconds;
      }
    }

    const previous: IOpenScope | undefined = scopes.get(packet.scope);
    const previousTime: IAutoMovieInspectionDiagnostics.ITime | undefined =
      previous?.packet.time;
    if (previousTime?.filmSeconds === time.filmSeconds) {
      if (
        previous!.packet !== packet &&
        JSON.stringify(previous!.packet) !== JSON.stringify(packet)
      )
        throw new Error("Repeated inspection sample has conflicting evidence.");
      continue;
    }

    const precedingFrame: number | undefined = previousTime?.outputFrame;

    const adjacent: IOpenScope | undefined =
      frame !== undefined &&
      precedingFrame !== undefined &&
      frame === precedingFrame + 1
        ? previous
        : undefined;
    const checked: Map<string, IMutableCoverage> = appendCoverage(
      packet,
      adjacent,
      coverage,
    );
    scopes.set(packet.scope, {
      packet,
      coverage: checked,
      episodes: appendEpisodes(packet, checked, adjacent, episodes),
    });
  }

  return {
    episodes,
    coverage,
    observedOutputFrames,
    ...(expectedOutputFrames === undefined ? {} : { expectedOutputFrames }),
    hasBlockingFinding: episodes.some(
      ({ worst }: IMutableEpisode): boolean =>
        worst.finding.confidence === "confirmed" &&
        worst.finding.category === "error",
    ),
    unresolvedRequiredCoverage:
      (expectedOutputFrames !== undefined &&
        observedOutputFrames !== expectedOutputFrames) ||
      coverage.some(
        ({ coverage: row }: IMutableCoverage): boolean =>
          row.required &&
          (row.status === "deferred" || row.status === "unsupported"),
      ),
  };
}

/** Extend matching coverage rows or start new ranges at the current sample. */
function appendCoverage(
  packet: IAutoMovieInspectionDiagnostics,
  adjacent: IOpenScope | undefined,
  output: IMutableCoverage[],
): Map<string, IMutableCoverage> {
  const current: Map<string, IMutableCoverage> = new Map();
  for (const row of packet.coverage) {
    const key: string = coverageKey(row);
    if (current.has(key))
      throw new Error(
        "Inspection sample has duplicate coverage for one obligation.",
      );

    const previous: IMutableCoverage | undefined = adjacent?.coverage.get(key);
    if (previous !== undefined && sameCoverage(previous.coverage, row)) {
      previous.last = packet.time;
      ++previous.samples;
      current.set(key, previous);
      continue;
    }

    const range: IMutableCoverage = {
      scope: packet.scope,
      first: packet.time,
      last: packet.time,
      samples: 1,
      coverage: row,
    };
    output.push(range);
    current.set(key, range);
  }
  return current;
}

/**
 * Extend witnessed episodes only if this and the preceding sample checked the
 * evidence.
 */
function appendEpisodes(
  packet: IAutoMovieInspectionDiagnostics,
  coverage: ReadonlyMap<string, IMutableCoverage>,
  adjacent: IOpenScope | undefined,
  output: IMutableEpisode[],
): Map<string, IMutableEpisode> {
  const current: Map<string, IMutableEpisode> = new Map();
  const found: Set<string> = new Set();
  for (const finding of packet.findings) {
    const key: string = JSON.stringify([
      finding.check,
      finding.key,
      finding.code,
      finding.paths,
    ]);
    if (found.has(key))
      throw new Error(
        "Inspection sample has duplicate evidence for one finding.",
      );
    found.add(key);
    if (
      finding.witness.rank !== undefined &&
      !Number.isFinite(finding.witness.rank)
    )
      throw new Error("Inspection witness rank must be finite.");

    const observation: IAutoMovieInspectionDiagnostics.IObservation = {
      time: finding.witness.time ?? packet.time,
      finding,
    };
    const checked: boolean =
      coverage.get(coverageKey(finding))?.coverage.status === "checked";
    const previous: IMutableEpisode | undefined = checked
      ? adjacent?.episodes.get(key)
      : undefined;
    if (previous !== undefined) {
      if (
        compareAutoMovieInspectionFindings(finding, previous.worst.finding) > 0
      )
        previous.worst = observation;
      previous.last = packet.time;
      ++previous.samples;
      current.set(key, previous);
      continue;
    }

    const episode: IMutableEpisode = {
      scope: packet.scope,
      first: observation,
      worst: observation,
      last: packet.time,
      samples: 1,
    };
    output.push(episode);
    if (checked) current.set(key, episode);
  }
  return current;
}

/** Encode the two owned identity fields without delimiter ambiguity. */
function coverageKey(
  row: Pick<IAutoMovieInspectionDiagnostics.ICoverage, "check" | "key">,
): string {
  return JSON.stringify([row.check, row.key]);
}

/** Test whether one obligation has the same outcome and policy at both samples. */
function sameCoverage(
  previous: IAutoMovieInspectionDiagnostics.ICoverage,
  current: IAutoMovieInspectionDiagnostics.ICoverage,
): boolean {
  if (
    previous.required !== current.required ||
    previous.status !== current.status
  )
    return false;
  if (previous.status === "checked" || current.status === "checked")
    return true;
  return previous.reason === current.reason;
}
