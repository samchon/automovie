import { invalidDesignReferenceContainer } from "./invalidDesignReferenceContainer";

/**
 * Admit DXF group-code/value records only when named sections close and one terminal EOF owns the end of the drawing. It derives no geometric extent.
 */
export const inspectDesignReferenceDxf = (path: string, text: string): boolean => {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  if (lines.at(-1) === "") lines.pop();
  const candidate = lines.some(
    (line) =>
      trimDxfField(line) === "SECTION" || trimDxfField(line) === "$ACADVER",
  );
  if (!candidate) return false;
  if (lines.length % 2 !== 0)
    throw invalidDesignReferenceContainer(path, "DXF", "records", "a group code has no value");
  const records: Array<readonly [number, string]> = [];
  for (let index = 0; index < lines.length; index += 2) {
    const spelling = trimDxfField(lines[index]!);
    const code = Number(spelling);
    if (!/^\d+$/.test(spelling) || !Number.isInteger(code) || code > 1071)
      throw invalidDesignReferenceContainer(
        path,
        "DXF",
        "records",
        `invalid group code at line ${index + 1}`,
      );
    records.push([code, trimDxfField(lines[index + 1]!)]);
  }
  let cursor = 0;
  let sections = 0;
  while (
    cursor < records.length &&
    records[cursor]![0] === 0 &&
    records[cursor]![1] === "SECTION"
  ) {
    if (records[cursor + 1]?.[0] !== 2 || records[cursor + 1]![1] === "")
      throw invalidDesignReferenceContainer(
        path,
        "DXF",
        "section",
        "SECTION is missing its name record",
      );
    sections += 1;
    cursor += 2;
    while (
      cursor < records.length &&
      !(records[cursor]![0] === 0 && records[cursor]![1] === "ENDSEC")
    ) {
      if (records[cursor]![0] === 0 && records[cursor]![1] === "SECTION")
        throw invalidDesignReferenceContainer(path, "DXF", "section", "SECTION records cannot nest");
      cursor += 1;
    }
    if (cursor >= records.length)
      throw invalidDesignReferenceContainer(path, "DXF", "closure", "SECTION is missing ENDSEC");
    cursor += 1;
  }
  if (
    sections === 0 ||
    records[cursor]?.[0] !== 0 ||
    records[cursor]?.[1] !== "EOF" ||
    cursor + 1 !== records.length
  )
    throw invalidDesignReferenceContainer(
      path,
      "DXF",
      "closure",
      "drawing must end with one terminal EOF record",
    );
  return true;
};

const trimDxfField = (value: string): string =>
  value.replace(/^[ \t]+|[ \t]+$/g, "");
