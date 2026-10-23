import type { EvidenceMetadataRewriteOwnership } from "../../EvidenceMetadataRewriteOwnership";
import type { EvidenceDeclarationKind } from "./EvidenceDeclarationKind";
import type { IEvidenceSection } from "./IEvidenceSection";
import type { IMetadataFragment } from "./IMetadataFragment";
import type { IProjectionSegment } from "./IProjectionSegment";
import type { IProtectedProjection } from "./IProtectedProjection";
import { declarationKind } from "./declarationKind";
import { evidenceSections } from "./evidenceSections";
import { findClose } from "./findClose";
import { flatFingerprintStart } from "./flatFingerprintStart";
import { lineEnding } from "./lineEnding";
import { singleLineDeclaration } from "./singleLineDeclaration";
import { withoutEnding } from "./withoutEnding";

/**
 * Removes only the declared metadata ownership and records source mappings.
 *
 * @evidence contracts/common.md#principled-implementation Parse lines and grammar-valid evidence blocks, remove only declared ownership and record source byte spans for protected fragments.
 * @evidence contracts/common.md#clear-and-simple-design Recognition helpers separate metadata grammar from projection and original-coordinate mappings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fences, indentation and malformed comments stay protected; identical tokens outside review syntax gain no ownership.
 * @evidence contracts/common.md#meaningful-documentation The comment states ownership-only removal; result members identify preserved bytes, removed fragments and source locations.
 * @evidence contracts/performance.md#efficient-algorithms Line splitting, encoding and concatenation scale with bytes; malformed opener lookahead can rescan blocks, so worst-case time is not guaranteed linear.
 * @evidence contracts/performance.md#reuse-equivalent-work One returned projection serves equality, hashing, mismatch locations and sample validation within verification.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Buffers, metadata and mappings scale with input; the projection retains the supplied original Buffer by reference and opens no handles.
 */
