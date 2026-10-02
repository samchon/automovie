import type { IAnsurResidualBand } from "./summariseAnsurResiduals";

/** One measure of one sex, summarised thin to heavy. */
export interface IAnsurCensusRow {
  sex: "female" | "male";
  measure: string;
  sameDefinition: boolean;
  count: number;
  bands: IAnsurResidualBand[];
}

/**
 * Render census rows as a Markdown table in millimetres: per row the band
 * means with their standard deviations from the thinnest to the heaviest
 * stratum, rounded to whole millimetres. Rows whose definition differs from
 * ANSUR's are marked `different` so a reader cannot take their residual for a
 * defect of the body. The text is a local report; nothing parses it back.
 */
export function formatAnsurCensusTable(
  rows: readonly IAnsurCensusRow[],
): string {
  const lines = [
    "| sex | measure | definition | n | thin to heavy: mean (sd) mm |",
    "| --- | --- | --- | --- | --- |",
  ];
  for (const row of rows)
    lines.push(
      `| ${row.sex} | ${row.measure} | ${row.sameDefinition ? "same" : "different"} | ${row.count} | ${row.bands
        .map((band) => `${band.mean.toFixed(0)} (${band.sd.toFixed(0)})`)
        .join(" / ")} |`,
    );
  return lines.join("\n") + "\n";
}
