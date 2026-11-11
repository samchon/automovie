import path from "node:path";
import { pathToFileURL } from "node:url";

import type { IFilm } from "../IFilm";

/**
 * Load the film a module exports, for capturing a film that is not registered, such as a motion rehearsal.
 *
 * The film is the export called `name`, or the module's only export when `name` is undefined; an exported function is called first and its result taken. The returned name places the output under `modules/<module>`, or `modules/<module>-<export>` when the export was named. It throws when the export cannot be chosen and when the value is not a film.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the purpose, how the export is chosen, the factory rule, the output name and both refusals.
 * @evidence contracts/development/implementation.md#principled-implementation The module is imported by its resolved file URL, as Node loads any entry, and the value is admitted by the three members a capture reads before it is treated as a film.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Import, choose the export, admit the value, name the output.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An ambiguous module lists its exports and throws instead of taking the first; a value that is not a film is refused by name.
 * @evidence contracts/development/implementation.md#efficient-algorithms One import and a constant number of checks.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Node's module cache serves a module named twice.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Opens nothing; the loaded module stays in Node's cache like any import.
 */
export async function loadModuleFilm(
  file: string,
  name: string | undefined,
): Promise<{ name: string; film: IFilm }> {
  const exports: Record<string, unknown> = await import(
    pathToFileURL(path.resolve(file)).href
  );
  const names: string[] = Object.keys(exports);
  const chosen: string | undefined =
    name ?? (names.length === 1 ? names[0] : undefined);
  if (chosen === undefined || !Object.hasOwn(exports, chosen))
    throw new Error(
      `Select the film export of ${file} with --export <name>: ${names.join(", ")}`,
    );
  const value: unknown = exports[chosen];
  const film: unknown = typeof value === "function" ? value() : value;
  const candidate: Partial<IFilm> | null =
    typeof film === "object" ? (film as Partial<IFilm> | null) : null;
  if (
    candidate === null ||
    typeof candidate.durationSeconds !== "number" ||
    typeof candidate.fps !== "number" ||
    typeof candidate.create !== "function"
  )
    throw new Error(`${file}#${chosen} is not an IFilm or a factory of one`);
  const base: string = path.basename(file).replace(/\.[cm]?[jt]s$/u, "");
  return {
    name: path.join("modules", name === undefined ? base : `${base}-${chosen}`),
    film: candidate as IFilm,
  };
}
