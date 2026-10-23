import type { IEvidenceReference } from "@wrtnlabs/evidence";
import path from "node:path";

import type { IProductionConfigProps } from "../IProductionConfigProps";
import { collectProductionAuthoredBoundaries } from "./collectProductionAuthoredBoundaries";
import { isProductionAuthoredPath } from "./isProductionAuthoredPath";
import { resolveProductionPhysicalPath } from "./resolveProductionPhysicalPath";

/** Keeps global support claims outside every scoped authoring input tree. */
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
