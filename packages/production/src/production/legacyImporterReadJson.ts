import type { Stats } from "node:fs";
import path from "node:path";
import { readAutoMovieProductionOwnedFile } from "./productionRenderJob";
import { legacyImporterParseJson } from "./legacyImporterParseJson";
import { legacyImporterLstatOrNull } from "./legacyImporterLstatOrNull";

/**
 * Read one optional applied-state JSON file only when it is physical and regular, then parse its exact owned bytes. The generic return annotation supplies no schema validation; consumers separately admit the decoded value.
 *
 * @evidence contracts/common.md#principled-implementation lstat admission rejects links and nonfiles; the canonical owned reader supplies bytes before strict UTF-8, grammar and duplicate-member admission.
 * @evidence contracts/common.md#clear-and-simple-design Separates optional file presence and byte parsing from plan/applied-state runtime validators.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing files return null, malformed files refuse, and the generic cast is not represented as evidence that untyped JSON satisfies T.
 * @evidence contracts/common.md#meaningful-documentation States optional absence, physical-file requirement and explicit generic-cast/schema-admission boundary.
 * @evidence contracts/performance.md#efficient-algorithms Includes complete owned-reader ancestry/descriptor checks and J-byte acquisition, then strict decoding/materialization; repeated numeric-token suffix slicing can add quadratic copying in J. Path text, depth and returned tree size also contribute, without a local file-size cap.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares owned read/parser boundaries, renewing current bytes for each exact-state decision instead of caching by filename.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Descriptor cleanup belongs to the owned reader; parsed records and byte buffers are scoped to the caller's admission operation and no lease is acquired here.
 */
export const legacyImporterReadJson: <T>(root: string, relative: string) => T | null = <T>(root: string, relative: string): T | null => {
  const file: string = path.join(root, ...relative.split("/"));
  const status: Stats | null = legacyImporterLstatOrNull(file);
  if (status === null) return null;
  if (status.isSymbolicLink() || status.isFile() === false)
    throw new Error(`Import state path "${file}" is not a physical file.`);
  return legacyImporterParseJson(
    readAutoMovieProductionOwnedFile({
      root,
      directory: root,
      relative,
    }),
    file,
  ) as T;
};
