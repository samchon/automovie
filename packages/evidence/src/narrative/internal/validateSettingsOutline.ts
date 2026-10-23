import fs from "node:fs";
import path from "node:path";

import { readSettingsFiles } from "./readSettingsFiles";
import { settingsEntryAnchor } from "./settingsEntryAnchor";

/**
 * Checks that the outline describes the numbered canon in its actual order.
 *
 * Entry anchors encode the relative file path and entry labels equal the H1. This checks
 * the authored layout, not evidence rows: the graph owns citation cardinality
 * and the semantic reviewer owns whether grouping and explanations work.
 *
 * @evidence contracts/common.md#principled-implementation The outline's structural headings are matched sequentially against numbered canon paths and each file's single H1; path-encoded anchors and exact titles enforce one ordered entry per canon file without judging semantic grouping.
 * @evidence contracts/common.md#clear-and-simple-design The validator owns settings index topology, leaving citation cardinality to the graph and grouping quality to independent review.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty outline parts, missing/extra/reordered entries and title/anchor differences fail directly; comments and fenced examples are inert structural material for every input.
 * @evidence contracts/common.md#meaningful-documentation The prose states path-derived anchors, H1 label equality, actual order and boundaries between topology, graph evidence and semantic review.
 * @evidence contracts/performance.md#efficient-algorithms Canon enumeration sorts entries, then the outline and each referenced file are read/parsed once; cost grows with entry sorting and total Markdown characters. Arrays retain parsed headings and paths, and the active document bytes are bounded by each read rather than an external fixed cap.
 * @evidence contracts/performance.md#reuse-equivalent-work The ordered canon list is reused for all outline entries, while each matched file is read once; no cross-call cache is safe because canon bytes and topology are mutable.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All strings, heading arrays and path collections are local and released on completion/failure; synchronous readFileSync calls own no retained descriptor or asynchronous task.
 */
export function validateSettingsOutline(location: string): void {
  const root: string = path.join(location, "docs/body/settings");
  const target: string = path.join(root, "outline/index.md");
  if (!fs.existsSync(target))
    throw new Error(`${target}: settings outline is required.`);
  const files: string[] = readSettingsFiles(root).filter(
    (file: string): boolean =>
      /(?:^|\/)[0-9]{3}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/u.test(file),
  );
  const outline: RegExpExecArray[] = headings(fs.readFileSync(target, "utf8"));
  if (
    outline[0]?.[1] !== "#" ||
    outline.filter((item: RegExpExecArray): boolean => item[1] === "#")
      .length !== 1
  )
    throw new Error(`${target}: the outline must start with one H1.`);
  let part: boolean = false;
  let entries: number = 0;
  let cursor: number = 0;
  for (const heading of outline.slice(1)) {
    if (heading[1] === "##") {
      if (part && entries === 0)
        throw new Error(`${target}: an outline part is empty.`);
      part = true;
      entries = 0;
    } else if (heading[1] === "###") {
      if (!part)
        throw new Error(`${target}: an outline entry needs an H2 part.`);
      const match: RegExpExecArray | null = /^(.*?)\s+\{#([a-z0-9-]+)\}$/u.exec(
        heading[2],
      );
      const file: string = files[cursor];
      if (
        !match ||
        file === undefined ||
        settingsEntryAnchor(file) !== match[2]
      )
        throw new Error(
          `${target}: outline entries must match every numbered file once, in file order.`,
        );
      const canon: RegExpExecArray[] = headings(
        fs.readFileSync(path.join(root, file), "utf8"),
      );
      const title: string = canon[0]?.[2].replace(
        /\s+\{#[A-Za-z0-9_-]+\}$/u,
        "",
      );
      if (
        canon[0]?.[1] !== "#" ||
        canon.filter((item: RegExpExecArray): boolean => item[1] === "#")
          .length !== 1 ||
        title !== match[1]
      )
        throw new Error(
          `${target}: ${file} entry title must equal its single H1.`,
        );
      ++cursor;
      ++entries;
    } else
      throw new Error(
        `${target}: outline structure uses H2 parts and H3 file entries.`,
      );
  }
  if (!part || entries === 0)
    throw new Error(`${target}: an outline part is empty.`);
  if (cursor !== files.length)
    throw new Error(
      `${target}: outline entries must match every numbered file once, in file order.`,
    );
}

/**
 * Reads structural ATX headings while keeping comments and fenced examples inert.
 *
 * A leading byte order mark is dropped first, as the binder does when it trims
 * a file, so both readers accept the same authored bytes.
 *
 * Principled implementation: A line-state parser masks HTML comments and compatible fences before recognizing ATX headings; stripping an initial BOM keeps its first-heading interpretation aligned with authored binder trimming.
 * Clear and simple design: The local parser exists for outline structure only, returning heading captures without rewriting the source or replacing graph evidence extraction.
 * Prohibited implementation shortcuts: BOM and fenced/comment examples follow supported Markdown input rules for every document; no title or expected outline entry is injected.
 * Meaningful documentation: The prose explains example/comment inertness and the leading BOM premise; returned regexp groups retain heading depth and raw title for the validator.
 * Efficient algorithms: Line splitting and forward state scans visit Markdown text; accumulated visible fragments and regexp captures consume space proportional to input/headings. Repeated string concatenation relies on runtime string handling and claims no measured linear speedup.
 * Reuse equivalent work: One pass handles comments and fences together for a document; the pure parser coordinates no cross-request work or filesystem effects.
 * Bound retention and release resources: Line, visible-text and capture arrays are local or caller-owned at return; no persistent state, descriptor or task is retained.
 */
function headings(markdown: string): RegExpExecArray[] {
  let comment: boolean = false;
  let fence: string = "";
  let fenceLength: number = 0;
  const result: RegExpExecArray[] = [];
  for (const line of markdown.replace(/^\uFEFF/u, "").split(/\r?\n/u)) {
    if (fence !== "") {
      const close: RegExpExecArray | null = /^ {0,3}(`{3,}|~{3,})\s*$/u.exec(
        line,
      );
      if (close && close[1][0] === fence && close[1].length >= fenceLength)
        fence = "";
      continue;
    }
    let visible: string = "";
    for (let index: number = 0; index < line.length; ) {
      if (comment) {
        const end: number = line.indexOf("-->", index);
        if (end < 0) break;
        visible += " ".repeat(end + 3 - index);
        index = end + 3;
        comment = false;
      } else {
        const start: number = line.indexOf("<!--", index);
        if (start < 0) {
          visible += line.slice(index);
          break;
        }
        visible += line.slice(index, start) + "    ";
        index = start + 4;
        comment = true;
      }
    }
    const open: RegExpExecArray | null = /^ {0,3}(`{3,}|~{3,})(.*)$/u.exec(
      visible,
    );
    if (open && !(open[1][0] === "`" && open[2].includes("`"))) {
      fence = open[1][0];
      fenceLength = open[1].length;
      continue;
    }
    const heading: RegExpExecArray | null = /^(#{1,6}) (.+?)\s*$/u.exec(
      visible,
    );
    if (heading) result.push(heading);
  }
  return result;
}
