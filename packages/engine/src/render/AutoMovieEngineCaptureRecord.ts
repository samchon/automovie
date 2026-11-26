import type {
  IAutoMovieCaptureCellRecord,
  IAutoMovieCaptureRecord,
  IAutoMovieCaptureTime,
  IAutoMovieInspectionDiagnostics,
} from "@automovie/interface";

/** Admit stored capture journals and expose the data each reader can use. */
export namespace AutoMovieEngineCaptureRecord {
  /** Check an in-folder filename without path steps or device prefixes. */
  export function isFileName(value: unknown): value is string {
    return typeof value === "string" && CAPTURE_FILE_NAME.test(value);
  }

  /** Read safe local names from a running or complete ownership journal. */
  export function ownedFiles(value: unknown): readonly string[] | null {
    const record: IRecord | null = readRecord(fieldsOf(value));
    const files: unknown = record?.fields.files;
    return Array.isArray(files) && files.every(isFileName) ? files : null;
  }

  /** Read a complete round with comparable cells and any recorded audit. */
  export function comparison(
    value: unknown,
  ): IAutoMovieCaptureRecord.IComparison | null {
    const record: IRecord | null = readRecord(fieldsOf(value));
    if (record?.type !== "complete") return null;
    const { rows, diagnostics, files }: IFields = record.fields;
    if (
      !Array.isArray(files) ||
      !files.every(isFileName) ||
      !Array.isArray(rows) ||
      !rows.every(isComparisonCell) ||
      (diagnostics !== undefined && !isAudit(diagnostics))
    )
      return null;
    return { rows, ...(diagnostics === undefined ? {} : { diagnostics }) };
  }

  /**
   * Read diagnostic evidence from a complete round. Older observations can omit
   * sheet layout and audit counters; they still need usable cell clocks,
   * coverage, findings, and still identities. Hash and scope verification are
   * the consumer's responsibility.
   */
  export function observe(
    value: unknown,
  ): IAutoMovieCaptureRecord.IObservation {
    const raw: IFields | null = fieldsOf(value);
    if (raw === null || (raw.type === undefined && raw.state === undefined))
      return { type: "unobserved", reason: "missing" };
    const record: IRecord | null = readRecord(raw);
    if (record?.type !== "complete")
      return { type: "unobserved", reason: "unfinished" };
    const { subject, rows, diagnostics, comparison }: IFields = record.fields;
    const name: unknown = fieldsOf(subject)?.name;
    if (
      typeof name !== "string" ||
      !Array.isArray(rows) ||
      !hasObservations(diagnostics)
    )
      return { type: "unobserved", reason: "malformed" };

    const admitted: IAutoMovieCaptureRecord.IObservationCell[] = [];
    for (const row of rows) {
      const cell: IAutoMovieCaptureRecord.IObservationCell | null =
        readCell(row);
      if (cell === null) return { type: "unobserved", reason: "malformed" };
      admitted.push(cell);
    }
    const unmatched: readonly IAutoMovieCaptureRecord.IUnmatchedError[] | null =
      readUnmatchedErrors(comparison);
    if (unmatched === null) return { type: "unobserved", reason: "malformed" };
    return {
      type: "observed",
      subject: name,
      rows: admitted,
      coverage: diagnostics.coverage,
      episodes: diagnostics.episodes,
      unmatched,
    };
  }
}

/** The plain name a capture can own below its output directory. */
const CAPTURE_FILE_NAME: RegExp = /^(?!\.{1,2}$)[^/\\:\0]+$/u;

/** A JSON object's fields before admission. */
type IFields = Readonly<Record<string, unknown>>;

/** The record state and fields shared by cleanup and evidence readers. */
interface IRecord {
  /** Normalized persisted state. */
  readonly type: "running" | "complete";
  /** The original JSON object. */
  readonly fields: IFields;
}

/** Read an object without treating an array or primitive as an envelope. */
function fieldsOf(value: unknown): IFields | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as IFields)
    : null;
}

/** Read the tagged envelope and reject contradictory old and new spellings. */
function readRecord(fields: IFields | null): IRecord | null {
  if (fields === null) return null;
  const type: unknown = fields.type === undefined ? fields.state : fields.type;
  return (type === "running" || type === "complete") &&
    (fields.state === undefined || fields.state === type)
    ? { type, fields }
    : null;
}

/** Check time on a finite subject clock, with an optional known grid index. */
function isCellTime(value: unknown): value is IAutoMovieCaptureTime {
  const fields: IFields | null = fieldsOf(value);
  return (
    fields !== null &&
    Number.isFinite(fields.seconds) &&
    (fields.frame === null || isCount(fields.frame))
  );
}

/** Check the address shared by recorded stills and failed cells. */
function hasCellAddress(
  row: IFields,
): row is IFields & IAutoMovieCaptureRecord.IObservedCellAddress {
  return (
    typeof row.view === "string" &&
    typeof row.pass === "string" &&
    isCellTime(row.time)
  );
}

