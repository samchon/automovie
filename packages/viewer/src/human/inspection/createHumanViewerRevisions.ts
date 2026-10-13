import { createHash } from "node:crypto";

import type { ICreateHumanViewerRevisionsProps } from "./ICreateHumanViewerRevisionsProps.js";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";
import { collectHumanViewerImports } from "./collectHumanViewerImports.js";
import { readHumanViewerNodeInputs } from "./readHumanViewerNodeInputs.js";

/**
 * The revision digests of the viewer, each over only the files it truly
 * depends on.
 *
 * A face digest hashes the source graph the face runtime imports, so an edit
 * to a body module, a test, a document or a viewer screen leaves every face
 * document's cache key alone, and the same holds for the body.
 * A person digest additionally follows the actual composition runtime: seam,
 * hair and assembly edits invalidate person packets even when both isolated
 * domain builders stay unchanged. The browser graph contains all runtimes,
 * with the published bases, because a resident worker keeps the code and
 * basis it loaded. `extra` names files that change every result without being
 * imported (a lockfile, a compiler configuration).
 * When checked Node inputs are supplied, their complete current byte and file
 * membership witness also enters the browser/admission digest. An unimported
 * source type error or its repair can therefore renew a checked candidate,
 * without invalidating unrelated face, body or person computation-cache keys.
 *
 * `reaches` checks import/resolution candidates, explicit checked files and supported source additions inside the checked roots without rereading bytes. `changed` refreshes invalidated source-text memo entries and recomputes the digests; the complete checked Node byte/membership witness is rehashed for browser/admission on each batch. It reports actual moved domains while the caller retains candidate replacement and numerical-cache decisions.
 *
 * @evidence contracts/common.md#principled-implementation Sorted supported import graphs determine numerical-domain digests, while the browser/admission digest additionally joins the exact existing Node-loader byte/membership witness and published basis authority.
 * @evidence contracts/common.md#clear-and-simple-design Shared source/existence memos serve the four graph digests and their reached-file lookup without another numerical cache.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Real source and declared external inputs determine revision movement, including missing resolution candidates, without named-subject hashes or a substituted frame's identity.
 * @evidence contracts/common.md#meaningful-documentation Separates face, body, person composition and browser dependencies and defines membership refresh and extra compiler inputs.
 */
export function createHumanViewerRevisions(
  props: ICreateHumanViewerRevisionsProps,
) {
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
  const checkedScope = props.checkedInputs;
  const checkedRoots = checkedScope?.directories.map((directory) => directory.replaceAll("\\", "/").replace(/\/$/, "") + "/") ?? [];
  const checkedFiles = new Set(checkedScope?.files.map((file) => file.replaceAll("\\", "/")) ?? []);
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
    const person = graph(props.entries.person);
    const checked = checkedScope === undefined ? {} : readHumanViewerNodeInputs(
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
      ...Object.keys(checked).map((file) => file.replaceAll("\\", "/")),
    ]);
    return {
      browser: createHash("sha256")
        .update(digest(browser) + props.bases() + (checkedScope === undefined ? "" : JSON.stringify(checked)))
        .digest("hex"),
      face: digest(face),
      body: digest(body),
      person: digest(person),
    };
  };
  let current = compute();
  return {
    current: (): IHumanViewerRevisions => current,
    /** Whether an import dependency or checked-loader input, including a new source member, can move admission authority. */
    reaches: (file: string): boolean => reached.has(file) || checkedFiles.has(file) ||
      (checkedRoots.some((root) => file.startsWith(root)) && /\.(?:ts|mts|cts|js|mjs|cjs|json|glsl|wgsl)$/.test(file)),
    /** Every file any graph reaches, as of the last computation. */
    reached: (): string[] => [...reached],
    changed: (
      files: readonly string[],
    ): { moved: (keyof IHumanViewerRevisions)[] } => {
      for (const file of files) texts.delete(file);
      present.clear();
      const next = compute();
      const moved = (
        Object.keys(next) as (keyof IHumanViewerRevisions)[]
      ).filter((key) => next[key] !== current[key]);
      current = next;
      return { moved };
    },
  };
}
