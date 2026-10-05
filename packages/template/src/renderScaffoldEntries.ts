import * as path from "node:path";

import type { IAutoMovieScaffoldSourceEntry } from "./IAutoMovieScaffoldSourceEntry";
import { renderTemplate } from "./renderTemplate";

/**
 * Normalize `\r\n` → `\n` so the scaffold emits identical bytes on every host
 * (a Windows checkout with `core.autocrlf` would otherwise ship CRLF and drift
 * from the scaffold's own `lf` convention). The tree is text-only, so this is
 * unconditionally safe.
 */
const normalizeLineEndings = (content: string): string =>
  content.replaceAll("\r\n", "\n");

/** POSIX-slash a path so map keys are host-independent. */
const toPosix = (value: string): string => value.split(path.sep).join("/");

/**
 * The rendered key for one scaffold-relative path.
 *
 * Path segments receive the same strict substitution and unknown-token failure
 * as file payloads. No shipped path carries a token today. Authored content
 * directories are named for their owner rather than for the production. A path is rendered
 * through the same gate as its content so a templated one cannot be shipped
 * verbatim. The root `_gitignore` stand-in becomes `.gitignore` only at this
 * boundary: npm pack otherwise renames the real file to `.npmignore`.
 * Nested names remain ordinary authored paths.
 */
const renderKey = (
  relative: string,
  variables: Readonly<Record<string, string>>,
): string => {
  const dir = path.dirname(relative);
  const base = path.basename(relative);
  const outputBase = dir === "." && base === "_gitignore" ? ".gitignore" : base;
  return renderTemplate(
    toPosix(dir === "." ? outputBase : path.join(dir, outputBase)),
    variables,
  );
};

/**
 * Render an explicit source inventory only after proving that every source has
 * one distinct output path.
 *
 * The returned object has no prototype, so names such as `__proto__` remain
 * ordinary enumerable file identities. Exact output collisions are reported
 * from sorted source identities, making the refusal independent of traversal
 * order.
 *
 * @evidence requirements/agent-authoring/project-ownership.md#agent-portable-authoring Produces one deterministic portable file identity for every authored scaffold source.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Rejects a derivation that would merge two distinct source identities into one output.
 * @author Samchon
 */
export const renderScaffoldEntries = (
  entries: readonly IAutoMovieScaffoldSourceEntry[],
  variables: Readonly<Record<string, string>>,
): Record<string, string> => {
  const rendered = entries.map((entry) => ({
    content: renderTemplate(normalizeLineEndings(entry.content), variables),
    relative: renderKey(entry.relative, variables),
    source: toPosix(entry.relative),
  }));
  const ordered = [...rendered].sort((left, right) =>
    left.relative < right.relative
      ? -1
      : left.relative > right.relative
        ? 1
        : left.source < right.source
          ? -1
          : left.source > right.source
            ? 1
            : 0,
  );
  for (let index = 1; index < ordered.length; index++) {
    const previous = ordered[index - 1]!;
    const current = ordered[index]!;
    if (previous.relative === current.relative)
      throw new Error(
        `scaffold sources collide at rendered path "${current.relative}": "${previous.source}", "${current.source}"`,
      );
  }
  const files = Object.create(null) as Record<string, string>;
  for (const entry of rendered)
    Object.defineProperty(files, entry.relative, {
      configurable: true,
      enumerable: true,
      value: entry.content,
      writable: true,
    });
  return files;
};
