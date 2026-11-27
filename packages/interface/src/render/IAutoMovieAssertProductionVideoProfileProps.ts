import type { IAutoMovieProductionVideoProbe } from "../production/IAutoMovieProductionVideoProbe.js";
import type { IAutoMovieProductionVideoProfile } from "./IAutoMovieProductionVideoProfile.js";

/**
 * Required H.264 delivery profile and observed MP4 video facts.
 * assertProductionVideoProfile refuses mismatched raster, rate, brand, matrix,
 * pixel aspect or color metadata. Parsing and encoding remain host operations.
 */
export interface IAutoMovieAssertProductionVideoProfileProps {
  /** Profile resolved from the deliverable's authored raster and rate. */
  expected: IAutoMovieProductionVideoProfile;

  /** Facts the MP4 probe observed in the file. */
  actual: IAutoMovieProductionVideoProbe;
}
