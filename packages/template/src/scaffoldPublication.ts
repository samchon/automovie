import * as path from "node:path";

/**
 * One fully validated file in an immutable scaffold publication candidate.
 *
 * @author Samchon
 */
export interface IScaffoldPublicationEntry {
  /** Exact UTF-8 bytes selected before mutation begins. */
  bytes: readonly number[];
  /** Portable authored path used in diagnostics and receipts. */
  relative: string;
  /** Absolute lexical target proved to remain below the candidate root. */
  target: string;
}

/**
 * Complete, read-back-verified publication in the captured parent.
 *
 * @author Samchon
 */
export interface IScaffoldCompletedFilePublicationOutcome {
  /**
   * Identity observed through the descriptor that published the completed file.
   */
  fileIdentity?: string;
  /** Captured physical parent generation used by the native operation. */
  parentIdentity: string;
  /** Complete outcome discriminator. */
  status: "completed";
}

/**
 * Refusal before a final slot was created.
 *
 * @author Samchon
 */
export interface IScaffoldRefusedFilePublicationOutcome {
  /** Exact native or validation cause retained for the caller. */
  error: unknown;
  /** Native decision that proves no final slot was created. */
  reason: "create-failed" | "parent-changed" | "target-competitor";
  /** Zero-publication outcome discriminator. */
  status: "refused";
}

/**
 * A final slot that exists in the captured parent but is not complete.
 *
 * @author Samchon
 */
export interface IScaffoldPartialFilePublicationOutcome {
  /** Number of candidate bytes known to have reached the bound slot. */
  bytesWritten: number;
  /** Exact native or validation cause retained for the caller. */
  error: unknown;
  /** Captured physical parent generation containing the partial slot. */
  parentIdentity: string;
  /** Bound partial outcome discriminator. */
  status: "partial";
}

/**
 * Outcome reported by the parent-bound adapter for one candidate entry.
 *
 * The adapter reports rather than throws because a thrown I/O error cannot say
 * whether a final slot already exists. A partial outcome names the securely
 * bound parent generation and exact byte count without authorizing cleanup.
 *
 * @author Samchon
 */
export type ScaffoldFilePublicationOutcome =
  | IScaffoldCompletedFilePublicationOutcome
  | IScaffoldRefusedFilePublicationOutcome
  | IScaffoldPartialFilePublicationOutcome;

/**
 * One completed candidate entry paired with the physical parent generation
 * that received it.
 *
 * @author Samchon
 */
export interface IScaffoldCompletedPublication {
  /** Candidate entry whose exact bytes passed final readback. */
  entry: IScaffoldPublicationEntry;
  /** Captured physical parent generation containing the completed entry. */
  parentIdentity: string;
}

/**
 * The first candidate entry that did not complete and its observed result.
 *
 * @author Samchon
 */
export interface IScaffoldPublicationFailure {
  /** Candidate entry where publication stopped. */
  entry: IScaffoldPublicationEntry;
  /** Zero-publication or bound-partial result observed at that entry. */
  outcome: Exclude<ScaffoldFilePublicationOutcome, { status: "completed" }>;
}

/**
 * Complete observable result of attempting one immutable candidate.
 *
 * @author Samchon
 */
export interface IScaffoldPublicationReceipt {
  /** Entries completed before the attempt stopped. */
  completed: readonly IScaffoldCompletedPublication[];
  /** Stopping entry and its exact one-file outcome, or `null` on success. */
  failure: IScaffoldPublicationFailure | null;
  /** Complete candidate attempted by this receipt. */
  planned: readonly IScaffoldPublicationEntry[];
  /** Candidate-wide result derived from completed and stopping entries. */
  status: "completed" | "partial" | "refused";
}

/**
 * Validate the whole rendered file map before any directory or file mutation.
 *
 * @author Samchon
 */
export const planScaffoldPublication = (props: {
  files: Readonly<Record<string, string>>;
  root: string;
}): readonly IScaffoldPublicationEntry[] => {
  const root = path.resolve(props.root);
  const entries = Object.entries(props.files).map(([relative, content]) => {
    if (typeof content !== "string")
      throw new Error(`scaffold content is not text: ${relative}`);
    if (relative.includes("\0"))
      throw new Error(`refusing invalid scaffold path: ${relative}`);
    const target = path.resolve(root, relative);
    const inside = path.relative(root, target);
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
  });
  const ordered = [...entries].sort((left, right) => {
    const leftKey = canonicalScaffoldPath(left.target);
    const rightKey = canonicalScaffoldPath(right.target);
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  });
  for (let previousIndex = 0; previousIndex < ordered.length; previousIndex++)
    for (
      let currentIndex = previousIndex + 1;
      currentIndex < ordered.length;
      currentIndex++
    ) {
      const previous = ordered[previousIndex]!;
      const current = ordered[currentIndex]!;
      const previousKey = canonicalScaffoldPath(previous.target);
      const currentKey = canonicalScaffoldPath(current.target);
      if (
        currentKey === previousKey ||
        currentKey.startsWith(`${previousKey}${path.sep}`)
      )
        throw new Error(
          `scaffold paths collide: ${previous.relative}, ${current.relative}`,
        );
    }
  return Object.freeze(entries);
};

/**
 * Publish a precomputed candidate through a receipt-bearing one-file adapter.
 *
 * @author Samchon
 */
export const publishScaffoldCandidate = (props: {
  candidate: readonly IScaffoldPublicationEntry[];
  publish: (entry: IScaffoldPublicationEntry) => ScaffoldFilePublicationOutcome;
}): IScaffoldPublicationReceipt => {
  const planned = Object.freeze(
    props.candidate.map((entry) =>
      Object.freeze({
        bytes: Object.freeze([...entry.bytes]),
        relative: entry.relative,
        target: entry.target,
      }),
    ),
  );
  const completed: IScaffoldCompletedPublication[] = [];
  for (const entry of planned) {
    const outcome = props.publish(entry);
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
    if (
      outcome.status === "refused" &&
      outcome.reason !== "create-failed" &&
      outcome.reason !== "parent-changed" &&
      outcome.reason !== "target-competitor"
    )
      throw new Error(
        `refused scaffold publication has invalid reason: ${entry.relative}`,
      );
    if (
      outcome.status === "partial" &&
      (outcome.parentIdentity.length === 0 ||
        Number.isSafeInteger(outcome.bytesWritten) === false ||
        outcome.bytesWritten < 0 ||
        outcome.bytesWritten > entry.bytes.length)
    )
      throw new Error(
        `partial scaffold publication has invalid bound state: ${entry.relative}`,
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

const canonicalScaffoldPath = (value: string): string => value.toLowerCase();
