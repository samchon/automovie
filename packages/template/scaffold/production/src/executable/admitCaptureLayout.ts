import path from "node:path";

import type { CaptureDirectory } from "./CaptureDirectory";
import { CaptureSheetBook } from "./CaptureSheetBook";

/**
 * Admit a capture layout before anything is written, and resolve where its run writes.
 *
 * It throws for a round name that is not letters, digits, dots, underscores and hyphens, for a run compared against its own round, for a tolerance that is negative or not finite, and for a sheet layout its `CaptureSheetBook` refuses.
 *
 * It reads no folder, so whether the compared round exists stays the folder owner's question.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States every refusal, what the result resolves, and the question left to the folder owner.
 * @evidence contracts/development/implementation.md#principled-implementation Every refusal the layout alone decides is one function of the layout, which the folder owner calls before it creates or deletes anything, so a refused layout leaves the previous run readable.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the names, the tolerance and the sheets, then the comparison, then resolve the two folders.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A round name cannot leave the capture's folder, and the sheet layout is admitted by the book that fills the sheets instead of a copy of its rules.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work besides the sheet book it makes.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The book that admits the sheet layout is returned as the run's book instead of being made twice.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is kept; the returned book is the caller's.
 */
export function admitCaptureLayout(layout: CaptureDirectory.ILayout): {
  /** Folder the run writes into: `base`, or `<base>/rounds/<round>` for a kept round. */
  directory: string;

  /** Folder of the compared round, or undefined without a comparison. */
  reference: string | undefined;

  /** The run's contact sheets, or undefined for a run that writes none. */
  sheets: CaptureSheetBook | undefined;
} {
  for (const name of [layout.round, layout.compare])
    if (name !== undefined && !/^[a-z0-9][a-z0-9._-]*$/iu.test(name))
      throw new Error(
        `Round name "${name}" must be letters, digits, dots, underscores and hyphens`,
      );
  if (!Number.isFinite(layout.tolerance) || layout.tolerance < 0)
    throw new Error("--tolerance must be a non-negative number");
  const sheets: CaptureSheetBook | undefined =
    layout.sheet === null ? undefined : new CaptureSheetBook(layout.sheet);
  if (layout.compare !== undefined && layout.compare === layout.round)
    throw new Error(
      `Round "${layout.compare}" cannot be compared against itself`,
    );

  return {
    directory:
      layout.round === undefined
        ? layout.base
        : path.join(layout.base, "rounds", layout.round),
    reference:
      layout.compare === undefined
        ? undefined
        : path.join(layout.base, "rounds", layout.compare),
    sheets,
  };
}
