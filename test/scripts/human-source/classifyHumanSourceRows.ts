import { humanSourcePositionTolerance } from "./humanSourcePositionTolerance.ts";
import type { IHumanSourceClassification } from "./structures/IHumanSourceClassification.ts";
import type { IHumanSourceReproductionRow } from "./structures/IHumanSourceReproductionRow.ts";

/** One storage unit of weights stored at seven decimals. */
const WEIGHT_TOLERANCE = 1e-7;

/**
 * Decide each row's provenance from its measured regeneration error. A row is
 * upstream-reproduced only when its recipe lands within the storage
 * resolution of the published value; a larger residual means a later stage
 * changed the published value, so the row is carried and listed as not
 * regenerated, with the residual kept as the size of that later change.
 */
export function classifyHumanSourceRows(rows: readonly IHumanSourceReproductionRow[]): IHumanSourceClassification {
  const out: IHumanSourceReproductionRow[] = [];
  const losses: IHumanSourceClassification["losses"] = [];
  for (const row of rows) {
    if (row.regeneration === null || row.provenance !== "upstream-recipe") {
      out.push(row);
      continue;
    }
    const tolerance = row.role === "weights" || row.role === "attachment" ? WEIGHT_TOLERANCE : humanSourcePositionTolerance;
    if (row.regeneration.maximumMetres <= tolerance) {
      out.push(row);
      continue;
    }
    out.push({
      ...row,
      provenance: "carried-published",
      note: `${row.note}; recipe ${row.recipe} differs by ${row.regeneration.maximumMetres.toExponential(3)} on ${row.regeneration.differingVertices} vertices (later-stage change)`,
    });
    losses.push({
      basis: row.basis,
      surface: row.surface,
      row: row.row,
      kind: "not-regenerated-from-upstream",
      vertices: row.regeneration.differingVertices,
      maximumMetres: row.regeneration.maximumMetres,
      reason: `upstream recipe ${row.recipe} reproduces the row only up to a later-stage change; value carried from the published basis`,
    });
  }
  return { rows: out, losses };
}
