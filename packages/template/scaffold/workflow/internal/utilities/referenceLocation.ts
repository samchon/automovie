import type { AuthoredPass } from "../../AuthoredPass";
import { PACKAGE_DOCS_ROOT } from "./PACKAGE_DOCS_ROOT";

/**
 * Gives reference targets an explicit address in the graph's global space.
 *
 * Upstream references select the promoted manuscript for either pass. This is
 * distinct from a naturalness claim's working host; revision references select
 * its frozen pre-revision snapshot.
 *
 * File references use package-relative addresses. A claim that selects file
 * hosts and a claim that selects section hosts read the same documents, and the
 * engine offers every annotation in a claim's files to every reference of that
 * claim. A file address that is also an ancestor address of a section reference
 * would reach that reference as an aggregate target and be refused for lacking
 * a section host. A distinct address space keeps each annotation with the
 * reference it answers.
 */
export function referenceLocation(
  files: string[],
  pass: AuthoredPass | "revision",
  symbol: "file" | "h2" = "h2",
): {
  root: string;
  files: string[];
} {
  if (symbol === "file")
    return {
      root: ".",
      files: files.map(
        (file: string): string =>
          `${PACKAGE_DOCS_ROOT}/${pass === "revision" ? "revision" : "body"}/${file}`,
      ),
    };
  return {
    root: `${PACKAGE_DOCS_ROOT}/${pass === "revision" ? "revision" : "body"}`,
    files,
  };
}
