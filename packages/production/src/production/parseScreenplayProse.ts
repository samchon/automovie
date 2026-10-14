import type { IAutoMovieParsedScreenplayScene } from "./IAutoMovieParsedScreenplayScene";
import { authoredScreenplayMarkdownLines } from "./authoredScreenplayMarkdownLines";
import { parseScreenplayAuthority } from "./parseScreenplayAuthority";

const HEADING: RegExp = /^#{1,6}[ \t]+(SCN-[A-Za-z0-9-]+)[ \t]+(?:\u2014|-|:)[ \t]+(.+?)[ \t]*$/u;

/**
 * Parse stable SCN heading sections and their explicit semantic carriers.
 *
 * @evidence contracts/common.md#principled-implementation A normalized authored-line scan starts each section at the supported SCN heading grammar, strips only explicit heading-anchor metadata and parses the complete bounded authority carrier before returning the section.
 * @evidence contracts/common.md#clear-and-simple-design Comment/fence selection, carrier grammar and semantic index diagnostics have separate owners; this parser owns only document section boundaries and heading identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A heading inside metadata/examples is ignored and body text is not used to invent timing, exact treatment coverage or semantic participants.
 * @evidence contracts/common.md#meaningful-documentation States SCN section selection, heading-anchor metadata and complete carrier parsing.
 * @evidence contracts/performance.md#efficient-algorithms For B characters and L lines, line admission and section construction scan O(B+L) data and retain O(B+L) parse strings/arrays; carrier parsing also scans each section once.
 * @evidence contracts/performance.md#reuse-equivalent-work One parse result provides headings, bodies and carriers to the semantic join; no cached result assumes mutable text is unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned sections own their strings/carrier references until the caller releases them; current section state is local and no file or task is opened.
 */
export function parseScreenplayProse(content: string): IAutoMovieParsedScreenplayScene[] {
  const scenes: IAutoMovieParsedScreenplayScene[] = [];
  let current:
    | {
        id: string;
        title: string;
        lines: string[];
      }
    | undefined;
  function push(): void {
    if (current === undefined) return;
    const parsed: ReturnType<typeof parseScreenplayAuthority> = parseScreenplayAuthority(current.lines);
    scenes.push({
      id: current.id,
      title: current.title,
      body: parsed.body,
      authority: parsed.authority,
      authorityErrors: parsed.errors,
    });
  }
  for (const line of authoredScreenplayMarkdownLines(content)) {
    const match: RegExpExecArray | null = HEADING.exec(line);
    if (match !== null) {
      push();
      current = {
        id: match[1]!,
        // An explicit Markdown id stabilizes evidence citations; it is
        // metadata on the heading, not part of the screenplay scene title.
        title: match[2]!.replace(/[ \t]+\{#[^{}\s]+\}[ \t]*$/u, "").trim(),
        lines: [],
      };
      continue;
    }
    if (current !== undefined) current.lines.push(line);
  }
  push();
  return scenes;
}
