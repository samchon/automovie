import path from "node:path";
import { reportAutoMovieResourceRetirement } from "../../reportAutoMovieResourceRetirement.js";

import type { ISubscribeHumanViewerSourcesProps } from "./ISubscribeHumanViewerSourcesProps.js";

/**
 * Coalesce reached source edits before replacing catalogue authority. Input events reread the catalogue; when that same file is also a checked-loader dependency, it continues through the existing revision batch so current Node witnesses and browser admission move together. Other local input rescans do not replace loaded modules. The caller owns the watcher and catalogue; closing withdraws this listener and timer and suppresses late publication without cancelling borrowed revision computation.
 *
 * @evidence contracts/common.md#principled-implementation Watched input changes trigger catalogue rescans while reached source/basis changes coalesce into revision batches; publication follows completed domain digests and is suppressed after subscription closure.
 * @evidence contracts/common.md#clear-and-simple-design Filesystem subscription, source authority and catalogue publication remain supplied capabilities; this owner coordinates only event classification, batching and listener/timer withdrawal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unanswered source work is not treated as a completed revision, and closing removes the exact listener rather than replacing foreign watcher methods or clearing unrelated listeners.
 * @evidence contracts/common.md#meaningful-documentation The comment defines differing input/source effects, ownership, pending-publication suppression and the borrowed-worker cancellation limitation.
 * @evidence contracts/performance.md#efficient-algorithms A Set deduplicates changed paths until one timer dispatches them; each batch still incurs its revision owner's full dependency computation, while input-only events avoid that work.
 * @evidence contracts/performance.md#reuse-equivalent-work The pending Set shares duplicate path invalidations within a batch; completed text/digest reuse belongs to the revision owner, and effects are not merged merely by matching event text.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One exact watcher listener and at most one pending timer are withdrawn independently on close, with original cleanup failure retained; changed paths clear then, but overlapping borrowed revision tasks have no numeric concurrency bound and settle with their owner.
 */
export function subscribeHumanViewerSources(
  props: ISubscribeHumanViewerSourcesProps,
): (() => void) {
  const { source }: Pick<ISubscribeHumanViewerSourcesProps, "source"> = props;
  // The generation directory is watched, not its files: the views may not
  // exist yet, and their creation must reread the catalogue too.
  const generationDirectory: string = path.dirname(source.generationFiles.head);
  props.add([
    source.inputsDirectory,
    ...source.watched,
    generationDirectory,
    ...Object.values(source.basisFiles),
    source.documentsFile,
    ...(source.subjectPeopleFile === undefined ? [] : [source.subjectPeopleFile]),
    source.bodyExamplesFile,
  ]);
  const changes: Set<string> = new Set<string>();
  let closed: boolean = false;
  let withdrawalFailure: { error: unknown } | undefined;
  let cancel: (() => void) | undefined;
  /** Batches whose digests are being computed. */
  let applying: number = 0;
  /**
   * Publish one batch once its digests are computed off the request thread. Still updating while another batch waits or computes.
   */
  const apply: (files: string[]) => Promise<void> = async (files: string[]): Promise<void> => {
    try {
      source.refreshBases();
      const { moved }: Awaited<ReturnType<ISubscribeHumanViewerSourcesProps["source"]["revisions"]["changed"]>> = await source.revisions.changed(files.map(source.slash));
      if (closed) return;
      if (moved.length !== 0) props.publish(files, moved);
      if (moved.includes("browser")) props.browser();
    } catch (error) {
      if (!closed) props.error(error);
    } finally {
      --applying;
      if (!closed && applying === 0 && cancel === undefined && changes.size === 0)
        props.updating(false);
    }
  };
  const schedule: NonNullable<ISubscribeHumanViewerSourcesProps["schedule"]> =
    props.schedule ??
    ((run: () => void): (() => void) => {
      const timer: ReturnType<typeof setTimeout> = setTimeout(run, 100);
      return (): void => clearTimeout(timer);
    });
  const stop: () => void = props.watch((_event: string, input: string): void => {
    if (closed) return;
    const file: string = path.resolve(input);
    if (
      file.startsWith(source.inputsDirectory + path.sep) ||
      Object.values(source.generationFiles).includes(file) ||
      file === source.subjectPeopleFile || file === source.bodyExamplesFile
    ) {
      try {
        props.inputs();
      } catch (error) {
        props.error(error);
      }
      if (!source.revisions.reaches(source.slash(file))) return;
    }
    const basis: boolean =
      Object.values(source.basisFiles).includes(file) ||
      file === source.documentsFile;
    if (!basis && !source.revisions.reaches(source.slash(file))) return;
    props.reached?.();
    props.updating(true);
    changes.add(file);
    cancel?.();
    cancel = schedule((): void => {
      cancel = undefined;
      const files: string[] = [...changes];
      changes.clear();
      ++applying;
      void apply(files);
    });
  });
  return (): void => {
    if (closed) {
      if (withdrawalFailure !== undefined) throw withdrawalFailure.error;
      return;
    }
    closed = true;
    try {
      reportAutoMovieResourceRetirement([
        (): void => { cancel?.(); },
        (): void => { cancel = undefined; changes.clear(); },
        stop,
      ]);
    } catch (error) {
      withdrawalFailure = { error };
      throw error;
    }
  };
}
