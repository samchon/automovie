import { markdownFiles } from "./markdownFiles";
import { normalizeFile } from "./normalizeFile";

/** Selects an explicit safe population or the complete Markdown union. */
export function selectFiles(
  beforeRoot: string,
  afterRoot: string,
  selected: string[] | undefined,
): string[] {
  const files: string[] =
    selected === undefined
      ? [
          ...new Set([
            ...markdownFiles(beforeRoot),
            ...markdownFiles(afterRoot),
          ]),
        ]
      : selected.map(normalizeFile);
  return [...new Set(files)].sort((left: string, right: string): number =>
    left.localeCompare(right),
  );
}
