import { validateMetadata } from "./readAutoMovieContractRulesInternal/validateMetadata";
import fs from "node:fs";
import path from "node:path";
import { projectAutoMovieMarkdownSyntax } from "./projectAutoMovieMarkdownSyntax";
import type { IAutoMovieContractRule } from "./IAutoMovieContractRule";
import type { IAutoMovieContractRuleMetadata } from "./IAutoMovieContractRuleMetadata";


/**
 * Reads optional structured H2 rule metadata from a contract tree.
 *
 * Prose-only H2s remain valid. A `contract-rule` block, when present, is an exact machine route whose lifecycle state, safe application, timing, and source identity are all mandatory. Callers may name files where every H2 must carry metadata without turning the whole inherited corpus into a migration prerequisite.
 *
 *
 * @evidence contracts/common.md#principled-implementation Visible anchored H2s delimit optional immediate contract-rule JSON blocks; closed metadata fields, unique rule IDs and caller-selected required files are validated.
 * @evidence contracts/common.md#clear-and-simple-design Structured routing remains optional for ordinary prose contracts and explicit for selected complete-metadata files.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed or duplicate blocks and IDs refuse; native Markdown visibility excludes examples, while raw JSON block placement is checked within each selected H2 body.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes prose-only H2s, mandatory metadata fields and requireEveryH2In selection.
 * @evidence contracts/performance.md#efficient-algorithms For N visited filesystem entries, F Markdown files and R returned rules, traversal takes O(N) entry visits, sorting takes O(F log F) path comparisons and the ID map takes expected O(R) lookups; required paths are normalized once into a set. Per-file text work includes disjoint H2 body scans and the syntax projector's repeated comment slicing and heading searches, up to O(L+C L+C H) for L characters, C comments and H headings. The full inventory is needed for optional blocks and cross-file duplicate IDs; entry count, recursive depth and file bytes have no admission cap.
 * @evidence contracts/performance.md#reuse-equivalent-work One ID map covers all parsed rules; each file's visible headings and raw lines are shared within that file only.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The recursive walker retains pending directory-entry arrays along its call stack and the F-path result until parsing finishes; tree depth and this frontier have no explicit cap. One file's source, visible/raw lines and headings are parsing temporaries, while the R rule records and their strings transfer to the caller on return without a count or byte cap. Synchronous filesystem calls close their own handles on success or failure, and no watcher, background task or persistent cache is acquired.
 */
export function readAutoMovieContractRules(
  root: string,
  options: { requireEveryH2In?: readonly string[] } = {},
): readonly IAutoMovieContractRule[] {
  if (!fs.existsSync(root)) return [];
  const required: Set<string> = new Set(
    (options.requireEveryH2In ?? []).map((file: string) : string => normalizePath(file)),
  );
  const rules: IAutoMovieContractRule[] = markdownFiles(root).flatMap((file: string) : IAutoMovieContractRule[] =>
    rulesOfFile(
      root,
      file,
      required.has(normalizePath(path.relative(root, file))),
    ),
  );
  const identities: Map<string, string> = new Map<string, string>();
  for (const rule of rules) {
    const owner: string | undefined = identities.get(rule.metadata.id);
    if (owner !== undefined)
      throw new Error(
        `${rule.address}: duplicate contract rule id ${rule.metadata.id} already owned by ${owner}.`,
      );
    identities.set(rule.metadata.id, rule.address);
  }
  return rules;
}


/** Read structured rules from one Markdown file in visible H2 order. */
function rulesOfFile(
  root: string,
  file: string,
  required: boolean,
): IAutoMovieContractRule[] {
  const source: string = fs.readFileSync(file, "utf8");
  const visible: readonly string[] = projectAutoMovieMarkdownSyntax({
    path: file,
    source,
  }).visibleLines;
  const headings: { anchor: string; heading: string; line: number; }[] = visible
    .map((line: string, index: number) : { anchor: string; heading: string; line: number; } | null => {
      const match: RegExpExecArray | null = /^##(?!#)\s+(.+?)[ \t]+\{#([^{}\s]+)\}[ \t]*$/u.exec(line);
      return match === null
        ? null
        : { anchor: match[2]!, heading: match[1]!, line: index + 1 };
    })
    .filter(
      (heading: { anchor: string; heading: string; line: number; } | null): heading is { anchor: string; heading: string; line: number } =>
        heading !== null,
    );
  const rawLines: string[] = source.split(/\r\n|\r|\n/u);
  const relative: string = normalizePath(path.relative(root, file));
  return headings.flatMap((heading: { anchor: string; heading: string; line: number; }, index: number) : { address: string; anchor: string; heading: string; file: string; metadata: IAutoMovieContractRuleMetadata; }[] => {
    const end: number = headings[index + 1]?.line ?? rawLines.length + 1;
    const body: string = rawLines.slice(heading.line, end - 1).join("\n");
    const openings: RegExpExecArray[] = [...body.matchAll(/^ {0,3}```contract-rule[ \t]*$/gmu)];
    if (openings.length > 1)
      throw new Error(
        `${relative}#${heading.anchor}: an H2 may declare only one contract-rule JSON block.`,
      );
    const block: RegExpExecArray | null =
      /^\s*```contract-rule[ \t]*\n(?<json>[\s\S]*?)\n```[ \t]*(?:\n|$)/u.exec(
        body,
      );
    if (block?.groups?.json === undefined) {
      if (openings.length !== 0)
        throw new Error(
          `${relative}#${heading.anchor}: a contract-rule JSON block must immediately follow its H2.`,
        );
      if (required)
        throw new Error(
          `${relative}#${heading.anchor}: every selected H2 requires an immediate contract-rule JSON block.`,
        );
      return [];
    }
    let decoded: unknown;
    try {
      decoded = JSON.parse(block.groups.json);
    } catch {
      throw new Error(
        `${relative}#${heading.anchor}: contract-rule metadata must be valid JSON.`,
      );
    }
    return [
      {
        address: `${relative}#${heading.anchor}`,
        anchor: heading.anchor,
        heading: heading.heading.trim(),
        file: relative,
        metadata: validateMetadata(decoded, `${relative}#${heading.anchor}`),
      },
    ];
  });
}


/** Walk Markdown files without following symlinked entries. */
function markdownFiles(root: string): string[] {
  const output: string[] = [];
  const visit: (directory: string) => void = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target: string = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(target);
      else if (entry.isFile() && entry.name.endsWith(".md"))
        output.push(target);
    }
  };
  visit(root);
  return output.sort(compareCodeUnits);
}


/** Normalize one public path identity to POSIX separators. */
function normalizePath(value: string): string {
  return value.replaceAll("\\", "/");
}


/** Sort independent of host locale and ICU data. */
function compareCodeUnits(left: string, right: string): number {
  return Number(left > right) - Number(left < right);
}
