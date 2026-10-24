import type { IEvidenceReference } from "@wrtnlabs/evidence";
import path from "node:path";

import type { IProductionConfigProps } from "../IProductionConfigProps";
import { collectProductionAuthoredBoundaries } from "./collectProductionAuthoredBoundaries";
import { isProductionAuthoredPath } from "./isProductionAuthoredPath";
import { resolveProductionPhysicalPath } from "./resolveProductionPhysicalPath";

/**
 * Keeps global support claims outside every scoped authoring input tree.
 *
 * @evidence contracts/common.md#principled-implementation Positive selector prefixes are resolved against the production root and compared with protected authoring paths and captured link-target boundaries; any containing or contained prefix is rejected before materialization.
 * @evidence contracts/common.md#clear-and-simple-design This early conservative guard owns declared engineering selector separation; assertSupportInventory later checks actual native inventory identities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Negated globs do not introduce selected hosts and are skipped; broad positive prefixes still fail even if exclusions might later remove authoring files, rather than assuming exclusion equivalence.
 * @evidence contracts/common.md#meaningful-documentation The comment states engineering versus authored tree separation; the error names narrower engineering selectors or explicitly scoped work claims as the correction.
 * @evidence contracts/performance.md#efficient-algorithms Boundary discovery walks protected directories and links once per physical directory; s positive prefixes each perform path resolution and up to b boundary comparisons. Time depends on filesystem entries, path depth/length and s*b; the discovered sets scale with protected paths.
 * @evidence contracts/performance.md#reuse-equivalent-work The boundary list is reused for every selector in this configuration check; no cross-build cache is valid because symlink targets and directory contents can change.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Directory listings and stat/realpath operations are synchronous and retain no open handles; local boundary/selector arrays expire on completion or failure with no fixed entry-count cap.
 */
export function assertSupportClaims(props: IProductionConfigProps): void {
  if ((props.supportClaims?.length ?? 0) === 0) return;
  const boundaries: string[] = collectProductionAuthoredBoundaries(
    props.location,
  );
  const inspect: (root: string | undefined, files: string[]) => void = (
    root: string | undefined,
    files: string[],
  ): void => {
    for (const file of files) {
      if (file.startsWith("!")) continue;
      const portable: string = file.replaceAll("\\", "/");
      const end: number = portable.search(/[*?[{(]/u);
      const declared: string = path.resolve(
        props.location,
        root ?? ".",
        end === -1 ? portable : portable.slice(0, end),
      );
      const prefix: string = resolveProductionPhysicalPath(declared);
      if (
        isProductionAuthoredPath(declared) ||
        isProductionAuthoredPath(prefix) ||
        boundaries.some(
          (boundary: string): boolean =>
            boundary === prefix ||
            boundary.startsWith(`${prefix}/`) ||
            prefix.startsWith(`${boundary}/`),
        )
      )
        throw new Error(
          "Support claims cannot select authored production inputs; use an exactly scoped work claim and a narrower engineering selector.",
        );
    }
  };
  for (const claim of props.supportClaims ?? []) {
    inspect(claim.root, claim.files);
    if (claim.evidenceFiles !== undefined)
      inspect(undefined, claim.evidenceFiles);
    const references: IEvidenceReference[] = Array.isArray(claim.reference)
      ? claim.reference
      : [claim.reference];
    for (const reference of references) {
      const files: string[] =
        "files" in reference
          ? reference.files
          : "file" in reference
            ? [reference.file]
            : [];
      inspect(reference.root, files);
    }
  }
}
