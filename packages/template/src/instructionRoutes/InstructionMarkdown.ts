import { projectAutoMovieMarkdownSyntax } from "@automovie/evidence";

/**
 * Own the instruction document's visible Markdown projection and anchor set.
 * Repeated headings receive the same numbered suffix as before, while explicit
 * anchors coexist with derived labels. Hidden code and HTML remain excluded
 * by the existing evidence-package syntax projection.
 */
export namespace InstructionMarkdown {
  /**
   * Project the document through the existing Markdown syntax owner so title
   * and anchor checks ignore hidden code and HTML consistently.
   */
  export const visibleLines = (markdown: string): readonly string[] => {
    return projectAutoMovieMarkdownSyntax({
      path: "instruction.md",
      source: markdown,
    }).visibleLines;
  };

  /**
   * Keep explicit anchors and deterministic labels of visible headings. Repeated
   * labels receive their original occurrence suffix; source order is retained.
   */
  export const anchors = (markdown: string): ReadonlySet<string> => {
    const anchors = new Set<string>();
    const occurrences = new Map<string, number>();
    for (const line of visibleLines(markdown)) {
      const match = /^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/u.exec(line);
      if (match === null) continue;
      const explicit = /\s+\{#([^{}\s]+)\}\s*$/u.exec(match[1]!)?.[1];
      if (explicit !== undefined) anchors.add(explicit);
      const heading = match[1]!
        .replace(/\s+\{#[^{}\s]+\}\s*$/u, "")
        .trim()
        .toLowerCase();
      const base = [...heading]
        .filter(
          (character) =>
            character === "_" ||
            character === "-" ||
            /\p{L}|\p{N}|\s/u.test(character),
        )
        .join("")
        .replace(/\s+/gu, "-");
      const occurrence = occurrences.get(base) ?? 0;
      occurrences.set(base, occurrence + 1);
      anchors.add(occurrence === 0 ? base : `${base}-${occurrence}`);
    }
    return anchors;
  };
}

