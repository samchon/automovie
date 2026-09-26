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
/**
 * @evidence spaces/site/00-access.md IExteriorZone records one standable exterior use area tied to an owner's paving.
 * @evidence principles/core/source-units.md#source-scope-preservation The record is a logical zone and does not duplicate a paving slab or map terrain.
 * @evidence principles/core/source-units.md#source-substantive-completion Id, owner, outline, anchor, and optional ramp end give environment assembly a usable bounded place.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The site-access parent distinguishes walking zones from paving solids; this type needed no extra exterior place.
 */
export interface IExteriorZone {
  /** Zone id used by the route network (05). */
  /**
   * @evidence spaces/site/00-access.md This id is the route-table name of the exterior standing area.
   * @evidence principles/core/source-units.md#source-scope-preservation It identifies a zone, not a new part or off-site network node.
   * @evidence principles/core/source-units.md#source-substantive-completion A required string lets built spaces and route edges share a stable key.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The site parent names current exterior zones; no extra id was synthesized by this field.
   */
  id: string;
  /** Source owner path under `src/spaces`. */
  /**
   * @evidence spaces/site/00-access.md `owner` carries the source path of the paving that supplies this standing area.
   * @evidence principles/core/source-units.md#source-scope-preservation The field points to an existing site or porch author and does not transfer surface authorship.
   * @evidence principles/core/source-units.md#source-substantive-completion A required owner string lets buildHouseEnvironment report and place each zone deterministically.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The access parent allocates each paving owner; this field needed no new surface assignment.
   */
  owner: string;
  /** Plan outline, world X/Z metres, axis-aligned edges. */
  /**
   * @evidence spaces/site/00-access.md The outline bounds the logical walking zone over its owner's paving.
   * @evidence principles/core/source-units.md#source-scope-preservation It is a plan record and does not extrude another visible slab.
   * @evidence principles/core/source-units.md#source-substantive-completion Ordered world X/Z points can be decomposed into engine space cells.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The site parent supplies each zone's paved limits; this field preserves them without a parcel guess.
   */
  outline: readonly IPlanPoint[];
  /** A point of the standable ground. */
  /**
   * @evidence spaces/site/00-access.md `anchor` records a point on the zone's standable top in world coordinates.
   * @evidence principles/core/source-units.md#source-scope-preservation It references paving height and cannot author an independent terrain elevation.
   * @evidence principles/core/source-units.md#source-substantive-completion The required vector makes the zone's floor surface queryable by the engine.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The paving owners define each standable height; this field needed no extra datum.
   */
  anchor: IAutoMovieVector3;
  /** The second ground point of a single-slope zone; null when flat. */
  /**
   * @evidence spaces/site/00-access.md `rampTo` records the second height point for a sloped walking zone or null for level zones.
   * @evidence principles/core/source-units.md#source-scope-preservation It classifies the existing driveway grade rather than drawing a new connector.
   * @evidence principles/core/source-units.md#source-substantive-completion The vector/null union lets environment assembly emit a ramp or platform with no guessed slope.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The driveway parent fixes its two end heights; flat zones have one anchor, so no third ramp datum arose.
   */
  rampTo: IAutoMovieVector3 | null;
}

/**
 * Clear height a zone's logical volume reserves above its ground: the 2.00 m
 * head clearance `02-stair.md#stair-clearance` keeps for a person, the one
 * clear height the spaces design fixes for people on foot.
 */
/**
 * @evidence spaces/02-stair.md ZONE_HEAD_CLEARANCE carries the 2.00 m clear height for pedestrian zone volumes.
 * @evidence spaces/02-stair.md#stair-clearance The vertical 2.00 m reservation matches the passable head space required along the stair route.
 * @evidence principles/core/source-units.md#source-scope-preservation This is a logical clearance, not a ceiling slab height or a terrain top.
 * @evidence principles/core/source-units.md#source-substantive-completion Environment space cells and exterior connectors receive the same numeric clear height.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The stair-clearance parent states the pedestrian height; the zone record did not introduce a larger occupant.
 */
export const ZONE_HEAD_CLEARANCE = 2.0;

/** What a site owner emits: its zones and its solids. */
/**
 * @evidence spaces/site/00-access.md ISiteBuild carries each site owner's logical standing areas and actual solids together.
 * @evidence principles/core/source-units.md#source-scope-preservation The pair keeps zone membership with source-owned paving parts without merging their authorship.
 * @evidence principles/core/source-units.md#source-substantive-completion Both required arrays give buildSite a usable assembly boundary.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The site-access parent separates zones from surfaces; the result type needed no extra site layer.
 */
export interface ISiteBuild {
  /**
   * @evidence spaces/site/00-access.md `zones` lists the named exterior places an owner contributes to route queries.
   * @evidence principles/core/source-units.md#source-scope-preservation The array contains standing records, not duplicate slabs.
   * @evidence principles/core/source-units.md#source-substantive-completion A required typed list lets buildSite concatenate all site zones in fixed order.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The access parent names the current walking zones; this list introduces none.
   */
  zones: IExteriorZone[];
  /**
   * @evidence spaces/site/00-access.md `parts` carries actual paving or fence solids from the site owner.
   * @evidence principles/core/source-units.md#source-scope-preservation The array retains each part's owner id instead of reconstructing a merged site mesh.
   * @evidence principles/core/source-units.md#source-substantive-completion A required IHousePart list gives house assembly concrete geometry to lower.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The site parent allocates each surface to a source owner; the array preserves those parts.
   */
  parts: IHousePart[];
}
