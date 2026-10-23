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