/** A persisted still reference before it has been read or hashed. */
interface IStoredStill {
  /** The record's successful draw state. */
  readonly state: "drawn";
  /** A plain stored still name. */
  readonly file: string;
  /** The existing legacy pixel digest, when recorded. */
  readonly hash?: string;
  /** The existing encoded-file digest, when recorded. */
  readonly fileSha256?: string;
}

/** Check the persisted still fields that both readers trust. */
function isStill(row: IFields): row is IFields & IStoredStill {
  return (
    row.state === "drawn" &&
    isFileName(row.file) &&
    (row.hash === undefined || typeof row.hash === "string") &&
    (row.fileSha256 === undefined || typeof row.fileSha256 === "string")
  );
}

/** Admit the minimum draw outcome and address common to both readers. */
function readCell(
  value: unknown,
): IAutoMovieCaptureRecord.IObservationCell | null {
  const row: IFields | null = fieldsOf(value);
  if (row === null || !hasCellAddress(row)) return null;
  const { view, pass, time }: IAutoMovieCaptureRecord.IObservedCellAddress =
    row;
  if (row.state === "failed") return { type: "failed", view, pass, time };
  if (!isStill(row)) return null;
  return {
    type: "drawn",
    view,
    pass,
    time,
    file: row.file,
    ...(row.hash === undefined ? {} : { hash: row.hash }),
    ...(row.fileSha256 === undefined ? {} : { fileSha256: row.fileSha256 }),
  };
}

/** Check the full cell metadata retained for round comparison. */
function isComparisonCell(
  value: unknown,
): value is IAutoMovieCaptureCellRecord {
  const row: IFields | null = fieldsOf(value);
  if (row === null || !hasCellAddress(row)) return false;
  const selection: IFields | null = fieldsOf(row.selection);
  if (
    !isCount(row.index) ||
    !isFileName(row.name) ||
    !isFileName(row.sheet) ||
    !isCount(row.row) ||
    !isCount(row.column) ||
    !isNullableString(row.label) ||
    selection === null ||
    !isStrings(selection.parts) ||
    !(
      selection.kind === "whole" ||
      ((selection.kind === "alone" || selection.kind === "neighbours") &&
        typeof selection.unit === "string")
    )
  )
    return false;
  if (row.state === "failed") return typeof row.cause === "string";
  return (
    isStill(row) &&
    typeof row.hash === "string" &&
    isNullableString(row.backend) &&
    isNullableString(row.camera) &&
    isNullableString(row.repeat) &&
    (row.resolved === null ||
      (Array.isArray(row.resolved) && row.resolved.every(isResolution)))
  );
}

/** Read the fields retained for one resolved inspection pattern. */
function isResolution(value: unknown): boolean {
  const fields: IFields | null = fieldsOf(value);
  return (
    fields !== null &&
    (fields.role === "parts" ||
      fields.role === "hide" ||
      fields.role === "label" ||
      fields.role === "color" ||
      fields.role === "focus") &&
    typeof fields.pattern === "string" &&
    isStrings(fields.paths) &&
    isCount(fields.count)
  );
}

/** Check a nonnegative discrete index or count. */
function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

/** Check a string list without depending on an inferred JSON array type. */
function isStrings(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item: unknown): boolean => typeof item === "string")
  );
}

/** Admit one explicitly stated or unavailable optional identifier. */
function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

/** Read ordered episodes and coverage before either consumer accesses them. */
function hasObservations(
  value: unknown,
): value is IAutoMovieInspectionDiagnostics.IObservations {
  const fields: IFields | null = fieldsOf(value);
  return (
    fields !== null &&
    Array.isArray(fields.episodes) &&
    fields.episodes.every(isEpisode) &&
    Array.isArray(fields.coverage) &&
    fields.coverage.every(isCoverage)
  );
}

/** Check those audit summary fields a complete comparison retains. */
function isAudit(
  value: unknown,
): value is IAutoMovieInspectionDiagnostics.IAudit {
  const fields: IFields | null = fieldsOf(value);
  return (
    fields !== null &&
    hasObservations(fields) &&
    isCount(fields.observedOutputFrames) &&
    (fields.expectedOutputFrames === undefined ||
      isCount(fields.expectedOutputFrames)) &&
    typeof fields.hasBlockingFinding === "boolean" &&
    typeof fields.unresolvedRequiredCoverage === "boolean"
  );
}

/** Check a recorded film clock and any source-local address. */
function isTime(value: unknown): boolean {
  const fields: IFields | null = fieldsOf(value);
  if (
    fields === null ||
    !Number.isFinite(fields.filmSeconds) ||
    (fields.outputFrame !== undefined && !isCount(fields.outputFrame))
  )
    return false;
  if (fields.shot === undefined) return true;
  const shot: IFields | null = fieldsOf(fields.shot);
  return (
    shot !== null &&
    typeof shot.path === "string" &&
    Number.isFinite(shot.seconds)
  );
}

