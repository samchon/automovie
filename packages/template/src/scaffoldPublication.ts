import * as path from "node:path";

/**
 * One validated file of an immutable scaffold publication candidate.
 *
 * {@link planScaffoldPublication} builds and freezes every entry before any
 * directory or file is touched, so the bytes and target a publisher receives
 * are the ones that passed validation. `readonly` is compile-time only; the
 * runtime immutability comes from those producers freezing the entry and its
 * byte array.
 *
 * @evidence contracts/common.md#principled-implementation The bytes are a frozen `number[]` of the UTF-8 encoding because a typed array cannot be frozen, and `target` is the `path.resolve` result whose lexical containment the planner proves; physical containment against links is proved later by the directory capture in `scaffoldFileSnapshot`.
 * @evidence contracts/common.md#clear-and-simple-design Each field has one reader: `bytes` feeds the adapter's write and readback, `relative` names the entry in errors and receipts, and `target` selects the parent directory and child name.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record carries no special case; the documentation states that freezing is done by the planner and `publishScaffoldCandidate`, not guaranteed by the `readonly` modifiers themselves.
 * @evidence contracts/common.md#meaningful-documentation The comment says who freezes the entry and when, the bytes' encoding, the relative path's diagnostic role, and that the target's containment is lexical at this stage.
 * @evidence contracts/performance.md#efficient-algorithms The byte array spends one array element per byte instead of one byte, a linear memory cost in file size that buys freezability; it is paid once by the planner per file.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A file entry is plain data and coordinates no work; reuse of whole frozen entries is decided by `publishScaffoldCandidate`.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources An entry holds no handle or task; its bytes live as long as the candidate array that the caller of the planner keeps.
 * @author Samchon
 */
export interface IScaffoldPublicationEntry {
  /** UTF-8 bytes of the file content, fixed before any mutation begins. */
  bytes: readonly number[];

  /** Map key exactly as authored, used in error messages and receipts. */
  relative: string;

  /**
   * Absolute target that lexically stays below the candidate root; links are
   * checked only when its parent directory is captured.
   */
  target: string;
}

/**
 * A file that was written, read back, and verified in the captured parent.
 *
 * @evidence contracts/common.md#principled-implementation Completion is reported only after the adapter's descriptor write, sync, readback, and parent-identity checks, so the outcome is a fact observed through the held handle rather than a pathname assumption.
 * @evidence contracts/common.md#clear-and-simple-design The variant carries only what the receipt needs, the parent generation, plus the descriptor identity that both in-package producers observe.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `fileIdentity` is set by both producers but `publishScaffoldCandidate` does not copy it into the receipt and nothing reads it, a dead diagnostic field whose removal touches the producers in `nativeScaffoldPublication` and `scaffoldFileSnapshot`.
 * @evidence contracts/common.md#meaningful-documentation The comment states the verification behind completion, that the parent identity is the captured generation the receipt keeps, and that the file identity is not retained by the receipt.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This completed variant is a three-field record with no algorithm; the verification cost belongs to the adapter that produces it.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A completion record shares nothing across requests; each one describes exactly one file write.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record holds two identity strings and no descriptor, because the adapter closes the file before reporting completion.
 * @author Samchon
 */
export interface IScaffoldCompletedFilePublicationOutcome {
  /**
   * `device:inode` identity read from the descriptor that wrote the file.
   * Diagnostic only: the candidate receipt does not retain it.
   */
  fileIdentity?: string;

  /**
   * Identity of the captured parent directory generation the file was created
   * in; must be non-empty.
   */
  parentIdentity: string;

  /** Discriminator: the file is complete. */
  status: "completed";
}

/**
 * A failure known to have left no file at the target.
 *
 * @evidence contracts/common.md#principled-implementation The three reasons are the adapter's pre-create decisions, so a refusal is a positive claim that the exclusive create never produced a slot, which is what lets the receipt call a first-entry refusal a zero-effect result.
 * @evidence contracts/common.md#clear-and-simple-design One variant with a closed reason union covers every no-slot failure; the reason distinguishes a moved parent and an occupied name from any other pre-create failure.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `publishFiles` maps every exception it catches to `create-failed`, which holds because `writeScaffoldFile` throws only before any write and `publishNativeScaffoldFile` reports its failures instead of throwing.
 * @evidence contracts/common.md#meaningful-documentation The comment states that a refusal guarantees no slot, what each reason means, and that `error` is the original cause.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The refusal variant only names a reason and its cause; it runs nothing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No refused outcome is shared; the receipt keeps the single one that stopped the candidate.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources It retains only the cause object, whose lifetime follows the receipt that holds it.
 * @author Samchon
 */
