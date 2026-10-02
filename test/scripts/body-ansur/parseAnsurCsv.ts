/**
 * Parse an ANSUR II public CSV into numeric records.
 *
 * The U.S. Army's 2012 public working databases (Hotzman et al.,
 * NATICK/TR-11/017, 2011) are comma separated with one header row. Column
 * names differ in case between the male and the female release (`SubjectId`,
 * `subjectid`), so every name is lower-cased. A column keeps its value only
 * when it reads as a finite number: the lengths and girths are millimetres,
 * `weightkg` is tenths of a kilogram and `stature` millimetres, while the
 * text columns (gender, installation, date) are dropped from the record
 * instead of becoming NaN. A row whose field count differs from the header is
 * a damaged file and refused with its line number.
 *
 * Callers: `ansur-proportion-census.ts` reads the two files once and passes
 * the records to `ansurPercentile` and `pickAnsurStrata`.
 */
export function parseAnsurCsv(text: string): Record<string, number>[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length === 0) return [];
  const header = lines[0].split(",").map((name) => name.trim().toLowerCase());
  return lines.slice(1).map((line, index) => {
    const fields = line.split(",");
    if (fields.length !== header.length)
      throw new Error(
        `ANSUR row ${index + 2} has ${fields.length} fields, the header ${header.length}.`,
      );
    const record: Record<string, number> = {};
    header.forEach((name, column) => {
      const field = fields[column].trim();
      const value = field === "" ? Number.NaN : Number(field);
      if (Number.isFinite(value)) record[name] = value;
    });
    return record;
  });
}
