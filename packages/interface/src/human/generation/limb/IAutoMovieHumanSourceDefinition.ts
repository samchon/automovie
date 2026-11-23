import type { IAutoMovieHumanSourceRealization } from "./IAutoMovieHumanSourceRealization";

/**
 * Original part, canonical metre view and preparation diagnostics, before a raw
 * loft exists. The synchronous caller owns this record.
 */
export type IAutoMovieHumanSourceDefinition = Pick<
  IAutoMovieHumanSourceRealization,
  "part" | "view" | "diagnostics" | "massConnection"
>;
