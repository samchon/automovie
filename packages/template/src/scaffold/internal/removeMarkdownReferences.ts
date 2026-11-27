/*
 * Remove authored `@reference` notes without changing fenced Markdown samples.
 */
export const removeMarkdownReferences = {
  /*
   * Remove one-line `@reference` comments outside Markdown fences.
   */
  strip(markdown: string): string {
    const protectedLines: Map<string, string> = new Map();
    let index: number = 0;
    let fence: IFence | null = null;
    let protectedMarkdown: string = "";
    for (const line of markdown.split(/(?<=\n)/u)) {
      const content: string = lineContent(line);
      if (fence !== null) {
        if (REFERENCE_LINE.test(content)) {
          const token: string = `\u0000REFERENCE_${index++}\u0000`;
          protectedLines.set(token, line);
          protectedMarkdown += token;
        } else protectedMarkdown += line;
        if (closesFence(content, fence)) fence = null;
        continue;
      }
      const opened: IFence | null = opensFence(content);
      if (opened !== null) {
        fence = opened;
        protectedMarkdown += line;
      } else protectedMarkdown += line;
    }
    const stripped: string = protectedMarkdown.replace(
      /(?<=^|\n)(\r?\n)?<!-- @reference (?:(?!-->)[^\r\n])+ -->[ \t]*(?:\r?\n|$)(\r?\n)?/gu,
      (_: string, before?: string, after?: string): string =>
        before ?? after ?? "",
    );
    let restored: string = stripped;
    for (const [token, line] of protectedLines)
      restored = restored.replace(token, line);
    return restored;
  },
};

interface IFence {
  character: "`" | "~";
  length: number;
}

const REFERENCE_LINE: RegExp =
  /^<!-- @reference (?:(?!-->)[^\r\n])+ -->[ \t]*$/u;

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

function lineContent(line: string): string {
  return line.replace(/(?:\r\n|\r|\n)$/u, "");
}