/** Check one finite, ordered witness or uncovered interval. */
function isInterval(
  value: unknown,
): value is IAutoMovieInspectionDiagnostics.IInterval {
  const fields: IFields | null = fieldsOf(value);
  return (
    fields !== null &&
    typeof fields.from === "number" &&
    typeof fields.to === "number" &&
    Number.isFinite(fields.from) &&
    Number.isFinite(fields.to) &&
    fields.from <= fields.to
  );
}

/** Check the finding payload read and carried by a round comparison. */
function isObservation(value: unknown): boolean {
  const fields: IFields | null = fieldsOf(value);
  const finding: IFields | null = fieldsOf(fields?.finding);
  const witness: IFields | null = fieldsOf(finding?.witness);
  return (
    isTime(fields?.time) &&
    finding !== null &&
    witness !== null &&
    typeof finding.check === "string" &&
    typeof finding.key === "string" &&
    typeof finding.code === "string" &&
    isStrings(finding.paths) &&
    (finding.category === "error" || finding.category === "warning") &&
    (finding.confidence === "candidate" ||
      finding.confidence === "confirmed") &&
    typeof finding.message === "string" &&
    (witness.time === undefined || isTime(witness.time)) &&
    (witness.rank === undefined || Number.isFinite(witness.rank)) &&
    (witness.interval === undefined || isInterval(witness.interval)) &&
    (witness.point === undefined || isPoint(witness.point)) &&
    (witness.measurements === undefined ||
      (Array.isArray(witness.measurements) &&
        witness.measurements.every(isMeasurement)))
  );
}

/** Check a witness point in world metres. */
function isPoint(value: unknown): boolean {
  const fields: IFields | null = fieldsOf(value);
  return (
    fields !== null &&
    Number.isFinite(fields.x) &&
    Number.isFinite(fields.y) &&
    Number.isFinite(fields.z)
  );
}

/** Check the native numeric or exact textual value of a witness measure. */
function isMeasurement(value: unknown): boolean {
  const fields: IFields | null = fieldsOf(value);
  return (
    fields !== null &&
    typeof fields.name === "string" &&
    typeof fields.unit === "string" &&
    (typeof fields.value === "string" || Number.isFinite(fields.value)) &&
    (fields.limit === undefined ||
      typeof fields.limit === "string" ||
      Number.isFinite(fields.limit))
  );
}

/** Check a finding episode's identity, sample count and observed witnesses. */
function isEpisode(value: unknown): boolean {
  const fields: IFields | null = fieldsOf(value);
  return (
    fields !== null &&
    typeof fields.scope === "string" &&
    isCount(fields.samples) &&
    fields.samples > 0 &&
    (fields.sampledShotClock === undefined ||
      typeof fields.sampledShotClock === "boolean") &&
    isObservation(fields.first) &&
    isObservation(fields.worst) &&
    isTime(fields.last)
  );
}

/** Check a coverage interval and the diagnostic outcome spanning it. */
function isCoverage(value: unknown): boolean {
  const fields: IFields | null = fieldsOf(value);
  const coverage: IFields | null = fieldsOf(fields?.coverage);
  return (
    fields !== null &&
    coverage !== null &&
    typeof fields.scope === "string" &&
    isTime(fields.first) &&
    isTime(fields.last) &&
    isCount(fields.samples) &&
    fields.samples > 0 &&
    (fields.sampledShotClock === undefined ||
      fields.sampledShotClock === true) &&
    typeof coverage.check === "string" &&
    typeof coverage.key === "string" &&
    typeof coverage.required === "boolean" &&
    (coverage.status === "checked" ||
      ((coverage.status === "deferred" ||
        coverage.status === "unsupported" ||
        coverage.status === "excluded") &&
        typeof coverage.reason === "string"))
  );
}

/**
 * Read unresolved compared errors, keeping unbounded historical entries
 * conservative.
 */
function readUnmatchedErrors(
  value: unknown,
): readonly IAutoMovieCaptureRecord.IUnmatchedError[] | null {
  if (value === undefined || value === null) return [];
  const comparison: IFields | null = fieldsOf(value);
  if (comparison === null) return null;
  const findings: IFields | null = fieldsOf(comparison.findings);
  if (comparison.findings === undefined || findings?.state === "omitted")
    return [];
  if (findings?.state !== "compared" || !Array.isArray(findings.entries))
    return null;
  const errors: IAutoMovieCaptureRecord.IUnmatchedError[] = [];
  for (const value of findings.entries) {
    const entry: IFields | null = fieldsOf(value);
    if (
      entry === null ||
      (entry.category !== "error" && entry.category !== "warning")
    )
      return null;
    if (entry.state !== "unmatched" || entry.category !== "error") continue;
    const { scope, check, key, uncovered }: IFields = entry;
    if (
      typeof scope !== "string" ||
      typeof check !== "string" ||
      typeof key !== "string"
    )
      return null;
    errors.push({
      scope,
      check,
      key,
      ...(Array.isArray(uncovered) && uncovered.every(isInterval)
        ? { uncovered }
        : {}),
    });
  }
  return errors;
}
