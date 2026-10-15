/**
 * Derives the stone coping on top of the outer walls and the stone plinth band at their foot from the wall columns.
 * The coping sits on the plane of each flat-topped column (parapet, yard wall) by its thickness and projects at
 * both long faces and free ends. An end that continues into a higher wall does not project, and cells whose
 * projection would enter another wall column are dropped. The plinth projects only in front of outer faces on
 * the building outline that run unbroken from the foot to the plinth top, and its top follows the ground height
 * the caller gives. Both results are unions of grid cells, so no solids overlap inside one part, and the shared
 * faces of touching cells are removed by culling.
 */
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

export interface WallTrimInput {
  walls: readonly WallSpec[];
  roof: readonly RoofPatch[];
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

