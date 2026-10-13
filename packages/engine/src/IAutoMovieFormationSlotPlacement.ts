import { IAutoMovieVector3 } from "@automovie/interface";

/** Where one member of a unit really stands, and whether it is there at all. */
export interface IAutoMovieFormationSlotPlacement {
  /** Whether this member is drawn, measured and counted at this time. */
  present: boolean;
  /** World-space position in meters. */
  position: IAutoMovieVector3;
  /** World-space heading in degrees. */
  facingDeg: number;
}
