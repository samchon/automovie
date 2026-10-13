import crypto from "node:crypto";
import { parseAutoMovieEvidenceSyntax } from "./parseAutoMovieEvidenceSyntax";
import { projectAutoMovieAuthoredMarkdown } from "./projectAutoMovieAuthoredMarkdown";
import type { IAutoMoviePopulationTransitionHost } from "./IAutoMoviePopulationTransitionHost";
import type { IAutoMovieRetainedPilotHost } from "./IAutoMovieRetainedPilotHost";
import { normalizeRelativePath } from "./AutoMoviePopulationTransitionInternal/normalizeRelativePath";




/**
 * Hash the authored body and ordered native evidence declarations of one retained pilot host separately with SHA-256.
 *
 * The supplied path must already be normalized and project-relative; aliases throw instead of being repaired. Markdown and TypeScript use their own native carrier projections. This operation reads the supplied source string and never opens the named file.
 *
 * The body digest hashes UTF-8 encoded projected text rather than original file bytes. The declaration digest hashes parser-projected annotation text in order, joined by newlines; comment decoration and wrapped rows are normalized. These identities detect changes in their respective projections without certifying semantic quality or a historical review pass.
 *
 * @evidence contracts/common.md#principled-implementation The path is admitted as normalized relative identity, authored body is projected by its Markdown or TypeScript carrier grammar, and SHA-256 separately hashes that body and ordered native annotation text.
 * @evidence contracts/common.md#clear-and-simple-design One producer defines the receipt host denominator used both when recording a pilot and when comparing current reset hosts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only structural evidence metadata is projected out; arbitrary comments and authored code remain part of body identity, and path aliases refuse instead of being normalized into a trusted address.
 * @evidence contracts/common.md#meaningful-documentation The comment states the two digest denominators, normalized path requirement and that hashing uses complete supplied source without opening the named file.
 * @evidence contracts/performance.md#efficient-algorithms For L source characters, parsing and hashing require full-source work, while Markdown body removal can copy O(C L) characters for C structural comments and native annotation projection can add O(C L + C H) work for H headings. TypeScript annotation line lookup can add O(A L) scans for A annotations, and body projection parses the source again; the complete identity operation is therefore not strictly linear in L and temporarily retains source-sized arrays or strings.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned identity is what recording and reset validation share; body projection and annotation extraction currently parse the same source separately, a remaining repeated parse rather than a claimed cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only path and two hexadecimal digest strings escape; source, parser nodes and projection arrays remain call-local and no file handle is opened.
 */
export function createAutoMovieRetainedPilotHost(
  host: IAutoMoviePopulationTransitionHost,
): IAutoMovieRetainedPilotHost {
  const normalizedPath: string = normalizeRelativePath(host.path);
  const body: string = normalizedPath.endsWith(".md")
    ? projectAutoMovieAuthoredMarkdown(host.source)
    : projectTypeScriptAuthoredBody(normalizedPath, host.source);
  const annotations: ReturnType<typeof parseAutoMovieEvidenceSyntax> = parseAutoMovieEvidenceSyntax({
    path: normalizedPath,
    source: host.source,
  });
  return {
    path: normalizedPath,
    bodySha256: digest(body),
    evidenceTagSha256: digest(
      annotations.map((annotation: ReturnType<typeof parseAutoMovieEvidenceSyntax>[number]) : string => annotation.text).join("\n"),
    ),
  };
}




/** Remove only structural evidence rows from TypeScript documentation. */
function projectTypeScriptAuthoredBody(file: string, source: string): string {
  const ranges: ReturnType<typeof parseAutoMovieEvidenceSyntax> = parseAutoMovieEvidenceSyntax({ path: file, source });
  if (ranges.length === 0) return source;
  const lines: string[] = source.match(/[^\r\n]*(?:\r\n|\r|\n|$)/gu) ?? [];
  for (const range of ranges)
    for (let line: number = range.line; line <= range.endLine; line++) {
      const raw: string = lines[line - 1]!;
      const ending: string = /(?:\r\n|\r|\n)$/u.exec(raw)?.[0] ?? "";
      const content: string = raw.slice(0, raw.length - ending.length);
      const start: number =
        line === range.line
          ? content.indexOf("@evidence")
          : (/^(?:\s*\*\s?)/u.exec(content)?.[0].length ?? 0);
      const close: number = content.indexOf("*/", Math.max(start, 0));
      const end: number =
        line === range.endLine && close !== -1 ? close : content.length;
      lines[line - 1] =
        `${content.slice(0, start)}${content.slice(end)}${ending}`;
    }
  return lines.join("");
}




/** Compute one lowercase SHA-256 identity. */
function digest(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}
