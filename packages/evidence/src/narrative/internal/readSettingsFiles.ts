import fs from "node:fs";
import path from "node:path";

import { SETTINGS_DOMAINS } from "./SETTINGS_DOMAINS";

/**
 * Lists canon paths in reading order: the scaffold's domain folders, numbered
 * subject folders, or legacy flat settings retained without rewriting them.
 *
 * The scaffold's layout is `docs/body/settings/<domain>/<subject>.md` with the
 * domains `world`, `cast`, `crowds`, `props`, `sets`, `cinematography` and
 * `sound`, read in that order and alphabetically within a domain. Domain files
 * use lower-kebab-case names and exclude the numbered `NNN-entry.md` form.
 * Numbered `NNN-subject/NNN-entry.md` folders read in number order. One
 * settings root uses one layout; `outline` is navigation, not canon.
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

/** Base domain filename grammar; list additionally excludes NUMBERED_FILE. */
const KEBAB_FILE: RegExp = /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/u;

/** Code-unit order, independent of locale. */
function compare(left: string, right: string): 1 | -1 | 0 {
  return left < right ? -1 : left > right ? 1 : 0;
}

/**
 * The sorted Markdown files of one settings folder, keeping domain and numbered
 * names disjoint and refusing nesting, bad names and emptiness.
 */
function list(root: string, folder: string, pattern: RegExp): string[] {
  const names: string[] = [];
  for (const entry of fs.readdirSync(path.join(root, folder), {
    withFileTypes: true,
  })) {
    if (
      !entry.isFile() ||
      !pattern.test(entry.name) ||
      (pattern === KEBAB_FILE && NUMBERED_FILE.test(entry.name))
    )
      throw new Error(
        `${path.join(root, folder, entry.name)}: settings folders hold ${pattern === NUMBERED_FILE ? "numbered" : "unnumbered lower-kebab-case"} Markdown files only, without nesting.`,
      );
    names.push(entry.name);
  }
  if (!names.length)
    throw new Error(
      `${path.join(root, folder)}: an empty settings folder has no canon.`,
    );
  return names.sort(compare);
}
