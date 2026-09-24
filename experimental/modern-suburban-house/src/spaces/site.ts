/**
 * `house-site`: containment and access assembly of the site owners.
 *
 * Design owner: `docs/spaces/site/00-access.md#site-access-interface`. The site
 * contains the main building, the garage, the porch and the exterior access
 * areas, all bound to the ground storey. This owner does not create paving or
 * terrain itself: it gathers the front walk, driveway, side path, terrace and
 * fence owners. The terrain, parcel and outside network are maps inputs and
 * are not authored here (maps is disabled).
 */

import { buildDriveway } from "./site/driveway";
import { buildFence } from "./site/fence";
import { buildFrontWalk } from "./site/front-walk";
import { buildSideWalk } from "./site/side-walk";
import { buildTerrace } from "./site/terrace";
import type { ISiteBuild } from "./site/zone";

/** Emit every site zone and part in a fixed owner order. */
export const buildSite = (): ISiteBuild => {
  const builds = [buildFrontWalk(), buildDriveway(), buildSideWalk(), buildTerrace()];
  return { zones: builds.flatMap((b) => b.zones), parts: [...builds.flatMap((b) => b.parts), ...buildFence()] };
};
