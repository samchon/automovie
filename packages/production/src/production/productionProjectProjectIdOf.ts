import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";

/**
 * Choose descriptive project identity from package name or the root basename.
 *
 * @evidence contracts/common.md#principled-implementation Parses package.json with strict structured-JSON ingress, returns a trimmed nonblank declared name, and otherwise uses the trimmed directory basename; this is descriptive metadata rather than a content-addressed physical generation token.
 * @evidence contracts/common.md#clear-and-simple-design Keeps the existing best-effort package-name policy in one constructor helper instead of introducing a second project identity registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts All package read/parse failures trigger the same existing basename fallback; this direct package read does not perform the owned-file symlink fence and basename fallback itself does not assert nonblank schema validity.
 * @evidence contracts/common.md#meaningful-documentation States both naming sources and fallback behavior, distinguishing a display/project label from root device/inode and incarnation identities used for mutation safety.
 * @evidence contracts/performance.md#efficient-algorithms Reads and parses the complete package record before inspecting name, then trims one string; record bytes and selected name/root length determine cost, with no graph enumeration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Computes this opening's descriptive id once and transfers it into the manifest; independent project openings reread metadata instead of sharing cached naming failures.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parsed package data and read buffers are local, synchronous read owns its transient handle, and the chosen string remains in the opening manifest without a task or metadata cache.
 */
export function productionProjectProjectIdOf(root: string): string {
    try {
        const declared: unknown = parseAutoMovieStructuredJson({
            record: "package.json",
            bytes: fileSystem.readFileSync(path.join(root, "package.json")),
        });
        const name: unknown = (declared as {
            name?: unknown;
        } | null)?.name;
        if (typeof name === "string" && name.trim().length > 0)
            return name.trim();
    }
    catch {
        /* a project without a readable declaration falls back to its directory. */
    }
    return path.basename(root).trim();
}