export function project(
  markdown: string,
  original: Buffer,
  ownership: EvidenceMetadataRewriteOwnership,
): IProtectedProjection {
  const lines: string[] = markdown.match(/[^\r\n]*(?:\r\n|\r|\n|$)/gu) ?? [];
  if (lines.at(-1) === "") lines.pop();
  const chunks: Buffer[] = [];
  const declarations: Map<number, string> = new Map<number, string>();
  const metadata: IMetadataFragment[] = [];
  const segments: IProjectionSegment[] = [];
  let originalStart: number = 0;
  let projectedStart: number = 0;
  let fence: { character: "`" | "~"; length: number } | undefined;

  const protect: (fragment: string) => void = (fragment: string): void => {
    if (fragment === "") return;
    const chunk: Buffer = Buffer.from(fragment, "utf8");
    chunks.push(chunk);
    segments.push({ originalStart, projectedStart, length: chunk.length });
    originalStart += chunk.length;
    projectedStart += chunk.length;
  };

  const projectDeclaration: (
    line: string,
    declaration: string,
    kind: EvidenceDeclarationKind,
    fingerprintOffset?: number,
  ) => void = (
    line: string,
    declaration: string,
    kind: EvidenceDeclarationKind,
    fingerprintOffset?: number,
  ): void => {
    const content: string = withoutEnding(line);
    const declarationStart: number = content.indexOf(declaration);
    const owned: boolean =
      (ownership === "acknowledgements" && kind === "acknowledgement") ||
      (ownership === "reviews" && kind === "review");
    if (owned) {
      protect(content.slice(0, declarationStart));
      metadata.push({ projectedStart, text: declaration });
      originalStart += Buffer.byteLength(declaration, "utf8");
      protect(
        content.slice(declarationStart + declaration.length) + lineEnding(line),
      );
      return;
    }
    if (ownership === "fingerprints" && kind === "review") {
      const fingerprintStart: number = declarationStart + fingerprintOffset!;
      const fingerprint: string = content.slice(
        fingerprintStart,
        fingerprintStart + 8,
      );
      protect(content.slice(0, fingerprintStart));
      metadata.push({ projectedStart, text: fingerprint });
      originalStart += Buffer.byteLength(fingerprint, "utf8");
      protect(
        content.slice(fingerprintStart + fingerprint.length) + lineEnding(line),
      );
      return;
    }
    protect(line);
  };

  for (let index: number = 0; index < lines.length; index += 1) {
    const line: string = lines[index];
    const content: string = withoutEnding(line);
    const fenceMarker: RegExpExecArray | null =
      /^ {0,3}(`{3,}|~{3,})(.*)$/u.exec(content);
    if (fence !== undefined) {
      protect(line);
      if (
        fenceMarker !== null &&
        fenceMarker[1][0] === fence.character &&
        fenceMarker[1].length >= fence.length &&
        fenceMarker[2].trim() === ""
      )
        fence = undefined;
      continue;
    }
    if (fenceMarker !== null) {
      fence = {
        character: fenceMarker[1][0] as "`" | "~",
        length: fenceMarker[1].length,
      };
      protect(line);
      continue;
    }
    if (/^(?: {4}|\t)/u.test(content)) {
      protect(line);
      continue;
    }
    const trimmed: string = content.trim();
    const singleDeclaration: string | undefined =
      singleLineDeclaration(trimmed);
    if (singleDeclaration !== undefined) {
      if (ownership !== "comments") {
        declarations.set(index + 1, singleDeclaration);
        projectDeclaration(
          line,
          singleDeclaration,
          declarationKind(singleDeclaration)!,
          flatFingerprintStart(singleDeclaration),
        );
        continue;
      }
      const opening: number = content.indexOf("<!--");
      const closing: number = content.lastIndexOf("-->") + 3;
      const comment: string = content.slice(opening, closing);
      protect(content.slice(0, opening));
      declarations.set(index + 1, singleDeclaration);
      metadata.push({ projectedStart, text: comment });
      originalStart += Buffer.byteLength(comment, "utf8");
      protect(content.slice(closing) + lineEnding(line));
      continue;
    }
    if (trimmed === "<!--") {
      const close: number = findClose(lines, index + 1);
      const sections: IEvidenceSection[] | undefined =
        close !== -1 && withoutEnding(lines[close]).trim() === "-->"
          ? evidenceSections(lines, index + 1, close)
          : undefined;
      if (sections !== undefined) {
        if (ownership !== "comments") {
          protect(line);
          let current: number = index + 1;
          for (const section of sections) {
            while (current < section.start) protect(lines[current++]);
            const fragment: string = lines
              .slice(section.start, section.end)
              .join("");
            const declaration: string = withoutEnding(fragment).trim();
            declarations.set(section.start + 1, declaration);
            projectDeclaration(
              fragment,
              declaration,
              section.kind,
              section.fingerprintStart,
            );
            current = section.end;
          }
          while (current < close) protect(lines[current++]);
          protect(lines[close]);
          index = close;
          continue;
        }
        const opening: number = content.indexOf("<!--");
        const closingLine: string = lines[close];
        const closingContent: string = withoutEnding(closingLine);
        const closing: number = closingContent.lastIndexOf("-->") + 3;
        const comment: string =
          line.slice(opening) +
          lines.slice(index + 1, close).join("") +
          closingContent.slice(0, closing);
        protect(content.slice(0, opening));
        metadata.push({ projectedStart, text: comment });
        for (const section of sections) {
          const declaration: string = withoutEnding(
            lines.slice(section.start, section.end).join(""),
          ).trim();
          declarations.set(section.start + 1, declaration);
        }
        originalStart += Buffer.byteLength(comment, "utf8");
        protect(closingContent.slice(closing) + lineEnding(closingLine));
        index = close;
        continue;
      }
    }

    // An ordinary or malformed comment cannot expose nested examples as tags.
    const opening: number = content.indexOf("<!--");
    if (opening !== -1) {
      const close: number =
        content.indexOf("-->", opening + 4) !== -1
          ? index
          : findClose(lines, index + 1);
      const end: number = close === -1 ? lines.length - 1 : close;
      while (index < end) protect(lines[index++]);
      protect(lines[index]);
      continue;
    }

    protect(line);
  }
  return {
    bytes: Buffer.concat(chunks),
    declarations,
    metadata,
    original,
    segments,
  };
}