export interface IScaffoldRefusedFilePublicationOutcome {
  /** Original native or validation error, kept for the caller. */
  error: unknown;

  /**
   * Why nothing was created: `parent-changed` when the held parent no longer
   * matched its captured identity, `target-competitor` when the name was
   * already occupied, and `create-failed` for any other failure before the
   * slot existed.
   */
  reason: "create-failed" | "parent-changed" | "target-competitor";

  /** Discriminator: no file slot was created. */
  status: "refused";
}

/**
 * A file slot that exists in the captured parent but is not complete.
 *
 * The publisher never deletes it, because a deletion through a pathname could
 * reach a different file than the one it created.
 *
 * @evidence contracts/common.md#principled-implementation Once the exclusive create returned a descriptor, the slot exists, so any later failure is reported with the bound parent and the byte count the write loop confirmed instead of being collapsed into a refusal.
 * @evidence contracts/common.md#clear-and-simple-design A separate variant keeps the one case that leaves residue apart from the zero-effect refusal, so callers can tell which failures need manual recovery.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No cleanup or retry hides the partial slot; the documentation states that deletion is deliberately left to the caller.
 * @evidence contracts/common.md#meaningful-documentation The comment states that the slot exists, why it is not deleted, the byte count's meaning and bound, and which parent generation contains it.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The partial variant reports a count and an identity and computes neither.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A partial slot is the effect of one write; there is no equivalent work to share with another.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The descriptor that produced the partial slot is closed by the adapter before this record exists; the record holds only the cause and two scalars.
 * @author Samchon
 */
export interface IScaffoldPartialFilePublicationOutcome {
  /**
   * Bytes confirmed written to the slot, from 0 to the entry's byte length.
   */
  bytesWritten: number;

  /** Original native or validation error, kept for the caller. */
  error: unknown;

  /** Identity of the captured parent directory containing the partial slot. */
  parentIdentity: string;

  /** Discriminator: a slot exists with incomplete or unverified content. */
  status: "partial";
}

/**
 * Outcome a one-file publisher reports for one candidate entry.
 *
 * The publisher returns rather than throws because a thrown I/O error cannot
 * say whether a file slot already exists. `refused` means none exists,
 * `partial` names the parent and byte count of one that does, and `completed`
 * means the file was verified.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union on `status` encodes the three distinguishable effects of an exclusive create, so the caller's narrowing follows the effect instead of parsing error messages.
 * @evidence contracts/common.md#clear-and-simple-design The union is the one seam between the candidate loop and any adapter; validation of each variant against the contract stays with `publishScaffoldCandidate`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The union is the whole adapter contract and carries no fallback state; an adapter that returns something outside it is refused by `publishScaffoldCandidate` rather than coerced into a variant.
 * @evidence contracts/common.md#meaningful-documentation The comment states why adapters report instead of throwing and what each status says about the file slot.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This alias only names three record shapes for narrowing and executes nothing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The union describes one entry's effect; whether results repeat is not a question a status alias can answer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No variant of the union holds a handle; resource release is the adapter's duty before it returns.
 * @author Samchon
 */
export type ScaffoldFilePublicationOutcome =
  | IScaffoldCompletedFilePublicationOutcome
  | IScaffoldRefusedFilePublicationOutcome
  | IScaffoldPartialFilePublicationOutcome;

