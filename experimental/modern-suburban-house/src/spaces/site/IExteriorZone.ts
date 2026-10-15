
import type {
  IAutoMovieHeightRule,
  IAutoMovieVector3,
} from "@automovie/interface";
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
  /** Sloped or stepped sub-areas of the zone, each with its own ground. */
  patches?: readonly { outline: readonly IPlanPoint[]; anchor: IAutoMovieVector3; rampTo: IAutoMovieVector3 | null; height?: IAutoMovieHeightRule }[];
  /** Marks a zone whose ground still awaits the site map. */
  pendingMapGround?: "map-ground-pending";
  /** Ground height at a plan point, when the zone computes it directly. */
  groundAt?: (x: number, z: number) => number;
}

