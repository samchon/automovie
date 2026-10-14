import { productionSemanticMaskNonBlank } from "./productionSemanticMaskNonBlank";

/**
 * Refuse blank, absolute, drive-prefixed, backslash or empty/dot/dot-dot-segment sidecar identities. The admitted string stays unchanged; this segment rule does not establish every platform's filename validity, resolve symlinks or prove physical filesystem confinement.
 *
 * @evidence contracts/common.md#principled-implementation Slash segmentation and the listed exclusions preserve an exact relative identity shared by byte receipt creation and reopening; native reserved characters and device names are not independently admitted here.
 * @evidence contracts/common.md#clear-and-simple-design String identity admission stays independent of project path resolution and resident file ownership, which the filesystem reader must enforce.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No path is normalized into a different receipt identity. Non-blank checking does not strip surrounding nonempty-path whitespace or substitute prose certification.
 * @evidence contracts/common.md#meaningful-documentation Documents the exact relative-segment rule, unchanged string, rejected segments and the remaining native filename and physical-resolution responsibilities of actual file owners.
 * @evidence contracts/performance.md#efficient-algorithms For P path characters, splitting/scanning/trimming costs O(P) and allocates O(P) segment/string storage; path length and segment count have no independent quota here.
 * @evidence contracts/performance.md#reuse-equivalent-work The one split segment list serves every segment exclusion in this call. Paths are not cached across receipts because exact supplied identity is the input.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Segments and trim temporaries become collectable on return/throw, while the path string stays caller-owned. No filesystem handle or task is opened by this syntax guard.
 */
export const productionSemanticMaskVerifySidecarPath: (path: string) => void = (path: string): void => {
    const segments: string[] = path.split("/");
    if (productionSemanticMaskNonBlank(path) === false ||
        path.includes("\\") ||
        path.startsWith("/") ||
        /^[A-Za-z]:/.test(path) ||
        segments.some((segment: string): boolean => segment === "" || segment === "." || segment === ".."))
        throw new Error(`invalid semantic sidecar path "${path}"; expected a portable relative path inside the receipt directory`);
};
