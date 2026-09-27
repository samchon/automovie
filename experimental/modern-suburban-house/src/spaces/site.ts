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
import { buildFrontWalk, FRONT_WALK } from "./site/front-walk";
import { buildSideWalk, SIDE_WALK } from "./site/side-walk";
import { buildTerrace } from "./site/terrace";
import type { ISiteBuild } from "./site/zone";

/** Emit every site zone and part in a fixed owner order. */
/**
 * @evidence spaces/site/00-access.md This assembly combines the separate authored exterior access owners into one site return value.
 * @evidenceReview spaces/site/00-access.md #a8ac95c site.ts:27-37 calls the four paving builders plus buildFence and returns one ISiteBuild; 00-access.md:29 makes src/spaces/site.ts the containment/access assembly owner that does not duplicate paving or terrain.
 * @evidence spaces/site/00-access.md#site-access-interface It gathers front walk, driveway, side walk, terrace, and fence without creating a terrain or outside street node.
 * @evidenceReview spaces/site/00-access.md#site-access-interface #0ee9bff site.ts:28-36 gathers buildFrontWalk/buildDriveway/buildSideWalk/buildTerrace/buildFence and emits no terrain or street node; 00-access.md:29 (assembly only), :31-33 (maps owns the house-site-access node, not authored here).
 * @evidence principles/core/source-units.md#source-scope-preservation The assembly imports each owner as a value and retains its zones and parts instead of drawing a second paving surface.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 site.ts:12-16 value imports; :35-36 flatMap keeps every build's zones and parts; no slab is made in site.ts. The new FRONT_WALK/SIDE_WALK imports only pass connector Z ranges to buildDriveway (:30).
 * @evidence principles/core/source-units.md#source-substantive-completion A fixed call and concatenation order makes the built site zones and solids deterministic on each build.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f site.ts:28-36 fixed builder array order, flatMap order, fence parts appended last; nothing order-dependent or random.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-access-interface makes site.ts the assembly owner and 03-surface-owners.md#exterior-surface-handoff assigns the five paving/fence builders; their returned parts and zones required no new parcel boundary.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 00-access.md:29 "src/spaces/site.ts는 이 containment와 접속의 조립 owner"; 03-surface-owners.md:50-54 (exterior-surface-handoff) assigns front-walk, driveway, terrace, side-walk, fence files (five), :68 site.ts only assembles; site.ts:27-37 returns their parts/zones only. Fixes v141 wrong authority.
 */
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
