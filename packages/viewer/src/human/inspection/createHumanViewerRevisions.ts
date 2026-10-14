import { createHash } from "node:crypto";

import type { ICreateHumanViewerRevisionsProps } from "./ICreateHumanViewerRevisionsProps.js";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";
import { collectHumanViewerImports } from "./collectHumanViewerImports.js";
import { readHumanViewerNodeInputs } from "./readHumanViewerNodeInputs.js";

/**
 * The revision digests of the viewer, each over only the files it truly depends on.
 *
 * Each entry digest follows its complete literal dependency graph, including all re-export barrel dependencies. Entry graphs may overlap; a file outside one graph leaves that digest unchanged, while a shared barrel dependency can change several domains. Person includes its composition entry and browser includes every runtime plus published bases and explicit extra inputs.
 *
 * Supplied checked Node byte/file-membership witnesses additionally enter browser admission. An unimported type error or repair can renew that candidate without changing a numerical key only when the edited file is outside its entry graph. Source events must reach this owner for memo invalidation.
 *
 * `reaches` checks import/resolution candidates, explicit checked files and supported source additions inside the checked roots without rereading bytes. `changed` refreshes invalidated source-text memo entries and recomputes the digests; the complete checked Node byte/membership witness is rehashed for browser/admission on each batch. It reports actual moved domains while the caller retains candidate replacement and numerical-cache decisions.
 *
 * @evidence contracts/common.md#principled-implementation Complete literal dependency graphs and explicit extra inputs produce domain digests; checked-loader byte/membership facts additionally enter browser admission and changed batches invalidate their source-text entries.
 * @evidence contracts/common.md#clear-and-simple-design Text/existence memos support one recomputation path for four domain graphs and one reached-path set without owning candidate replacement or numerical caches.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Barrel dependencies remain in initialized graphs rather than following only named export owners; dynamically added checked inputs can invalidate browser admission without being runtime imports.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies graph and checked-witness scope, extra inputs, actual moved-domain reporting and independent caller replacement/cache decisions.
 * @evidence contracts/performance.md#efficient-algorithms Each graph collection traverses reached modules and literal edges, sorted paths give deterministic hashing, and checked Node inputs are reread in their existing witness pass on each batch.
 * @evidence contracts/performance.md#reuse-equivalent-work Source text persists by exact path until its changed event, existence probes reset every batch and current digests reuse only completed computation; this assumes every source-byte change reaches the invalidation owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Every attempt prunes text entries it did not consult, including failed computation; successful attempts cover four current graphs, and current reach/resolution candidates have no independent cap beyond the active graph and checked-input scope.
 */
export function createHumanViewerRevisions(
  props: ICreateHumanViewerRevisionsProps,
): {
  current: () => IHumanViewerRevisions;
  reaches: (file: string) => boolean;
  reached: () => string[];
  changed: (files: readonly string[]) => { moved: (keyof IHumanViewerRevisions)[] };
} {
  const texts: Map<string, string | undefined> = new Map();
  const present: Map<string, boolean> = new Map();
  let consulted: Set<string> = new Set();
  const io: ICreateHumanViewerRevisionsProps["io"] = {
    exists: (file: string): boolean => {
      if (!present.has(file)) present.set(file, props.io.exists(file));
      return present.get(file)!;
    },
    read: (file: string): string | undefined => {
      consulted.add(file);
      if (!texts.has(file)) texts.set(file, props.io.read(file));
      return texts.get(file);
    },
  };
  const digest: (files: readonly string[]) => string = (files: readonly string[]): string => {
    const hash: ReturnType<typeof createHash> = createHash("sha256");
    for (const file of files) {
      hash.update(file.slice(props.root.length));
      hash.update("\0");
      hash.update(io.read(file) ?? "");
      hash.update("\0");
    }
    return hash.digest("hex");
  };
  let reached: Set<string> = new Set();
  const checkedScope: ICreateHumanViewerRevisionsProps["checkedInputs"] = props.checkedInputs;
  const checkedRoots: string[] = checkedScope?.directories.map((directory: string): string => directory.replaceAll("\\", "/").replace(/\/$/, "") + "/") ?? [];
  const checkedFiles: Set<string> = new Set(checkedScope?.files.map((file: string): string => file.replaceAll("\\", "/")) ?? []);
  const compute: () => IHumanViewerRevisions = (): IHumanViewerRevisions => {
    consulted = new Set();
    try {
    const graph: (entries: readonly string[]) => string[] = (entries: readonly string[]): string[] =>
      [
        ...new Set([
          ...collectHumanViewerImports({ entries, root: props.root, io }),
          ...props.extra,
        ]),
      ].sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0));
    const browser: string[] = graph(props.entries.browser);
    const face: string[] = graph(props.entries.face);
    const body: string[] = graph(props.entries.body);
    const person: string[] = graph(props.entries.person);
    const checked: ReturnType<typeof readHumanViewerNodeInputs> = checkedScope === undefined ? {} : readHumanViewerNodeInputs(
      props.root, checkedScope.directories, checkedScope.files,
    );
    // A missing dependency still has a resolution candidate. Keep that path
    // watched so its repair can recover the failed source generation.
    reached = new Set([
      ...browser,
      ...face,
      ...body,
      ...person,
      ...present.keys(),
      ...Object.keys(checked).map((file: string): string => file.replaceAll("\\", "/")),
    ]);
    return {
      browser: createHash("sha256")
        .update(digest(browser) + props.bases() + (checkedScope === undefined ? "" : JSON.stringify(checked)))
        .digest("hex"),
      face: digest(face),
      body: digest(body),
      person: digest(person),
    };
    } finally {
      for (const file of texts.keys())
        if (!consulted.has(file)) texts.delete(file);
    }
  };
  let current: IHumanViewerRevisions = compute();
  return {
    current: (): IHumanViewerRevisions => current,
    /** Whether an import dependency or checked-loader input, including a new source member, can move admission authority. */
    reaches: (file: string): boolean => reached.has(file) || checkedFiles.has(file) ||
      (checkedRoots.some((root: string): boolean => file.startsWith(root)) && /\.(?:ts|mts|cts|js|mjs|cjs|json|glsl|wgsl)$/.test(file)),
    /** Every file any graph reaches, as of the last computation. */
    reached: (): string[] => [...reached],
    changed: (
      files: readonly string[],
    ): { moved: (keyof IHumanViewerRevisions)[] } => {
      for (const file of files) texts.delete(file);
      present.clear();
      const next: IHumanViewerRevisions = compute();
      const moved: (keyof IHumanViewerRevisions)[] = (
        Object.keys(next) as (keyof IHumanViewerRevisions)[]
      ).filter((key: keyof IHumanViewerRevisions): boolean => next[key] !== current[key]);
      current = next;
      return { moved };
    },
  };
}
