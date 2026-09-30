/**
 * Read comma-separated text with a header row into one record per data row.
 *
 * The survey and archive tables this package derives norms from are plain
 * RFC 4180 files: a double quote opens a field that may hold commas, quotes
 * (doubled) and line breaks, and a row ends at a line break. Every value stays
 * a string, so the caller owns which columns are numbers. A blank line is not
 * a record. A row shorter than the header leaves its missing columns out, and
 * a longer one refuses, because either means the file is not the table the
 * caller named. Pure; the caller decodes the bytes (the ANSUR II files are
 * Latin-1).
 */
export function readCsvRecords(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const endField = (): void => {
    row.push(field);
    field = "";
  };
  const endRow = (): void => {
    endField();
    if (row.length !== 1 || row[0] !== "") rows.push(row);
    row = [];
  };
  for (let index = 0; index < text.length; ++index) {
    const character = text[index]!;
    if (quoted) {
      if (character !== '"') field += character;
      else if (text[index + 1] === '"') {
        field += '"';
        ++index;
      } else quoted = false;
    } else if (character === '"') quoted = true;
    else if (character === ",") endField();
    else if (character === "\n") endRow();
    else if (character !== "\r") field += character;
  }
  if (quoted) throw new Error("The CSV ends inside a quoted field.");
  if (field !== "" || row.length !== 0) endRow();
  const [header, ...body] = rows;
  if (header === undefined) return [];
  return body.map((values) => {
    if (values.length > header.length)
      throw new Error("A CSV row has more fields than the header.");
    return Object.fromEntries(
      values.map((value, column) => [header[column]!, value]),
    );
  });
}
