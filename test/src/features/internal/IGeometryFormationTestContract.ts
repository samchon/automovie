import type { IAutoMovieShotContract } from "@automovie/interface";

/** Participants and camera intent read by the existing formation measurements.
 */
export interface IGeometryFormationTestContract extends Pick<
  IAutoMovieShotContract,
  "participants" | "camera"
> {}
