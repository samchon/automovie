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
import type {
  IAutoMovieHeightRule,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { IHousePart, IPlanPoint } from "../solids";

/** One outdoor zone of the site. */
/**
 * @evidence spaces/site/00-access.md IExteriorZone records one standable exterior use area tied to an owner's paving.
 * @evidence principles/core/source-units.md#source-scope-preservation The record is a logical zone and does not duplicate a paving slab or map terrain.
 * @evidence principles/core/source-units.md#source-substantive-completion Id, owner, outline, anchor, and optional ramp end give environment assembly a usable bounded place.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-access-interface places named exterior standing zones below house-site while exterior-surface-handoff assigns their paving bodies to site and porch owners; this type carries that existing pair.
 */
export interface IExteriorZone {
  /** Zone id used by the route network (05). */
  /**
   * @evidence spaces/site/00-access.md This id is the route-table name of the exterior standing area.
   * @evidence principles/core/source-units.md#source-scope-preservation It identifies a zone, not a new part or off-site network node.
   * @evidence principles/core/source-units.md#source-substantive-completion A required string lets built spaces and route edges share a stable key.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-local-routes names front-walk, driveway, side access, garden terrace, and lower landing as route places; id preserves each emitted zone name.
   */
  id: string;
  /** Source owner path under `src/spaces`. */
  /**
   * @evidence spaces/site/00-access.md `owner` carries the source path of the paving that supplies this standing area.
   * @evidence principles/core/source-units.md#source-scope-preservation The field points to an existing site or porch author and does not transfer surface authorship.
   * @evidence principles/core/source-units.md#source-substantive-completion A required owner string lets buildHouseEnvironment report and place each zone deterministically.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 03-surface-owners.md#exterior-surface-handoff assigns front-walk, driveway, side-walk, and terrace their own paving; this owner field preserves those returned names.
   */
  owner: string;
  /** Plan outline, world X/Z metres, axis-aligned edges. */
  /**
   * @evidence spaces/site/00-access.md The outline bounds the logical walking zone over its owner's paving.
   * @evidence principles/core/source-units.md#source-scope-preservation It is a plan record and does not extrude another visible slab.
   * @evidence principles/core/source-units.md#source-substantive-completion Ordered world X/Z points can be decomposed into engine space cells.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-local-routes limits front-walk, driveway, side access, and garden terrace to the owner's paving; outline records each emitted boundary without adding parcel terrain.
   */
  outline: readonly IPlanPoint[];
  /** A point of the standable ground. */
  /**
   * @evidence spaces/site/00-access.md `anchor` records a point on the zone's standable top in world coordinates.
   * @evidence principles/core/source-units.md#source-scope-preservation It references paving height and cannot author an independent terrain elevation.
   * @evidence principles/core/source-units.md#source-substantive-completion The required vector makes the zone's floor surface queryable by the engine.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Paving-contact-handoff keeps a zone's standing height on its visible paving top; anchor transports a point on that owner surface.
   */
  anchor: IAutoMovieVector3;
  /** The second ground point of a single-slope zone; null when flat. */
  /**
   * @evidence spaces/site/00-access.md `rampTo` records the second height point for a sloped walking zone or null for level zones.
   * @evidence principles/core/source-units.md#source-scope-preservation It classifies the existing driveway grade rather than drawing a new connector.
   * @evidence principles/core/source-units.md#source-substantive-completion The vector/null union lets environment assembly emit a ramp or platform with no guessed slope.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Driveway-plan interpolates between garage floor and front-walk height, so rampTo stores its second datum while flat porch and terrace zones use null.
   */
  rampTo: IAutoMovieVector3 | null;
  /**
   * @evidence spaces/site/00-access.md Joined exterior walks can expose their actual standing bands as one zone.
   * @evidence spaces/site/00-access.md#site-local-routes Each patch retains its paving owner's grade while the zone stays continuous.
   * @evidence principles/core/source-units.md#source-scope-preservation Patches describe emitted paving, not extra slabs or off-site ground.
   * @evidence principles/core/source-units.md#source-substantive-completion Each patch supplies an outline and height points for separate cells and surfaces.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Front-walk-plan has a T connector and side-walk-plan has front and rear cross bands; patches retain those distinct paving heights under each continuous walking zone.
   */
  patches?: readonly { outline: readonly IPlanPoint[]; anchor: IAutoMovieVector3; rampTo: IAutoMovieVector3 | null; height?: IAutoMovieHeightRule }[];
  /**
   * @evidence spaces/site/00-access.md Exterior standing volumes remain provisional until map ground and obstacles arrive.
   * @evidence spaces/site/00-access.md#site-local-routes The temporary 2.00 m logical volume carries this marker in output.
   * @evidence principles/core/source-units.md#source-scope-preservation The status reports map dependency without asserting ground or headroom certification.
   * @evidence principles/core/source-units.md#source-substantive-completion Consumers can find every exterior zone requiring later map validation.
   * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work Source construction exposed the missing temporary volume rule; site access now owns it.
   */
  pendingMapGround?: "map-ground-pending";
  /**
   * @evidence spaces/site/01-paving-support.md A joined connector retains the same height calculation as its emitted paving.
   * @evidence spaces/site/01-paving-support.md#paving-depth-reservation Bilinear connector samples need the source owner's X/Z height, not a single ramp interpolation.
   * @evidence principles/core/source-units.md#source-scope-preservation This callback reads the existing paving profile and adds no ground datum.
   * @evidence principles/core/source-units.md#source-substantive-completion Observation eyes can be placed over the actual sampled connector top.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Paving-depth-reservation requires the connector top to follow its sampled bilinear height, and groundAt returns that same height at each X/Z point.
   */
  groundAt?: (x: number, z: number) => number;
}

/**
 * Temporary 2.00 m display height above an exterior zone's standing surface,
 * pending map ground and obstacle inputs (`site/00-access.md#site-local-routes`).
 */
/**
 * @evidence spaces/site/00-access.md ZONE_HEAD_CLEARANCE carries the temporary 2.00 m logical exterior zone volume.
 * @evidence spaces/site/00-access.md#site-local-routes The volume is a display datum pending map ground input, not a stair clearance certificate.
 * @evidence principles/core/source-units.md#source-scope-preservation This is a logical clearance, not a ceiling slab height or a terrain top.
 * @evidence principles/core/source-units.md#source-substantive-completion Environment space cells and exterior connectors receive the same numeric clear height.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work The source exposed a missing exterior zone height; the site access design now declares its temporary value and map-ground pending status.
 */
export const ZONE_HEAD_CLEARANCE = 2.0;

/** What a site owner emits: its zones and its solids. */
/**
 * @evidence spaces/site/00-access.md ISiteBuild carries each site owner's logical standing areas and actual solids together.
 * @evidence principles/core/source-units.md#source-scope-preservation The pair keeps zone membership with source-owned paving parts without merging their authorship.
 * @evidence principles/core/source-units.md#source-substantive-completion Both required arrays give buildSite a usable assembly boundary.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-access-interface supplies named exterior standing zones and exterior-surface-handoff assigns visible paving to each source owner; ISiteBuild returns those two outputs together.
 */
export interface ISiteBuild {
  /**
   * @evidence spaces/site/00-access.md `zones` lists the named exterior places an owner contributes to route queries.
   * @evidence principles/core/source-units.md#source-scope-preservation The array contains standing records, not duplicate slabs.
   * @evidence principles/core/source-units.md#source-substantive-completion A required typed list lets buildSite concatenate all site zones in fixed order.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-local-routes uses front-walk, driveway, side access, terrace, and lower landing as existing walking places; zones collects their emitted records.
   */
  zones: IExteriorZone[];
  /**
   * @evidence spaces/site/00-access.md `parts` carries actual paving or fence solids from the site owner.
   * @evidence principles/core/source-units.md#source-scope-preservation The array retains each part's owner id instead of reconstructing a merged site mesh.
   * @evidence principles/core/source-units.md#source-substantive-completion A required IHousePart list gives house assembly concrete geometry to lower.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Exterior-surface-handoff assigns the front walk, drive, side walk, and terrace their own paving bodies; parts collects those emitted IHousePart records without claiming their faces.
   */
  parts: IHousePart[];
}
