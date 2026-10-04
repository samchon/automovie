/**
 * One face attachment weight field over the one skin, sparse `[skinId,
 * weight]` pairs ascending: the published face rows re-addressed, plus their
 * band extension below the cut. Dimensionless.
 */
export interface IHumanSourceGenerationAttachment {
  owner: string;
  rows: number[];
  extension: "upstream" | "derived";
}
