/** Actual reference coverage of one unchanged source tarsal extent. */
export interface IHumanSourceAttachmentCoverage {
  lid: "upper" | "lower";
  column: number;
  stationArcsMetres: number[];
  extentMetres: number;
  targetMetres: number;
  continuationArcsMetres: number[];
}
