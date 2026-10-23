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
 *
 * @evidence contracts/common.md#principled-implementation Upstream draft/final references always target promoted body bytes, revision references target frozen bytes, and file references use package-global addresses distinct from H2-root addresses to avoid aggregate-target collisions.
 * @evidence contracts/common.md#clear-and-simple-design Address qualification is centralized for coverage, lineage and settings references, keeping native binder address-space rules out of their semantic flag builders.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The file/H2 address distinction follows native aggregate binding semantics; no citation is rewritten to match an expected answer or silently redirected to a working edition.
 * @evidence contracts/common.md#meaningful-documentation The prose explains promoted versus working ownership, frozen revision targets and why file references need a separate global address space.
 * @evidence contracts/performance.md#efficient-algorithms File mode maps n selectors and their total text length p into qualified paths in O(n + p) work/storage; H2 mode constructs only its root and reuses the supplied files array.
 * @evidence contracts/performance.md#reuse-equivalent-work Coverage and lineage share this address rule, and H2 mode reuses the input selector array; there is no cache that could incorrectly equate mutable files arrays or different passes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned root/files record; file mode owns n new strings while H2 mode retains the caller array reference, with no filesystem handle or running task.
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
