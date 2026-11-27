/*
 * Transclude a same-path root skill section into authored scaffold Markdown.
 */
export const transcludeMarkdownSection = {
  /*
   * Return the root skill path named by a section marker.
   * Parameter markdown: Authored scaffold Markdown.
   * Parameter scaffoldPath: The file path relative to the instructions layer.
   * Returns: The same repository-relative root path, or `null` without a marker.
   * When a marker appears outside a safe scaffold skill Markdown path.
   */
  sourcePath(markdown: string, scaffoldPath: string): string | null {
    if (markerLines(markdown).length === 0) return null;
    const normalized: string = scaffoldPath.replaceAll("\\", "/");
    const parts: string[] = normalized.split("/");
    if (
      parts[0] !== ".agents" ||
      parts[1] !== "skills" ||
      !normalized.endsWith(".md") ||
      parts.some((part: string): boolean => part === "" || part === "." || part === "..")
    )
      throw new Error(
        `section marker in "${scaffoldPath}" must be in a safe skill Markdown path`,
      );
    return normalized;
  },

  /*
   * Replace each standalone `## ${Continuing}` marker with the matching root
   * section, stopping at the next real H1 or H2 heading.
   * Parameter markdown: Authored scaffold Markdown.
   * Parameter scaffoldPath: The file path relative to the instructions layer.
   * Parameter sourceMarkdown: The same-path root Markdown file.
   * Returns: Markdown with each section marker expanded verbatim.
   * When the source lacks exactly one real `## Continuing` heading.
   */
  expand(
    markdown: string,
    scaffoldPath: string,
    sourceMarkdown: string,
  ): string {
    const sourceRelative: string | null = this.sourcePath(markdown, scaffoldPath);
    if (sourceRelative === null) return markdown;
    const sourceLines: string[] = splitLines(sourceMarkdown);
    const sourceHeadings: IHeading[] = headings(sourceLines);
    const sections: IHeading[] = sourceHeadings.filter(
      (heading: IHeading): boolean =>
        heading.level === 2 && heading.title === "Continuing",
    );
    if (sections.length !== 1)
      throw new Error(
        `section source "${sourceRelative}" must contain exactly one real "## Continuing" heading; found ${sections.length}`,
      );

    const start: IHeading = sections[0]!;
    const next: IHeading | undefined = sourceHeadings.find(
      (heading: IHeading): boolean =>
        heading.line > start.line && heading.level <= 2,
    );
    const section: string = sourceLines
      .slice(start.line, next?.line ?? sourceLines.length)
      .join("");
    const lines: string[] = splitLines(markdown);
    const sectionEndsWithLineBreak: boolean = /[\r\n]$/u.test(section);
    for (const marker of markerLines(markdown)) {
      const line: string = lines[marker]!;
      lines[marker] = sectionEndsWithLineBreak
        ? section
        : section + line.slice(lineContent(line).length);
    }
    return lines.join("");
  },
};

interface IHeading {
  line: number;
  level: number;
  title: string;
}

interface IFence {
  character: "`" | "~";
  length: number;
}

function markerLines(markdown: string): number[] {
  const lines: string[] = splitLines(markdown);
  const markers: number[] = [];
  let fence: IFence | null = null;
  for (let index: number = 0; index < lines.length; ++index) {
    const line: string = lineContent(lines[index]!);
    if (fence !== null) {
      if (closesFence(line, fence)) fence = null;
      continue;
    }
    const opened: IFence | null = opensFence(line);
    if (opened !== null) {
      fence = opened;
      continue;
    }
    if (/^ {0,3}## \$\{Continuing\}[ \t]*$/u.test(line))
      markers.push(index);
  }
  return markers;
}

function headings(lines: string[]): IHeading[] {
  const result: IHeading[] = [];
  let fence: IFence | null = null;
  for (let index: number = 0; index < lines.length; ++index) {
    const line: string = lineContent(lines[index]!);
    if (fence !== null) {
      if (closesFence(line, fence)) fence = null;
      continue;
    }
    const opened: IFence | null = opensFence(line);
    if (opened !== null) {
      fence = opened;
      continue;
    }
    const match: RegExpExecArray | null =
      /^ {0,3}(#{1,6})(?:[ \t]+(.*)|[ \t]*)$/u.exec(line);
    if (match !== null) {
      let title: string = (match[2] ?? "").trim();
      title = title.replace(/[ \t]+#+[ \t]*$/u, "").trim();
      result.push({ line: index, level: match[1]!.length, title });
      continue;
    }
    if (
      index === 0 ||
      /^ {0,3}(?:`{3,}|~{3,})/u.test(lineContent(lines[index - 1]!))
    )
      continue;
    const setext: RegExpExecArray | null =
      /^ {0,3}(=+|-+)[ \t]*$/u.exec(line);
    const previous: string = lineContent(lines[index - 1]!).trim();
    if (setext !== null && previous !== "")
      result.push({
        line: index - 1,
        level: setext[1]![0] === "=" ? 1 : 2,
        title: previous,
      });
  }
  return result;
}

function opensFence(line: string): IFence | null {
  const match: RegExpExecArray | null =
    /^ {0,3}(`{3,}|~{3,})(.*)$/u.exec(line);
  if (match === null) return null;
  const run: string = match[1]!;
  const character: "`" | "~" = run[0] as "`" | "~";
  if (character === "`" && match[2]!.includes("`")) return null;
  return { character, length: run.length };
}

function closesFence(line: string, fence: IFence): boolean {
  const match: RegExpExecArray | null =
    /^ {0,3}(`+|~+)[ \t]*$/u.exec(line);
  return (
    match !== null &&
    match[1]![0] === fence.character &&
    match[1]!.length >= fence.length
  );
}

function splitLines(text: string): string[] {
  const lines: string[] = [];
  let start: number = 0;
  for (let index: number = 0; index < text.length; ++index) {
    if (text[index] !== "\n" && text[index] !== "\r") continue;
    if (text[index] === "\r" && text[index + 1] === "\n") ++index;
    lines.push(text.slice(start, index + 1));
    start = index + 1;
  }
  if (start < text.length) lines.push(text.slice(start));
  return lines;
}

function lineContent(line: string): string {
  return line.replace(/(?:\r\n|\r|\n)$/u, "");
}
