/**
 * How one endpoint was extended across the band. `upstream`: its upstream
 * recipe reproduces the stored cut-sample rows and supplies E on the band.
 * `derived`: E is the cut-sample row carried to each band vertex at its loop
 * parameter. `macro-owned-by-body`: a face macro row faded to zero at the cut,
 * the cut value belonging to the body macro (request C-5). `unavailable`: the
 * cut-sample rows themselves have no source value, so no extension exists.
 *
 * @author Samchon
 */
export interface IHumanSourceGenerationBandTarget {
  target: string;
  origin: "face" | "body";
  side: "head-band" | "body-band";
  extension: "upstream" | "derived" | "macro-owned-by-body" | "unavailable";
  rows: number;
  replacedRows: number;
  note: string;
}
