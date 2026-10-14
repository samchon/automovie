import type { AutoMovieViewerSubjectKind } from "./AutoMovieViewerSubjectKind.js";
import type { IAutoMovieViewerSubject } from "./IAutoMovieViewerSubject.js";

/**
 * Parse the first colon as category boundary and last @ as revision boundary. Unknown category, missing id and empty explicit revision refuse; this grammar does not resolve source existence or unambiguously represent a revision containing @.
 *
 * @evidence contracts/common.md#principled-implementation Uses the maintained category Set and deterministic first/last delimiter splits, preserving preceding @ inside an id only when a final revision follows.
 * @evidence contracts/common.md#clear-and-simple-design One pure textual boundary supplies a subject record; source lookup and provenance verification remain consumer responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejects unrecognized syntax instead of guessing category; an unrevisioned id containing @ is interpreted as a revisioned key and whitespace/unverified revision text are not normalized.
 * @evidence contracts/common.md#meaningful-documentation States syntax, refusal cases, delimiter ambiguity and lack of source resolution.
 * @evidence contracts/performance.md#efficient-algorithms Scans/copies O(K) key characters with fixed category membership work and a small returned record.
 * @evidence contracts/performance.md#reuse-equivalent-work The static category Set is reused; parsed subject records are fresh and no scene identity result is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a fixed category Set is retained by the module; returned strings/record belong to the caller, with no native handles or registry growth.
 */
export function parseAutoMovieViewerSubjectKey(
  key: string,
): IAutoMovieViewerSubject {
  const separator: number = key.indexOf(":");
  if (separator === -1)
    throw new Error(
      `subject key "${key}" names no kind; write it as "<kind>:<id>"`,
    );
  const kind: string = key.slice(0, separator);
  if (SUBJECT_KINDS.has(kind) === false)
    throw new Error(
      `subject key "${key}" names unknown kind "${kind}"; known kinds are ${[
        ...SUBJECT_KINDS,
      ].join(", ")}`,
    );
  const rest: string = key.slice(separator + 1);
  // Last `@` wins, so an id that legitimately contains one keeps it and only
  // the trailing revision is split off.
  const revisionAt: number = rest.lastIndexOf("@");
  const id: string = revisionAt === -1 ? rest : rest.slice(0, revisionAt);
  const revision: string | null =
    revisionAt === -1 ? null : rest.slice(revisionAt + 1);
  if (id.length === 0)
    throw new Error(`subject key "${key}" names no id after its kind`);
  if (revision !== null && revision.length === 0)
    throw new Error(`subject key "${key}" ends in an empty revision`);
  return { kind: kind as AutoMovieViewerSubjectKind, id, revision };
}

const SUBJECT_KINDS: ReadonlySet<string> = new Set<AutoMovieViewerSubjectKind>([
  "built-environment",
  "building",
  "storey",
  "space",
  "element",
  "part",
  "model",
  "prototype",
  "mesh",
  "primitive",
  "formation",
  "slot",
  "instance-set",
  "instance",
]);
