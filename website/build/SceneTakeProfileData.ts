import { createHash } from "node:crypto";

/**
 * Verify every literal composition hash in the unchanged diagnostic's input
 * manifest, then return the single entry with the requested exact take label.
 * The returned record is owned by this host; measured inputs are never written.
 *
 * @param event The child's parsed full-manifest event.
 * @param take The exact authored label selected for CPU attribution.
 * @returns Its zero-based index, label and verified lowercase SHA-256.
 * @throws {Error} When a literal hash is damaged or the label is absent or ambiguous.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the JSON admission boundary, exact label, zero-based index, SHA encoding, failure effects and fresh host ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Recomputes SHA-256 over each parsed composition's JSON with Node crypto, using the same UTF-8 JSON boundary the unchanged diagnostic records before its real SDK call.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns only diagnostic record and manifest admission; process control, native Inspector sampling and evidence lifetime remain in profileSceneTakes.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Accepts scene and label data without a scene-specific result, SDK replacement or expected physical outcome. A hash mismatch rejects attribution instead of repairing the input.
 * @evidence contracts/development/implementation.md#efficient-algorithms Traverses each of N authored inputs once and serializes its B bytes once for hashing; time is O(N+B) and temporary memory is the largest serialized composition plus matching-entry records.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Verifies each current manifest independently; it stores no cross-run input or result cache and lends only the selected host-owned identity fields to current stdout admission.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Acquires no handle or task. Temporary JSON text, hash state and selection records are released with this call; the returned small record belongs to the measurement host.
 */
export function SceneTakeProfileData(
  event: Record<string, unknown>,
  take: string,
): SceneTakeProfileData.ISelected {
  if (!Array.isArray(event.inputs))
    throw new Error("Diagnostic input manifest is missing");
  const selected: SceneTakeProfileData.ISelected[] = [];
  for (const value of event.inputs) {
    const input: Record<string, unknown> | null =
      SceneTakeProfileData.record(value);
    const composition: Record<string, unknown> | null =
      SceneTakeProfileData.record(input?.composition);
    if (
      input === null ||
      composition === null ||
      typeof input.index !== "number" ||
      !Number.isInteger(input.index) ||
      input.index < 0 ||
      typeof input.label !== "string" ||
      typeof input.sha256 !== "string" ||
      createHash("sha256").update(JSON.stringify(composition)).digest("hex") !==
        input.sha256
    )
      throw new Error("Diagnostic input manifest has a damaged literal hash");
    if (input.label === take)
      selected.push({
        index: input.index,
        label: input.label,
        sha256: input.sha256,
      });
  }
  if (selected.length !== 1)
    throw new Error("Diagnostic manifest must name one exact take label");
  return selected[0]!;
}

/**
 * Input identities and independent measurement/SDK observations owned by one profile host.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents selected ordinal/text/SHA identity, null JSON admission, and independently initialized profile, SDK, timing and cleanup observations.
 * @evidence contracts/development/design.md#principled-representation Represents verified zero-based input identity and independent profile/SDK observations. Durations use microseconds, timestamp strings use ISO UTC, and absent observations remain null; JSON is narrowed at admission.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the current host's verified input identity, JSON boundaries and initially empty observation record; process and Inspector handles stay with their owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Keeps untrusted parsed JSON unknown until its shape and literal hash are checked; no body, scene, expected outcome or test-only field is encoded.
 */
export namespace SceneTakeProfileData {
  /** The exact selected authored entry, verified without changing the child. */
  export interface ISelected {
    /** Zero-based ordinal in the full authored input manifest. */
    index: number;

    /** Case-sensitive label the diagnostic was asked to execute. */
    label: string;

    /** Verified lowercase SHA-256 of this entry's UTF-8 composition JSON. */
    sha256: string;
  }

  /** Narrow JSON objects before reading protocol, profile or manifest fields. */
  export function record(value: unknown): Record<string, unknown> | null {
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  }

  /** Read JSON object lines only; the host still preserves every original stdout byte. */
  export function event(line: string): Record<string, unknown> | null {
    try {
      return record(JSON.parse(line));
    } catch {
      return null;
    }
  }

  /**
   * Independent measurement and SDK observations; cleanup cannot manufacture a
   * returned take. Timestamp fields are ISO UTC; null denotes an unobserved
   * event. Durations are V8 microseconds and process identity is recorded from
   * the owned ChildProcess, never inferred from a successful capture.
   */
  export interface IResult {
    profileCaptured: boolean;
    sdkOutcome:
      | "not-started"
      | "incomplete"
      | "track"
      | "refusal"
      | "error"
      | "thrown";
    sdkComplete: boolean;
    takeStartObservedAt: string | null;
    profilerStartRequestedAt: string | null;
    profilerStartAcknowledgedAt: string | null;
    profilerStopRequestedAt: string | null;
    stopReason: "window" | "sdk-ended" | null;
    profileDurationMicroseconds: number | null;
    sourceUnchangedAfterCapture: boolean | null;
    childPid: number | null;
    childClosed: boolean;
    childExitCode: number | null;
    childSignal: NodeJS.Signals | null;
    terminationRequested: boolean;
    error: string | null;
    cleanupErrors: string[];
  }

  /** Fresh empty observations for this measurement, without any shared retained result. */
  export function initial(): IResult {
    return {
      profileCaptured: false,
      sdkOutcome: "not-started",
      sdkComplete: false,
      takeStartObservedAt: null,
      profilerStartRequestedAt: null,
      profilerStartAcknowledgedAt: null,
      profilerStopRequestedAt: null,
      stopReason: null,
      profileDurationMicroseconds: null,
      sourceUnchangedAfterCapture: null,
      childPid: null,
      childClosed: false,
      childExitCode: null,
      childSignal: null,
      terminationRequested: false,
      error: null,
      cleanupErrors: [],
    };
  }
}
