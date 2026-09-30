import { inflateRawSync } from "node:zlib";

/** One spreadsheet cell as a value: text, a number or an empty cell. */
export type XlsxCell = string | number | null;

/**
 * Read one worksheet of an `.xlsx` workbook into dense rows, without a
 * spreadsheet library.
 *
 * An `.xlsx` file is a ZIP archive of XML parts, and a workbook this package
 * reads (the International Skin Spectra Archive) needs only four of them: the
 * workbook part that names the sheets, its relationships, the shared-string
 * table and the sheet. The ZIP central directory (found from the end of the
 * file) locates each part, and the parts are stored or raw-deflated.
 *
 * Row `n` of the result is spreadsheet row `n + 1`, so a gap in the sheet is
 * an empty row and a caller indexes rows exactly as the sheet numbers them;
 * within a row, column `A` is index 0 and an absent cell is `null`. A cell of
 * type shared or inline string is text, a boolean or error cell is refused
 * (no table here holds one), and every other cell is the number it stores.
 * The sheet must exist by name. Pure over the archive's bytes.
 */
export function readXlsxSheet(bytes: Uint8Array, sheet: string): XlsxCell[][] {
  const parts = readZipParts(bytes);
  const part = (name: string): string => {
    const found = parts.get(name);
    if (found === undefined) throw new Error(`The workbook has no ${name}.`);
    return found.toString("utf8");
  };
  const workbook = part("xl/workbook.xml");
  const declared = [...workbook.matchAll(/<sheet\b[^>]*>/g)]
    .map((match) => match[0])
    .find((tag) => attribute(tag, "name") === sheet);
  if (declared === undefined)
    throw new Error(`The workbook has no sheet named ${sheet}.`);
  const relation = [...part("xl/_rels/workbook.xml.rels").matchAll(
    /<Relationship\b[^>]*>/g,
  )]
    .map((match) => match[0])
    .find((tag) => attribute(tag, "Id") === attribute(declared, "r:id"));
  if (relation === undefined)
    throw new Error(`The workbook does not locate the sheet ${sheet}.`);
  const target = attribute(relation, "Target")!;
  const shared = parts.has("xl/sharedStrings.xml")
    ? [...part("xl/sharedStrings.xml").matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map(
        (match) => readText(match[1]!),
      )
    : [];
  const xml = part(
    target.startsWith("/") ? target.slice(1) : `xl/${target}`,
  );
  const rows: XlsxCell[][] = [];
  for (const row of xml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const number = Number(attribute(row[1]!, "r"));
    const cells: XlsxCell[] = [];
    for (const cell of row[2]!.matchAll(
      /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g,
    )) {
      const reference = attribute(cell[1]!, "r")!;
      const column = columnIndex(reference);
      const body = cell[2] ?? "";
      const type = attribute(cell[1]!, "t");
      const value = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];
      let result: XlsxCell = null;
      if (type === "inlineStr") result = readText(body);
      else if (value === undefined) result = null;
      else if (type === "s") result = shared[Number(value)]!;
      else if (type === "str") result = decode(value);
      else if (type === "b" || type === "e")
        throw new Error(`Cell ${reference} holds a ${type} value.`);
      else result = Number(value);
      while (cells.length < column) cells.push(null);
      cells[column] = result;
    }
    while (rows.length < number - 1) rows.push([]);
    rows[number - 1] = cells;
  }
  return rows;
}

function attribute(tag: string, name: string): string | undefined {
  const match = new RegExp(String.raw`\s${name}="([^"]*)"`).exec(tag);
  return match === null ? undefined : decode(match[1]!);
}

function readText(xml: string): string {
  return [...xml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
    .map((match) => decode(match[1]!))
    .join("");
}

function decode(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, "&");
}

/** Zero-based column of a reference such as `AB12` (`A` is 0, `AA` is 26). */
function columnIndex(reference: string): number {
  const letters = /^[A-Z]+/.exec(reference)![0];
  return (
    [...letters].reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) -
    1
  );
}

function readZipParts(bytes: Uint8Array): Map<string, Buffer> {
  const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = buffer.length - 22;
  while (end >= 0 && buffer.readUInt32LE(end) !== 0x06054b50) --end;
  if (end < 0) throw new Error("The file is not a ZIP archive.");
  const count = buffer.readUInt16LE(end + 10);
  let cursor = buffer.readUInt32LE(end + 16);
  const parts = new Map<string, Buffer>();
  for (let entry = 0; entry < count; ++entry) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50)
      throw new Error("The ZIP central directory is damaged.");
    const method = buffer.readUInt16LE(cursor + 10);
    const size = buffer.readUInt32LE(cursor + 20);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const local = buffer.readUInt32LE(cursor + 42);
    const name = buffer.toString("utf8", cursor + 46, cursor + 46 + nameLength);
    const start =
      local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    const data = buffer.subarray(start, start + size);
    if (method !== 0 && method !== 8)
      throw new Error(`The ZIP part ${name} uses compression ${method}.`);
    parts.set(name, method === 0 ? data : inflateRawSync(data));
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return parts;
}
