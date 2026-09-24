/**
 * Exterior zone record: one named outdoor place on the site paving that the
 * route network (`docs/spaces/05-route-network.md#room-route-network`) starts
 * from, passes or ends at.
 *
 * Owners: `porch.ts` (front-porch), `site/front-walk.ts`, `site/driveway.ts`,
 * `site/terrace.ts` (garden-terrace, garden-lower-landing) and
 * `site/side-walk.ts` (side-front-access, side-rear-access). Each zone is a
 * use area of its owner's paving, not a new slab: its plan outline, and its
 * standable ground as one anchor point, plus a second point when the ground
 * ramps (the driveway). The built-environment record turns each zone into a
 * logical space under `house-site` from the ground up to
 * `ZONE_HEAD_CLEARANCE`, and into a standable surface.
 */
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHousePart, IPlanPoint } from "../solids";

/** One outdoor zone of the site. */
export interface IExteriorZone {
  /** Zone id used by the route network (05). */
  id: string;
  /** Source owner path under `src/spaces`. */
  owner: string;
  /** Plan outline, world X/Z metres, axis-aligned edges. */
  outline: readonly IPlanPoint[];
  /** A point of the standable ground. */
  anchor: IAutoMovieVector3;
  /** The second ground point of a single-slope zone; null when flat. */
  rampTo: IAutoMovieVector3 | null;
}

/**
 * Clear height a zone's logical volume reserves above its ground: the 2.00 m
 * head clearance `02-stair.md#stair-clearance` keeps for a person, the one
 * clear height the spaces design fixes for people on foot.
 */
export const ZONE_HEAD_CLEARANCE = 2.0;

/** What a site owner emits: its zones and its solids. */
export interface ISiteBuild {
  zones: IExteriorZone[];
  parts: IHousePart[];
}
