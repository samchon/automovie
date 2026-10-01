import type { ITempleProseDiagnosticRows } from "./ITempleProseDiagnosticRows.mjs";

/** Format failed producer verdicts in the census's established family order.
 * checkModelProseConsistency owns acquisition and reporting; this function
 * owns diagnostic text only. It neither mutates rows nor reinterprets pass.
 * Unresolved axes have no finite union, so their part witness is reported
 * instead of a fictitious extent. Optional shape witnesses remain blank.
 */
export const formatTempleProseFailures = (rows: ITempleProseDiagnosticRows): string[] => [
  ...rows.equations.filter((row) => !row.pass).map((row) => `${row.id}: ${row.expression} ${row.relation} ${row.stated}m calculates ${row.calculated}m`),
  ...rows.ranges.filter((row) => !row.pass).map((row) => `${row.id}: ${row.axis} range ${row.from}..${row.to} has no finite extent`),
  ...rows.bounds.filter((row) => !row.pass).map((row) => `${row.id}: ${row.kind} ${row.dimensions} exceeds occupancy box ${row.box}`),
  ...rows.unions.filter((row) => !row.pass).map((row) => row.kind.startsWith("unresolved")
    ? `${row.id}: ${row.kind}: ${row.part} ${row.axis}`
    : `${row.id}: ${row.axis} ${row.union}m differs from occupancy box ${row.box}m`),
  ...rows.wallContacts.filter((row) => !row.pass).map((row) => `${row.id}: ${row.part} back Z=${row.back}m misses the wall datum`),
  ...rows.tubeContacts.filter((row) => !row.pass).map((row) => `${row.id}: ${row.kind} measured ${row.measured}m contradicts prose`),
  ...rows.partContacts.filter((row) => !row.pass).map((row) => `${row.id}: ${row.parts} do not touch on ${row.axis}`),
  ...rows.shapeRelations.filter((row) => !row.pass).map((row) => `${row.id}: ${row.kind} ${row.parts ?? ""} measured ${row.measured}m contradicts construction`),
  ...rows.overlaps.filter((row) => !row.pass).map((row) => `${row.id}: ${row.parts} boxes overlap by ${row.depths.join("×")}m without a declared part relation`),
];