/**
 * One completed entry and the parent directory generation that received it.
 *
 * @evidence contracts/common.md#principled-implementation Pairing the frozen entry with the parent identity the adapter proved lets a caller locate exactly which directory generation holds each file, which a pathname alone cannot show after a concurrent rename.
 * @evidence contracts/common.md#clear-and-simple-design The pair keeps the planned entry by reference instead of duplicating its fields, so the receipt has one description of each file.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The pair is built only from a `completed` outcome whose parent identity is non-empty, which `publishScaffoldCandidate` checks before recording it.
 * @evidence contracts/common.md#meaningful-documentation The comment and fields state that the entry passed final readback and that the identity is the captured parent generation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A completed pair is two references and performs no traversal or allocation of its own.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The pair shares the planned entry object with `planned` instead of copying it, which is a reference, not reused work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources It owns nothing beyond the receipt's lifetime and holds no descriptor or task.
 * @author Samchon
 */
export interface IScaffoldCompletedPublication {
  /** Planned entry whose bytes passed final readback. */
  entry: IScaffoldPublicationEntry;

  /** Identity of the captured parent directory containing the file. */
  parentIdentity: string;
}

/**
 * The entry where publication stopped and its non-completed outcome.
 *
 * @evidence contracts/common.md#principled-implementation Publication is sequential and stops at the first non-completed outcome, so one failure record fully describes the stop and every later entry is known untouched.
 * @evidence contracts/common.md#clear-and-simple-design The outcome type excludes `completed` through `Exclude`, so the failure cannot claim success and no separate failure union is maintained.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record keeps the adapter's outcome as reported after validation, without reclassifying a partial slot as a refusal.
 * @evidence contracts/common.md#meaningful-documentation The comment states that this is the stopping entry and that its outcome is either zero-effect or a bound partial slot.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The failure record is two references with no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Only one failure can exist per receipt, so there is nothing equivalent to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record retains the outcome's error object for as long as the caller keeps the receipt, and nothing else.
 * @author Samchon
 */
export interface IScaffoldPublicationFailure {
  /** Planned entry where publication stopped. */
  entry: IScaffoldPublicationEntry;

  /** Refusal (nothing created) or partial slot observed at that entry. */
  outcome: Exclude<ScaffoldFilePublicationOutcome, { status: "completed" }>;
}

/**
 * Everything observed while publishing one candidate.
 *
 * Entries are published in candidate order and publication stops at the first
 * entry that does not complete, so `completed` is a prefix of `planned` and
 * every entry after `failure` was not attempted.
 *
 * @evidence contracts/common.md#principled-implementation The receipt is a prefix description of a sequential, stop-at-first-failure loop, so `completed`, `failure`, and `planned` together determine every file's state without a per-entry status list.
 * @evidence contracts/common.md#clear-and-simple-design The candidate-wide `status` is derived from the other fields by `publishScaffoldCandidate`, and the throwing form in `writeFiles` and the CLI both decide success from that one field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `refused` is reported only when the first entry was refused, because any completed file or partial slot means the directory changed; the receipt never rounds a partial effect down.
 * @evidence contracts/common.md#meaningful-documentation The comment states the ordering, the prefix property, what is untouched after the failure, and how each candidate-wide status is derived.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The receipt is the result record; the loop that fills it is answered on `publishScaffoldCandidate`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A receipt documents a single attempt and is never shared between attempts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The receipt retains the whole planned candidate, including every file's bytes, for as long as the caller keeps it; that is bounded by the candidate size and holds no descriptor.
 * @author Samchon
 */
export interface IScaffoldPublicationReceipt {
  /** Entries completed before publication stopped, in candidate order. */
  completed: readonly IScaffoldCompletedPublication[];

  /** Entry where publication stopped, or `null` when every entry completed. */
  failure: IScaffoldPublicationFailure | null;

  /** The whole candidate in publication order, attempted or not. */
  planned: readonly IScaffoldPublicationEntry[];

  /**
   * `completed` when every entry completed, `refused` when the first entry was
   * refused so nothing was created, and `partial` otherwise.
   */
  status: "completed" | "partial" | "refused";
}

