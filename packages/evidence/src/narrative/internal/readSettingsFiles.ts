import fs from "node:fs";
import path from "node:path";

import { SETTINGS_DOMAINS } from "./SETTINGS_DOMAINS";

/**
 * Lists canon paths in reading order: the scaffold's domain folders, numbered
 * subject folders, or legacy flat settings retained without rewriting them.
 *
 * The scaffold's layout is `docs/body/settings/<domain>/<subject>.md` with the
 * domains `world`, `cast`, `crowds`, `props`, `sets`, `cinematography` and
 * `sound`, read in that order and alphabetically within a domain. Numbered
 * `NNN-subject/NNN-entry.md` folders read in number order. One settings root
 * uses one layout; `outline` is navigation, not canon.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Concrete directory entries select legacy flat Markdown, the scaffold's closed domain folders or numbered subject folders, forbid mixed/nested/symlinked layouts, enforce unique three-digit order keys for numbered folders and return deterministic relative reading order.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The filesystem reader owns canon layout validation; callers build outline and evidence relationships from the returned order without rewriting existing files.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Legacy flat settings and numbered folders stay supported; absent settings return empty, while unknown domains, malformed names, mixed layouts, duplicate order keys and symlinks fail for every production.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the scaffold domain layout and its reading order, numbered and legacy retention, and that outline is navigation; errors identify mixed layouts, naming, empty folders, nesting and duplicate order numbers.
 * @evidence contracts/development/implementation.md#efficient-algorithms For e root/subject entries, directory enumeration and name validation scan entry text; sorting folders and entries costs O(e log e) comparisons in the worst distribution, with O(e) output/sets and directory arrays. No canon bytes are read.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each directory is listed once per call and duplicate-number sets avoid repeated pairwise comparisons; later calls rerun because current settings topology can change.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Listings and relative file arrays live for one call or in its returned result; synchronous filesystem operations leave no retained handles/tasks and no fixed count bound is imposed.
 */
export function readSettingsFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const files: string[] = [];
  const numbered: string[] = [];
  const domains: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".md")) files.push(entry.name);
    else if (entry.isDirectory() && entry.name !== "outline") {
      if (SETTINGS_DOMAINS.includes(entry.name)) domains.push(entry.name);
      else if (NUMBERED.test(entry.name)) numbered.push(entry.name);
      else
        throw new Error(
          `${path.join(root, entry.name)}: settings folders are the domains ${SETTINGS_DOMAINS.join(", ")}, or NNN-lower-kebab-case subject folders.`,
        );
    } else if (entry.isSymbolicLink())
      throw new Error(
        `${path.join(root, entry.name)}: settings does not follow symbolic links.`,
      );
  }
  if (
    [files.length, numbered.length, domains.length].filter(Boolean).length > 1
  )
    throw new Error(
      `${root}: flat, domain and numbered settings layouts cannot be mixed.`,
    );

  // Domain folders read in the scaffold's domain order, files alphabetically.
  if (domains.length) {
    const classified: string[] = [];
    for (const domain of SETTINGS_DOMAINS.filter((d: string): boolean =>
      domains.includes(d),
    )) {
      const entries: string[] = list(root, domain, KEBAB_FILE);
      for (const entry of entries) classified.push(`${domain}/${entry}`);
    }
    return classified;
  }

  // Numbered folders read in number order, with distinct order keys.
  const keys: Set<string> = new Set<string>();
  const classified: string[] = [];
  for (const folder of numbered.sort(compare)) {
    if (keys.has(folder.slice(0, 3)))
      throw new Error(
        `${root}: settings subject folders must have distinct order numbers.`,
      );
    keys.add(folder.slice(0, 3));
    const used: Set<string> = new Set<string>();
    for (const entry of list(root, folder, NUMBERED_FILE)) {
      if (used.has(entry.slice(0, 3)))
        throw new Error(
          `${path.join(root, folder)}: settings files must have distinct order numbers within their folder.`,
        );
      used.add(entry.slice(0, 3));
      classified.push(`${folder}/${entry}`);
    }
  }
  return numbered.length ? classified : files.sort(compare);
}

/** A numbered subject folder name. */
const NUMBERED: RegExp = /^[0-9]{3}-[a-z0-9]+(?:-[a-z0-9]+)*$/u;

/** A numbered canon file name. */
const NUMBERED_FILE: RegExp = /^[0-9]{3}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/u;

/** A lower-kebab-case canon file name. */
const KEBAB_FILE: RegExp = /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/u;

/** Code-unit order, independent of locale. */
function compare(left: string, right: string): 1 | -1 | 0 {
  return left < right ? -1 : left > right ? 1 : 0;
}

/** The sorted Markdown files of one settings folder, refusing nesting, bad names and emptiness. */
function list(root: string, folder: string, pattern: RegExp): string[] {
  const names: string[] = [];
  for (const entry of fs.readdirSync(path.join(root, folder), {
    withFileTypes: true,
  })) {
    if (!entry.isFile() || !pattern.test(entry.name))
      throw new Error(
        `${path.join(root, folder, entry.name)}: settings folders hold ${pattern === NUMBERED_FILE ? "numbered" : "lower-kebab-case"} Markdown files only, without nesting.`,
      );
    names.push(entry.name);
  }
  if (!names.length)
    throw new Error(
      `${path.join(root, folder)}: an empty settings folder has no canon.`,
    );
  return names.sort(compare);
}
