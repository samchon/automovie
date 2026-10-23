import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { EvidenceMetadataRewriteOwnership } from "./EvidenceMetadataRewriteOwnership";
import type { IEvidenceMetadataRenderedSample } from "./IEvidenceMetadataRenderedSample";
import type { IEvidenceMetadataRewriteFile } from "./IEvidenceMetadataRewriteFile";
import type { IEvidenceMetadataRewriteProps } from "./IEvidenceMetadataRewriteProps";
import type { IEvidenceMetadataRewriteReport } from "./IEvidenceMetadataRewriteReport";
import type { IProtectedProjection } from "./internal/metadataRewrite/IProtectedProjection";
import { decode } from "./internal/metadataRewrite/decode";
import { directory } from "./internal/metadataRewrite/directory";
import { errorMessage } from "./internal/metadataRewrite/errorMessage";
import { firstDifference } from "./internal/metadataRewrite/firstDifference";
import { locate } from "./internal/metadataRewrite/locate";
import { metadataOwnership } from "./internal/metadataRewrite/metadataOwnership";
import { originalOffset } from "./internal/metadataRewrite/originalOffset";
import { project } from "./internal/metadataRewrite/project";
import { protectedFileKind } from "./internal/metadataRewrite/protectedFileKind";
import { replacementSafety } from "./internal/metadataRewrite/replacementSafety";
import { sameMetadata } from "./internal/metadataRewrite/sameMetadata";
import { selectFiles } from "./internal/metadataRewrite/selectFiles";
import { validateRenderedSample } from "./internal/metadataRewrite/validateRenderedSample";

/**
 * Proves that a metadata-only rewrite changed only structural evidence rows.
 *
 * The canonical projection removes only the metadata region explicitly owned
 * by the operation. Complete comment ownership stops at the delimiters, while
 * acknowledgement, review, and fingerprint ownership leaves the surrounding
 * evidence structure protected. Every other byte remains protected, including
 * Markdown body, sources, punctuation, BOM choice, and non-owned line endings.
 *
 * @evidence contracts/common.md#principled-implementation Validate physical file safety and strict UTF-8, compare ownership-specific byte projections, check corruption signals and bind bulk samples to changed metadata.
 * @evidence contracts/common.md#clear-and-simple-design One synchronous coordinator aggregates diagnostics while grammar, byte mapping and sample checks have separate helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts BOM, authored text and unowned endings stay protected; added, removed or symlinked selected paths fail rather than becoming metadata edits.
 * @evidence contracts/common.md#meaningful-documentation The comment defines ownership boundaries and byte preservation; failure throws aggregated diagnostics and success returns hashes and sample data.
 * @evidence contracts/performance.md#efficient-algorithms Across F files and B bytes, reads, validation, projection, hashing and token scans dominate; malformed-block lookahead may rescan, sorting is O(F log F), and retained projections scale with total bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work Each projection serves equality, source diagnostics, metadata comparison, hashing and sample checks within this invocation; filesystem results are not cached across operations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The call owns synchronous reads, diagnostics, reports and its projection Map until return or throw; no handles stay open and memory has no fixed cap beyond selected inputs.
 */
export function verifyEvidenceMetadataRewrite(
  props: IEvidenceMetadataRewriteProps,
): IEvidenceMetadataRewriteReport {
  const beforeRoot: string = directory(props.beforeRoot, "beforeRoot");
  const afterRoot: string = directory(props.afterRoot, "afterRoot");
  const ownership: EvidenceMetadataRewriteOwnership = metadataOwnership(
    props.ownership,
  );
  const files: string[] = selectFiles(beforeRoot, afterRoot, props.files);
  const diagnostics: string[] = [];
  const projections: Map<
    string,
    { before: IProtectedProjection; after: IProtectedProjection }
  > = new Map<
    string,
    { before: IProtectedProjection; after: IProtectedProjection }
  >();
  const report: IEvidenceMetadataRewriteFile[] = [];

  for (const file of files) {
    const beforePath: string = path.join(beforeRoot, ...file.split("/"));
    const afterPath: string = path.join(afterRoot, ...file.split("/"));
    const beforeKind: string = protectedFileKind(beforeRoot, file);
    const afterKind: string = protectedFileKind(afterRoot, file);
    if (beforeKind !== "file" || afterKind !== "file") {
      diagnostics.push(
        `${file}: metadata-only rewrite cannot add, remove, or follow a non-file protected path (ancestor=${beforeKind}, candidate=${afterKind}).`,
      );
      continue;
    }

    const beforeBytes: Buffer = fs.readFileSync(beforePath);
    const afterBytes: Buffer = fs.readFileSync(afterPath);
    let beforeText: string;
    let afterText: string;
    try {
      beforeText = decode(beforeBytes, file, "ancestor");
    } catch (error: unknown) {
      diagnostics.push(errorMessage(error));
      continue;
    }
    try {
      afterText = decode(afterBytes, file, "candidate");
    } catch (error: unknown) {
      diagnostics.push(errorMessage(error));
      continue;
    }

    diagnostics.push(
      ...replacementSafety(file, "ancestor", beforeText, beforeText),
      ...replacementSafety(file, "candidate", beforeText, afterText),
    );
    const beforeProjection: IProtectedProjection = project(
      beforeText,
      beforeBytes,
      ownership,
    );
    const afterProjection: IProtectedProjection = project(
      afterText,
      afterBytes,
      ownership,
    );
    projections.set(file, {
      before: beforeProjection,
      after: afterProjection,
    });

    if (!beforeProjection.bytes.equals(afterProjection.bytes)) {
      const offset: number = firstDifference(
        beforeProjection.bytes,
        afterProjection.bytes,
      );
      const beforeOffset: number = originalOffset(beforeProjection, offset);
      const afterOffset: number = originalOffset(afterProjection, offset);
      const beforeLocation: { line: number; column: number } = locate(
        beforeBytes,
        beforeOffset,
      );
      const afterLocation: { line: number; column: number } = locate(
        afterBytes,
        afterOffset,
      );
      diagnostics.push(
        `${file}: protected authored bytes changed at ancestor ${beforeLocation.line}:${beforeLocation.column} (byte ${beforeOffset}) and candidate ${afterLocation.line}:${afterLocation.column} (byte ${afterOffset}); use the clean ancestor and an ordinary authored change for body revisions.`,
      );
    }

    report.push({
      file,
      metadataChanged: !sameMetadata(
        beforeProjection.metadata,
        afterProjection.metadata,
      ),
      projectionSha256: crypto
        .createHash("sha256")
        .update(beforeProjection.bytes)
        .digest("hex"),
    });
  }

  const changedFiles: string[] = report
    .filter(
      (entry: IEvidenceMetadataRewriteFile): boolean => entry.metadataChanged,
    )
    .map((entry: IEvidenceMetadataRewriteFile): string => entry.file);
  const bulk: boolean = props.bulk === true || changedFiles.length > 1;
  const renderedSample: IEvidenceMetadataRenderedSample | undefined =
    validateRenderedSample(
      props.renderedSample,
      bulk,
      changedFiles,
      projections,
      diagnostics,
    );

  if (diagnostics.length !== 0)
    throw new Error(
      `Evidence metadata rewrite verification failed:\n${diagnostics
        .map((diagnostic: string): string => `- ${diagnostic}`)
        .join("\n")}`,
    );
  return {
    ownership,
    bulk,
    files: report,
    ...(renderedSample === undefined ? {} : { renderedSample }),
  };
}
