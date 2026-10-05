import type { IHumanViewerResolveIo } from "./IHumanViewerResolveIo";
import type { IHumanViewerRevisionsEntries } from "./IHumanViewerRevisionsEntries";

/**
 * What the revision digests are computed from.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 * @author Samchon
 */
export interface ICreateHumanViewerRevisionsProps {
  /** Repository root with forward slashes; digests hash paths relative to it. */
  root: string;

  /** Entry files of each digest's import graph. */
  entries: IHumanViewerRevisionsEntries;

  /** Files that change every result without being imported. */
  extra: readonly string[];

  /** The published basis digests the browser digest also covers. */
  bases: () => string;

  /** File access: existence and text, undefined for an unreadable file. */
  io: IHumanViewerResolveIo & { read(file: string): string | undefined };
}
