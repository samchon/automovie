import { deflateRawSync } from "node:zlib";

/**
 * Build a minimal `.xlsx` archive in memory: a ZIP of the four XML parts a
 * sheet reader needs, with one worksheet named `sheet` at `xl/worksheets/`.
 *
 * `rows` maps a spreadsheet row number to `[reference, kind, value]` cells:
 * kind `n` is a number, `s` a shared string, `i` an inline string, `str` a
 * formula string, `b` a boolean, `e` an error and `empty` a cell with no value.
 * `omit` drops parts, `absoluteTarget` writes the sheet relation as an
 * absolute part name and `detached` leaves the sheet without a relation. The
 * parts are raw-deflated except `stored`, which are written uncompressed, so
 * a test reaches both ZIP methods. The CRC field is zero because the reader
 * under test locates parts by the central directory and does not verify it.
 */
export function createXlsxFixture(input: {
  sheet: string;
  rows: Record<
    number,
    [string, "n" | "s" | "i" | "str" | "b" | "e" | "empty", string | number][]
  >;
  shared: string[];
  stored?: string[];
  omit?: string[];
  absoluteTarget?: boolean;
  detached?: boolean;
}): Uint8Array {
  const rows = Object.entries(input.rows)
    .map(
      ([row, cells]) =>
        `<row r="${row}">${cells
          .map(([reference, kind, value]) =>
            kind === "i"
              ? `<c r="${reference}" t="inlineStr"><is><t>${value}</t></is></c>`
              : kind === "empty"
                ? `<c r="${reference}"/>`
                : `<c r="${reference}"${kind === "n" ? "" : ` t="${kind}"`}><v>${value}</v></c>`,
          )
          .join("")}</row>`,
    )
    .join("");
  const parts: [string, string][] = [
    [
      "xl/workbook.xml",
      `<workbook><sheets><sheet name="Other" sheetId="1" r:id="rId1"/><sheet name="${input.sheet}" sheetId="2" r:id="rId2"/></sheets></workbook>`,
    ],
    [
      "xl/_rels/workbook.xml.rels",
      `<Relationships><Relationship Id="rId1" Type="x" Target="worksheets/sheet1.xml"/><Relationship Id="${input.detached === true ? "rId9" : "rId2"}" Type="x" Target="${input.absoluteTarget === true ? "/xl/" : ""}worksheets/sheet2.xml"/></Relationships>`,
    ],
    [
      "xl/sharedStrings.xml",
      `<sst>${input.shared.map((text) => `<si><t>${text}</t></si>`).join("")}</sst>`,
    ],
    ["xl/worksheets/sheet1.xml", `<worksheet><sheetData/></worksheet>`],
    [
      "xl/worksheets/sheet2.xml",
      `<worksheet><sheetData>${rows}</sheetData></worksheet>`,
    ],
  ];
  const kept = parts.filter(([name]) => input.omit?.includes(name) !== true);
  const chunks: Buffer[] = [];
  const directory: Buffer[] = [];
  let offset = 0;
  for (const [name, text] of kept) {
    const raw = Buffer.from(text, "utf8");
    const method = input.stored?.includes(name) === true ? 0 : 8;
    const data = method === 0 ? raw : deflateRawSync(raw);
    const nameBytes = Buffer.from(name, "utf8");
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(method, 10);
    entry.writeUInt32LE(data.length, 20);
    entry.writeUInt32LE(raw.length, 24);
    entry.writeUInt16LE(nameBytes.length, 28);
    entry.writeUInt32LE(offset, 42);
    chunks.push(local, nameBytes, data);
    directory.push(entry, nameBytes);
    offset += local.length + nameBytes.length + data.length;
  }
  const central = Buffer.concat(directory);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(kept.length, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(offset, 16);
  return new Uint8Array(Buffer.concat([...chunks, central, end]));
}
