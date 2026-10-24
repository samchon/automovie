import type { IEvidenceHeading } from "./IEvidenceHeading";
import type { IEvidenceSection } from "./IEvidenceSection";
import { declarationKind } from "./declarationKind";
import { evidenceHeading } from "./evidenceHeading";
import { flatFingerprintStart } from "./flatFingerprintStart";
import { isDeclaration } from "./isDeclaration";
import { withoutEnding } from "./withoutEnding";

/**
 * Recognizes a pure evidence block, retaining each heading reason's boundary.
 *
 * @evidence contracts/common.md#principled-implementation A line-state parser accepts pure evidence blocks, closes fenced examples and requires genuine section reasons.
 * @evidence contracts/common.md#clear-and-simple-design Pending-section and fence states expose original reason boundaries to projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Indented examples and subheadings cannot supply missing reasons; malformed blocks return undefined.
 * @evidence contracts/common.md#meaningful-documentation The comment states pure-block recognition; results bound original source lines.
 * @evidence contracts/performance.md#efficient-algorithms One pass covers requested lines and their characters with one result per accepted section and current parser state.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared grammars are reused; each block needs its own boundary and fence analysis.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Call-local states expire at completion; the returned section array is caller-owned.
 */
export function evidenceSections(
  lines: string[],
  start: number,
  end: number,
): IEvidenceSection[] | undefined {
  const sections: IEvidenceSection[] = [];
  let pending:
    | (IEvidenceSection & { level: number; reason: boolean })
    | undefined;
  let fence: { character: string; length: number } | undefined;
  const flush: () => boolean = (): boolean => {
    if (pending === undefined) return true;
    if (!pending.reason || fence !== undefined) return false;
    sections.push({
      start: pending.start,
      end: pending.end,
      kind: pending.kind,
      ...(pending.fingerprintStart === undefined
        ? {}
        : { fingerprintStart: pending.fingerprintStart }),
    });
    pending = undefined;
    return true;
  };
  for (let index: number = start; index < end; index += 1) {
    const content: string = withoutEnding(lines[index]);
    const line: string = content.trim();
    if (line.includes("<!--") || line.includes("-->")) return undefined;
    if (fence !== undefined) {
      if (
        new RegExp(
          `^ {0,3}${fence.character}{${fence.length},}\\s*$`,
          "u",
        ).test(content)
      )
        fence = undefined;
      pending!.end = index + 1;
      continue;
    }
    const marker: RegExpExecArray | null = /^ {0,3}(`{3,}|~{3,})(.*)$/u.exec(
      content,
    );
    if (marker !== null) {
      if (pending === undefined) return undefined;
      fence = { character: marker[1][0], length: marker[1].length };
      pending.end = index + 1;
      continue;
    }
    if (line === "") continue;
    const indented: boolean = /^(?: {4}|\t)/u.test(content);
    const heading: IEvidenceHeading | undefined = indented
      ? undefined
      : evidenceHeading(line);
    if (heading !== undefined) {
      if (!flush()) return undefined;
      pending = {
        start: index,
        end: index + 1,
        level: heading.level,
        kind: heading.kind,
        reason: heading.reason !== "",
        ...(heading.fingerprintStart === undefined
          ? {}
          : { fingerprintStart: heading.fingerprintStart }),
      };
      continue;
    }
    if (!indented && isDeclaration(line)) {
      if (!flush()) return undefined;
      const fingerprintStart: number | undefined = flatFingerprintStart(line);
      sections.push({
        start: index,
        end: index + 1,
        kind: declarationKind(line)!,
        ...(fingerprintStart === undefined ? {} : { fingerprintStart }),
      });
      continue;
    }
    const ordinaryHeading: RegExpExecArray | null = indented
      ? null
      : /^(#{1,6})(?:\s|$)/u.exec(line);
    if (
      pending === undefined ||
      (!indented && line.startsWith("@")) ||
      (ordinaryHeading !== null && ordinaryHeading[1].length <= pending.level)
    )
      return undefined;
    pending.end = index + 1;
    // Examples and subheadings may accompany a reason but cannot supply it.
    if (!indented && ordinaryHeading === null) pending.reason = true;
  }
  return flush() && sections.length !== 0 ? sections : undefined;
}
