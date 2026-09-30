import { createHash } from "node:crypto";

import { collectHumanViewerImports } from "./collectHumanViewerImports";
import type { IHumanViewerResolveIo } from "./resolveHumanViewerImport";

/** The digests that decide what the viewer must rebuild. */
export interface IHumanViewerRevisions {
  /** Digest of what the page and its worker load; a change reloads the page. */
  browser: string;

  /** Digest of what a face build reads; the cache key of a face document. */
  face: string;

  /** Digest of what a body build reads; the cache key of a body document. */
  body: string;
}

/**
 * The revision digests of the viewer, each over only the files it truly
 * depends on.
 *
 * A face digest hashes the source graph the face runtime imports, so an edit
 * to a body module, a test, a document or a viewer screen leaves every face
 * document's cache key alone, and the same holds for the body. The browser
 * digest hashes the page's graph, whose worker graph contains both runtimes,
 * with the published bases, because a resident worker keeps the code and
 * basis it loaded. `extra` names files that change every result without being
 * imported (a lockfile, a compiler configuration).
 *
 * `reaches` answers, without reading anything, whether a file is in any of the
 * graphs, so a watcher can ignore the edits nothing depends on. `changed` tells the owner that a file was edited, created or removed; the
 * next `read` recomputes only from the files touched since the last one, and
 * reports whether each digest moved, so a caller reloads the page or drops a
 * cache only for a change that reaches it.
 */
export function createHumanViewerRevisions(props: {
  root: string;
  entries: Record<keyof IHumanViewerRevisions, readonly string[]>;
  extra: readonly string[];
  bases: () => string;
  io: IHumanViewerResolveIo & { read(file: string): string | undefined };
}) {
  const texts = new Map<string, string | undefined>();
  const present = new Map<string, boolean>();
  const io = {
    exists: (file: string) => {
      if (!present.has(file)) present.set(file, props.io.exists(file));
      return present.get(file)!;
    },
    read: (file: string) => {
      if (!texts.has(file)) texts.set(file, props.io.read(file));
      return texts.get(file);
    },
  };
  const digest = (files: readonly string[]): string => {
    const hash = createHash("sha256");
    for (const file of files) {
      hash.update(file.slice(props.root.length));
      hash.update("\0");
      hash.update(io.read(file) ?? "");
      hash.update("\0");
    }
    return hash.digest("hex");
  };
  let reached = new Set<string>();
  const compute = (): IHumanViewerRevisions => {
    const graph = (entries: readonly string[]): string[] =>
      [
        ...new Set([
          ...collectHumanViewerImports({ entries, root: props.root, io }),
          ...props.extra,
        ]),
      ].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const browser = graph(props.entries.browser);
    const face = graph(props.entries.face);
    const body = graph(props.entries.body);
    reached = new Set([...browser, ...face, ...body]);
    return {
      browser: createHash("sha256")
        .update(digest(browser) + props.bases())
        .digest("hex"),
      face: digest(face),
      body: digest(body),
    };
  };
  let current = compute();
  return {
    current: (): IHumanViewerRevisions => current,
    /** Whether an edit to this file can move any digest; a file no build reads cannot. */
    reaches: (file: string): boolean => reached.has(file),
    changed: (files: readonly string[]): { moved: (keyof IHumanViewerRevisions)[] } => {
      for (const file of files) texts.delete(file);
      present.clear();
      const next = compute();
      const moved = (Object.keys(next) as (keyof IHumanViewerRevisions)[]).filter(
        (key) => next[key] !== current[key],
      );
      current = next;
      return { moved };
    },
  };
}
