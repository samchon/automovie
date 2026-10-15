/**
 * `house-site`: containment and access assembly of the site owners.
 *
 * The site
 * contains the main building, the garage, the porch and the exterior access
 * areas, all bound to the ground storey. This owner does not create paving or
 * terrain itself: it gathers the front walk, driveway, side path, terrace and
 * fence owners. The terrain, parcel and outside network are maps inputs and
 * are not authored here (maps is disabled).
 */

import { buildDriveway } from "./site/buildDriveway";
import { buildFence } from "./site/buildFence";
import { FRONT_WALK } from "./site/FRONT_WALK";
import { buildFrontWalk } from "./site/buildFrontWalk";
import { SIDE_WALK } from "./site/SIDE_WALK";
import { buildSideWalk } from "./site/buildSideWalk";
import { buildTerrace } from "./site/buildTerrace";
import type { ISiteBuild } from "./site/ISiteBuild";

/** Emit every site zone and part in a fixed owner order. */
export const buildSite = (): ISiteBuild => {
  const builds = [
    buildFrontWalk(),
    buildDriveway(FRONT_WALK.connectorZ, SIDE_WALK.frontBand),
    buildSideWalk(),
    buildTerrace(),
  ];
  return {
    zones: builds.flatMap((b) => b.zones),
    parts: [...builds.flatMap((b) => b.parts), ...buildFence()],
  };
};
