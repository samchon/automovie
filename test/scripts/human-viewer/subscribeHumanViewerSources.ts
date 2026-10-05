import path from "node:path";

import type { ISubscribeHumanViewerSourcesProps } from "./ISubscribeHumanViewerSourcesProps";

/**
 * Coalesce reached source edits before replacing catalogue authority. Local
 * input rescans do not replace loaded modules; basis and imported source edits
 * refresh their digests before publication. The caller owns the watcher and
 * catalogue; this subscription owns only edit ordering and its pending batch.
 *
 * @evidence contracts/common.md#principled-implementation Basis authority refresh precedes source digest computation and catalogue publication, and only a moved browser generation emits its redraw notification.
 * @evidence contracts/common.md#clear-and-simple-design One subscription owns reached-edit admission, batching and cancellation while callers own storage and catalogue state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Edits are admitted by the actual import graph and input boundaries without matching subjects or fixtures.
 * @evidence contracts/common.md#meaningful-documentation Defines local-input and generation-view rescans, publication ordering and watcher ownership.
 */
export function subscribeHumanViewerSources(props: ISubscribeHumanViewerSourcesProps) {
  const { source } = props;
  // The generation directory is watched, not its files: the views may not
  // exist yet, and their creation must reread the catalogue too.
  const generationDirectory = path.dirname(source.generationFiles.head);
  props.add([source.inputsDirectory, ...source.watched, generationDirectory,
    ...Object.values(source.basisFiles), source.documentsFile]);
  const changes = new Set<string>();
  let cancel: (() => void) | undefined;
  const schedule = props.schedule ?? ((run: () => void) => {
    const timer = setTimeout(run, 100);
    return () => clearTimeout(timer);
  });
  props.watch((_event, input) => {
    const file = path.resolve(input);
    if (file.startsWith(source.inputsDirectory + path.sep) ||
        Object.values(source.generationFiles).includes(file)) {
      try {
        props.inputs();
      } catch (error) {
        props.error(error);
      }
      return;
    }
    const basis = Object.values(source.basisFiles).includes(file) || file === source.documentsFile;
    if (!basis && !source.revisions.reaches(source.slash(file))) return;
    props.updating(true);
    changes.add(file);
    cancel?.();
    cancel = schedule(() => {
      try {
        source.refreshBases();
        const files = [...changes];
        changes.clear();
        const { moved } = source.revisions.changed(files.map(source.slash));
        if (moved.length !== 0) props.publish(files, moved);
        props.updating(false);
        if (moved.includes("browser")) props.browser();
      } catch (error) {
        props.updating(false);
        props.error(error);
      }
    });
  });
  return () => cancel?.();
}
