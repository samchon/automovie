import path from "node:path";

import type { IHumanViewerCompileGraph } from "./IHumanViewerCompileGraph";

/**
 * Every file a compile depends on, as absolute paths to watch: the transformed
 * files, each import edge's ends, globals, configs, probed resolution
 * candidates and other resolution inputs. Watching type-only dependencies and
 * configs too means any edit that could change the build invalidates it.
 *
 * @evidence contracts/common.md#principled-implementation Watches the compiler's reported inputs, not only runtime imports.
 * @evidence contracts/common.md#clear-and-simple-design One function derives the watch list; the caller adds it to its watcher.
 * @evidence contracts/common.md#meaningful-documentation States which inputs are watched and why.
 */
export function humanViewerCompileWatchList(
  files: Record<string, string>,
  graph: IHumanViewerCompileGraph | undefined,
  human: string,
): string[] {
  return [
    ...Object.keys(files),
    ...(graph === undefined ? [] : [
      ...Object.keys(graph.edges),
      ...Object.values(graph.edges).flat(),
      ...graph.globals,
      ...graph.configs,
      ...Object.values(graph.candidates ?? {}).flat(),
      ...(graph.resolutionInputs ?? []),
    ].map((file) => path.resolve(human, file))),
  ];
}
