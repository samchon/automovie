import type { AutoMovieRenderViewerSubjectKind } from "../../AutoMovieRenderViewerSubjectKind";
import type { IAutoMovieRenderViewerSubject } from "../../IAutoMovieRenderViewerSubject";

/*
 * Parse the first colon as category boundary and last @ as revision boundary.
 * Unknown category, missing id and empty explicit revision refuse; this grammar
 * does not resolve source existence or unambiguously represent a revision
 * containing
 */
export function parseViewerSubjectKey(
  key: string,
): IAutoMovieRenderViewerSubject {
  const separator: number = key.indexOf(":");
  if (separator === -1)
    throw new Error(
      `subject key "${key}" names no kind; write it as "<kind>:<id>"`,
    );
  const named: string = key.slice(0, separator);
  const kind: AutoMovieRenderViewerSubjectKind | undefined = SUBJECT_KINDS.find(
    (candidate: AutoMovieRenderViewerSubjectKind): boolean => candidate === named,
  );
  if (kind === undefined)
    throw new Error(
      `subject key "${key}" names unknown kind "${named}"; known kinds are ${SUBJECT_KINDS.join(", ")}`,
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
  return { kind, id, revision };
}

const SUBJECT_KINDS: readonly AutoMovieRenderViewerSubjectKind[] = [
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
];
