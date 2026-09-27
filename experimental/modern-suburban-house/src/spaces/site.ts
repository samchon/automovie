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
 * @evidenceReview spaces/site/00-access.md #a8ac95c buildSite calls the front walk, driveway, side path and terrace builders in fixed order, then appends buildFence parts; its returned zones and parts assemble the exterior access owners named by the site document.
 * @evidence spaces/site/00-access.md#site-access-interface It gathers front walk, driveway, side walk, terrace, and fence without creating a terrain or outside street node.
 * @evidenceReview spaces/site/00-access.md#site-access-interface #0ee9bff The site-access-interface gives site.ts assembly responsibility and leaves the parcel and house-site-access node to maps; buildSite collects the five owned outputs without constructing either terrain or an external street node.
 * @evidence principles/core/source-units.md#source-scope-preservation The assembly imports each owner as a value and retains its zones and parts instead of drawing a second paving surface.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 buildSite concatenates the returned zones and parts without emitting geometry of its own; FRONT_WALK and SIDE_WALK supply connector Z ranges to buildDriveway rather than transferring their paving ownership.
 * @evidence principles/core/source-units.md#source-substantive-completion A fixed call and concatenation order makes the built site zones and solids deterministic on each build.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The fixed builder array and flatMap order yield repeatable zone and part arrays, with fence parts appended last; the function returns a complete ISiteBuild value for house assembly.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-access-interface makes site.ts the assembly owner and 03-surface-owners.md#exterior-surface-handoff assigns the five paving/fence builders; their returned parts and zones required no new parcel boundary.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Site-access-interface assigns site.ts containment and access assembly, and exterior-surface-handoff assigns the four paving owners plus fence; buildSite follows those allocations and finds no missing parcel-boundary decision.
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
