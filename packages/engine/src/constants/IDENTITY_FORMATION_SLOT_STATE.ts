import { IAutoMovieFormationSlotState } from "@automovie/interface";

/** The state a member holds when nothing has happened to it in particular. */
export const IDENTITY_FORMATION_SLOT_STATE: IAutoMovieFormationSlotState = {
  present: true,
  offset: { x: 0, y: 0, z: 0 },
  facingOffsetDeg: 0,
};
