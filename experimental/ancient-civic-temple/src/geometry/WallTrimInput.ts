import { type PlanRectangle } from "./PlanRectangle";
import { type RoofPatch } from "./RoofPatch";
import { type HeightPlane } from "./HeightPlane";
import { type PlanPoint } from "./PlanPoint";
import { type WallSpec } from "./WallSpec";

interface WallTrimProfile {
  /** Coping projection (m) at the wall's long faces and free ends. */
  copingProjection: number;
  /** Plinth projection (m) from the outer outline faces. */
  plinthProjection: number;
  /** Height (m) of the plinth top above the ground. */
  plinthRise: number;
}

/** Walls, roof and profile from which the outer-wall coping and plinth cells are derived. */
export interface WallTrimInput {
  /** Walls whose columns carry the coping and plinth. */
  walls: readonly WallSpec[];
  /** Composed roof that sets column tops. */
  roof: readonly RoofPatch[];
  /** Coping and plinth projections and the plinth rise. */
  profile: WallTrimProfile;
  /** The building's outer outline. The plinth attaches only to faces on this line. */
  outline: PlanRectangle;
  /** The ground plane at a plan position (plinth top = ground + rise). */
  grade: (at: PlanPoint) => HeightPlane;
  /** Ground slope break lines (Z) that split the plinth cells. */
  gradeBreaks: readonly number[];
  /** Builds the plinth surface ID from the name of the elevation that owns the outline face. */
  plinthSurface: (outerSurface: string) => string;
}

