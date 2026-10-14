
import type {
  IAutoMovieHeightRule,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { IHousePart } from "../../types/IHousePart";
import type { IPlanPoint } from "../../types/IPlanPoint";

/** One outdoor zone of the site. */
export interface IExteriorZone {
  /** Zone id used for a logical exterior area; route edges select some ids. */
  id: string;
  /** Source owner path under `src/spaces`. */
  owner: string;
  /** Plan outline, world X/Z metres, axis-aligned edges. */
  outline: readonly IPlanPoint[];
  /** A point of the standable ground. */
  anchor: IAutoMovieVector3;
  /** Second point for a whole-zone ramp; null when slope is held in patches or absent. */
  rampTo: IAutoMovieVector3 | null;
  patches?: readonly { outline: readonly IPlanPoint[]; anchor: IAutoMovieVector3; rampTo: IAutoMovieVector3 | null; height?: IAutoMovieHeightRule }[];
  pendingMapGround?: "map-ground-pending";
  groundAt?: (x: number, z: number) => number;
}

/**
 * Temporary 2.00 m display height above an exterior zone's standing surface,
 * pending map ground and obstacle inputs .
 */
export const ZONE_HEAD_CLEARANCE = 2.0;

/** What a site owner emits: its zones and its solids. */
export interface ISiteBuild {
  zones: IExteriorZone[];
  parts: IHousePart[];
}