/**
 * Validate a rendered file map and freeze it as a publication candidate,
 * before any directory or file is touched.
 *
 * Throws when a value is not a string, a key contains NUL, a target resolves
 * to the root or outside it, or two targets collide. Targets are compared
 * after lower-casing, so `A.txt` and `a.txt` collide on every platform, and a
 * file also collides with any file below it, such as `a` and `a/b`.
 * Lower-casing approximates the case folding of Windows and macOS file systems
 * and does not apply Unicode normalization.
 *
 * @param props.files Map from root-relative path to UTF-8 text.
 * @param props.root Directory the candidate is published under.
 * @returns Frozen entries in the map's insertion order.
 *
 * @evidence contracts/common.md#principled-implementation Containment uses `path.resolve` and `path.relative`, refusing an empty, `..`, `..` plus separator, or absolute remainder; collisions are found with a hash map of lower-cased targets, one lookup for an exact repeat and one per ancestor directory for a file below another file. Lower-casing is the stated approximation of case-insensitive file systems and ignores Unicode normalization.
 * @evidence contracts/common.md#clear-and-simple-design The function only validates and encodes; the collision scan is one private helper, and directory creation and link checks stay with `publishFiles` and `scaffoldFileSnapshot`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No path or file name is special-cased; case-only collisions are refused on every platform so that one rendered map is publishable on any host, and the runtime string check exists for untyped JavaScript callers rather than for a test.
 * @evidence contracts/common.md#meaningful-documentation The comment lists every refusal, the case-folding rule and its limits, the parameters' meaning, and that entries keep insertion order.
 * @evidence contracts/performance.md#efficient-algorithms Time is the total content bytes for encoding plus one hash lookup per file and per ancestor directory below the root, linear in files times depth; this replaces a pairwise scan over the sorted entries that was quadratic in file count.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The planner runs once per call over its own input and has no completed or in-flight work from another caller that could stand in for it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned candidate retains each file's bytes as a frozen array owned by the caller; the collision map is local and released on return, and no handle is opened.
 * @author Samchon
 */
export const planScaffoldPublication = (props: {
  files: Readonly<Record<string, string>>;
  root: string;
}): readonly IScaffoldPublicationEntry[] => {
  const root: string = path.resolve(props.root);
  const entries: IScaffoldPublicationEntry[] = Object.entries(props.files).map(
    ([relative, content]: [string, string]): IScaffoldPublicationEntry => {
      if (typeof content !== "string")
        throw new Error(`scaffold content is not text: ${relative}`);
      if (relative.includes("\0"))
        throw new Error(`refusing invalid scaffold path: ${relative}`);
      const target: string = path.resolve(root, relative);
      const inside: string = path.relative(root, target);
      if (
        inside.length === 0 ||
        inside === ".." ||
        inside.startsWith(`..${path.sep}`) ||
        path.isAbsolute(inside)
      )
        throw new Error(`refusing to write outside "${root}": ${relative}`);
      return Object.freeze({
        bytes: Object.freeze(Array.from(Buffer.from(content, "utf8"))),
        relative,
        target,
      });
    },
  );
  assertDistinctScaffoldTargets(root, entries);
  return Object.freeze(entries);
};

/**
 * Publish a candidate in order through a one-file publisher and report the
 * exact effect.
 *
 * Stops at the first entry whose outcome is not `completed`. Throws instead of
 * returning a receipt when the publisher reports an outcome that breaks its
 * contract: a completed or partial result without a parent identity, an
 * unknown refusal reason, a byte count outside the entry, or an unknown
 * status. A frozen entry with a frozen byte array is used as is; any other
 * entry is copied and frozen first, so the publisher and the receipt see the
 * same immutable data.
 *
 * @param props.candidate Entries to publish, normally from
 *   {@link planScaffoldPublication}.
 * @param props.publish Publishes one entry and reports its outcome; must not
 *   throw.
 * @returns Frozen receipt describing the completed prefix and any failure.
 *
 * @evidence contracts/common.md#principled-implementation A sequential loop that stops at the first non-completed outcome makes the completed set a prefix of the candidate, so the receipt is exact without probing the file system afterwards; adapter outcomes are validated against the union's invariants before they enter the receipt.
 * @evidence contracts/common.md#clear-and-simple-design The function owns ordering, outcome validation, and status derivation, and takes the file system work as the `publish` callback so `publishFiles` owns directories and descriptors.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An outcome outside the contract, including an unknown status that was previously recorded as a partial failure, now throws instead of being coerced; no entry or adapter is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The comment states the stop rule, every contract violation that throws, the freezing and reuse rule for entries, the parameters' duties, and the returned receipt.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the candidate calls the publisher once per entry; a frozen entry with frozen bytes is reused instead of copying its bytes, so the planner's output adds no per-byte work here.
 * @evidence contracts/performance.md#reuse-equivalent-work A frozen entry is shared with the receipt because neither its fields nor its frozen byte array can change; equivalence is that immutability, not a matching path, and every publish call still runs since each write is an effect.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The function holds no descriptor; it retains the planned entries and one completed record per finished file in the returned receipt, bounded by the candidate length, and releases nothing because the caller owns the receipt.
 * @author Samchon
 */
