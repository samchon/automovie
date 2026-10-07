import { IAutoMovieFormationSlotMotion } from "@automovie/interface";

/** Keep slot five absent throughout the existing four second formation motion. */
export const geometryFormationTestRemoveSlotFive: IAutoMovieFormationSlotMotion =
  {
    id: "fall",
    formation: "unit",
    slots: [5],
    start: 0,
    end: 4,
    from: { present: false, offset: { x: 0, y: 0, z: 0 }, facingOffsetDeg: 0 },
    to: { present: false, offset: { x: 0, y: 0, z: 0 }, facingOffsetDeg: 0 },
    easing: "linear",
  };
