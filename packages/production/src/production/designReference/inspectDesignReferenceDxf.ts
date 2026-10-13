import { invalidDesignReferenceContainer } from "./invalidDesignReferenceContainer";

/**
 * Admit DXF group-code/value records only when named sections close and one terminal EOF owns the end of the drawing. It derives no geometric extent.
 *
 * @evidence contracts/common.md#principled-implementation Normalizes newline spelling, recognizes section/version candidates, parses integer group-code/value pairs and requires nonnested SECTION/ENDSEC groups ending in one terminal EOF record.
 * @evidence contracts/common.md#clear-and-simple-design One record-state walk owns DXF framing while the common factory preserves logical path, family and refusal stage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Candidate tokens alone do not admit a drawing; geometry/entity semantics and drawing extent are not inferred by this supported record profile.
 * @evidence contracts/common.md#meaningful-documentation States false for no candidate, typed refusal for malformed selected records and true for owned framing without claiming a measured drawing box.
 * @evidence contracts/performance.md#efficient-algorithms Newline normalization, candidate scan, pair construction and section walk are linear in text/record population, retaining normalized lines and parsed pairs proportional to input size.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every supplied text is inspected independently; the parser retains no prior path or drawing result as current authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller owns text and temporary line/pair arrays retire with this call; the boolean/error contains no drawing buffer, file or native task.
 */
export function inspectDesignReferenceDxf(path: string, text: string): boolean {
  const lines: string[] = text.replace(/\r\n?/g, "\n").split("\n");
  if (lines.at(-1) === "") lines.pop();
  const candidate: boolean = lines.some(
    (line: string) : boolean =>
      trimDxfField(line) === "SECTION" || trimDxfField(line) === "$ACADVER",
  );
  if (!candidate) return false;
  if (lines.length % 2 !== 0)
    throw invalidDesignReferenceContainer(path, "DXF", "records", "a group code has no value");
  const records: Array<readonly [number, string]> = [];
  for (let index: number = 0; index < lines.length; index += 2) {
    const spelling: string = trimDxfField(lines[index]!);
    const code: number = Number(spelling);
    if (!/^\d+$/.test(spelling) || !Number.isInteger(code) || code > 1071)
      throw invalidDesignReferenceContainer(
        path,
        "DXF",
        "records",
        `invalid group code at line ${index + 1}`,
      );
    records.push([code, trimDxfField(lines[index + 1]!)]);
  }
  let cursor: number = 0;
  let sections: number = 0;
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
}

/** Remove only admitted horizontal field padding, preserving record contents. */
function trimDxfField(value: string): string { return value.replace(/^[ \t]+|[ \t]+$/g, ""); }