export const publishScaffoldCandidate = (props: {
  candidate: readonly IScaffoldPublicationEntry[];
  publish: (entry: IScaffoldPublicationEntry) => ScaffoldFilePublicationOutcome;
}): IScaffoldPublicationReceipt => {
  const planned: readonly IScaffoldPublicationEntry[] = Object.freeze(
    props.candidate.map(
      (entry: IScaffoldPublicationEntry): IScaffoldPublicationEntry =>
        Object.isFrozen(entry) && Object.isFrozen(entry.bytes)
          ? entry
          : Object.freeze({
              bytes: Object.freeze([...entry.bytes]),
              relative: entry.relative,
              target: entry.target,
            }),
    ),
  );
  const completed: IScaffoldCompletedPublication[] = [];
  for (const entry of planned) {
    const outcome: ScaffoldFilePublicationOutcome = props.publish(entry);
    if (outcome.status === "completed") {
      if (outcome.parentIdentity.length === 0)
        throw new Error(
          `completed scaffold publication omitted parent identity: ${entry.relative}`,
        );
      completed.push(
        Object.freeze({ entry, parentIdentity: outcome.parentIdentity }),
      );
      continue;
    }
    if (outcome.status === "refused") {
      if (
        outcome.reason !== "create-failed" &&
        outcome.reason !== "parent-changed" &&
        outcome.reason !== "target-competitor"
      )
        throw new Error(
          `refused scaffold publication has invalid reason: ${entry.relative}`,
        );
    } else if (outcome.status === "partial") {
      if (
        outcome.parentIdentity.length === 0 ||
        Number.isSafeInteger(outcome.bytesWritten) === false ||
        outcome.bytesWritten < 0 ||
        outcome.bytesWritten > entry.bytes.length
      )
        throw new Error(
          `partial scaffold publication has invalid bound state: ${entry.relative}`,
        );
    } else
      throw new Error(
        `scaffold publication returned an unknown outcome: ${entry.relative}`,
      );
    return Object.freeze({
      completed: Object.freeze(completed),
      failure: Object.freeze({ entry, outcome: Object.freeze({ ...outcome }) }),
      planned,
      status:
        outcome.status === "refused" && completed.length === 0
          ? "refused"
          : "partial",
    });
  }
  return Object.freeze({
    completed: Object.freeze(completed),
    failure: null,
    planned,
    status: "completed",
  });
};

/**
 * Throw when two entries name the same target, ignoring case, or when one
 * entry's target is an ancestor directory of another's.
 */
const assertDistinctScaffoldTargets = (
  root: string,
  entries: readonly IScaffoldPublicationEntry[],
): void => {
  const owners: Map<string, IScaffoldPublicationEntry> = new Map<
    string,
    IScaffoldPublicationEntry
  >();
  for (const entry of entries) {
    const key: string = canonicalScaffoldPath(entry.target);
    const previous: IScaffoldPublicationEntry | undefined = owners.get(key);
    if (previous !== undefined) throw scaffoldPathCollision(previous, entry);
    owners.set(key, entry);
  }
  for (const entry of entries)
    for (
      let directory: string = path.dirname(entry.target);
      directory !== root;
      directory = path.dirname(directory)
    ) {
      const ancestor: IScaffoldPublicationEntry | undefined = owners.get(
        canonicalScaffoldPath(directory),
      );
      if (ancestor !== undefined) throw scaffoldPathCollision(ancestor, entry);
    }
};

const scaffoldPathCollision = (
  first: IScaffoldPublicationEntry,
  second: IScaffoldPublicationEntry,
): Error =>
  new Error(`scaffold paths collide: ${first.relative}, ${second.relative}`);

const canonicalScaffoldPath = (value: string): string => value.toLowerCase();
