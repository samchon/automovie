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
import type { IHousePart, IPlanPoint } from "../solid-records";

/** One outdoor zone of the site. */
/**
 * @evidence spaces/site/00-access.md IExteriorZone records one standable exterior use area tied to an owner's paving.
 * @evidenceReview spaces/site/00-access.md #a8ac95c v-141 zone.ts:25-90 id/owner/outline/anchor/rampTo; 00-access.md:29 exterior access zones, :69 zone volume above each walking surface.
 * @evidence principles/core/source-units.md#source-scope-preservation The record is a logical zone and does not duplicate a paving slab or map terrain.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 The type holds a plan outline and points only; parts are separate (ISiteBuild.parts).
 * @evidence principles/core/source-units.md#source-substantive-completion Id, owner, outline, anchor, and optional ramp end give environment assembly a usable bounded place.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 environment.ts:550-583 uses id, outline/patches, anchor, rampTo to build cells and surfaces; owner in rectangles errors. rampTo is required-nullable ("optional" loosely).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-access-interface places named exterior standing zones below house-site while exterior-surface-handoff assigns their paving bodies to site and porch owners; this type carries that existing pair.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 00-access.md:29 house-site contains the exterior access areas; walks, drive and terrace bind as ground-storey exterior zones. 03-surface-owners.md:44 (porch.ts) and :50-53 (site files) own the paving; IExteriorZone (zone.ts:28-93) carries id + owner.
 */
export interface IExteriorZone {
  /** Zone id used by the route network (05). */
  /**
   * @evidence spaces/site/00-access.md This id is the route-table name of the exterior standing area.
   * @evidenceReview spaces/site/00-access.md #a8ac95c v-141 True for 7 of 8 zone ids, but side-walk.ts:78 id "side-walk" (added 04df855f) is not a route-table name: 05-route-network.md:33-49 lists front-walk, driveway, front-porch, garden-terrace, garden-lower-landing, side-front-access, side-rear-access; routes.ts:70-84 never uses "side-walk".
   * @evidence principles/core/source-units.md#source-scope-preservation It identifies a zone, not a new part or off-site network node.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 id becomes a space id (environment.ts:552-553), not a part; no network node.
   * @evidence principles/core/source-units.md#source-substantive-completion A required string lets built spaces and route edges share a stable key.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 environment.ts:553 space id = zone.id; exterior connectors use the same ids (environment.ts:262-266); routes.ts edges by id.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-local-routes names front-walk, driveway, side access, garden terrace, and lower landing as route places; id preserves each emitted zone name.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 00-access.md:63-65 names front-walk, driveway, garden-terrace, garden-lower-landing and the side-walk front/rear areas; id is the emitted zone name (e.g. side-walk.ts:79,130-131).
   */
  id: string;
  /** Source owner path under `src/spaces`. */
  /**
   * @evidence spaces/site/00-access.md `owner` carries the source path of the paving that supplies this standing area.
   * @evidenceReview spaces/site/00-access.md #a8ac95c v-141 owners "site/driveway.ts" etc. (driveway.ts:51, front-walk.ts:22, side-walk.ts:23, terrace.ts:20), porch "porch.ts"; exterior-support.ts:71 pairs zone.owner with paving parts.
   * @evidence principles/core/source-units.md#source-scope-preservation The field points to an existing site or porch author and does not transfer surface authorship.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Plain string; surfaces keep their own part owners.
   * @evidence principles/core/source-units.md#source-substantive-completion A required owner string lets buildHouseEnvironment report and place each zone deterministically.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 owner is passed to rectangles() during zone placement but only for error text (environment.ts:562 -> :94-96,:111-113); "place" is overstated.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 03-surface-owners.md#exterior-surface-handoff assigns front-walk, driveway, side-walk, and terrace their own paving; this owner field preserves those returned names.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 03-surface-owners.md:50-53 assigns front-walk.ts, driveway.ts, terrace.ts, side-walk.ts; owner values are 'site/*.ts' (driveway.ts:56, front-walk.ts:26, side-walk.ts:23, terrace.ts:22). Fixes the v141 wrong authority.
   */
  owner: string;
  /** Plan outline, world X/Z metres, axis-aligned edges. */
  /**
   * @evidence spaces/site/00-access.md The outline bounds the logical walking zone over its owner's paving.
   * @evidenceReview spaces/site/00-access.md #a8ac95c v-141 Outlines equal emitted paving: driveway.ts:52 vs :72; front-walk T :56-65; side-walk union :80-89; terrace :88,:95.
   * @evidence principles/core/source-units.md#source-scope-preservation It is a plan record and does not extrude another visible slab.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Outline feeds logical cells/surface polygons (environment.ts:562,574), no mesh.
   * @evidence principles/core/source-units.md#source-substantive-completion Ordered world X/Z points can be decomposed into engine space cells.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 rectangles() decomposes axis-aligned outlines into cells (environment.ts:90-118,562); patch zones use patch outlines.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-local-routes limits front-walk, driveway, side access, and garden terrace to the owner's paving; outline records each emitted boundary without adding parcel terrain.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The site-local-routes body (00-access.md:63-71) orders routes; only :69 ties the zone volume to "각 보행면 상면", and nothing limits outlines to the owner's paving. The nearest explicit statements are side-walk.md:67 ("같은 보행면의 사용 구역"), terrace.md:25 and 03-surface-owners.md:68. Host side holds: outline is a plan record only.
   */
  outline: readonly IPlanPoint[];
  /** A point of the standable ground. */
  /**
   * @evidence spaces/site/00-access.md `anchor` records a point on the zone's standable top in world coordinates.
   * @evidenceReview spaces/site/00-access.md #a8ac95c v-141 Anchors at paving tops: driveway.ts:53-57 driveTop, front-walk.ts:66-70 walkY, side-walk.ts:71-73,90 s, terrace.ts:89,96 TOP/LOW.
   * @evidence principles/core/source-units.md#source-scope-preservation It references paving height and cannot author an independent terrain elevation.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Anchor Y values come from the same owner constants as paving tops (walkY, driveTop, s, TOP, LOW).
   * @evidence principles/core/source-units.md#source-substantive-completion The required vector makes the zone's floor surface queryable by the engine.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 environment.ts:575 surface anchor/rampTo from the patch (zone.anchor when no patches).
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Paving-contact-handoff keeps a zone's standing height on its visible paving top; anchor transports a point on that owner surface.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 paving-contact-handoff (01-paving-support.md:93-101) covers paving-to-paving and ground contacts, not a zone's standing height. The fact is in same-file paving-depth-reservation :33 (walkable height and body consume one formula) and 00-access.md:69. Anchors do sit on paving tops (driveway.ts:60, terrace.ts:109).
   */
  anchor: IAutoMovieVector3;
  /** The second ground point of a single-slope zone; null when flat. */
  /**
   * @evidence spaces/site/00-access.md `rampTo` records the second height point for a sloped walking zone or null for level zones.
   * @evidenceReview spaces/site/00-access.md #a8ac95c v-141 Joined zones that are not level still carry rampTo null: front-walk.ts:71 and side-walk.ts:91 (T walk and side path both contain a sloped connector; slope held in patches[].rampTo/height :85-90, :117-118). "null for level zones" is imprecise since patches (04df855f); only the driveway sets a zone-level rampTo.
   * @evidence principles/core/source-units.md#source-scope-preservation It classifies the existing driveway grade rather than drawing a new connector.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 driveway.ts:58-62 rampTo records driveTop at z1; no connector geometry comes from the field.
   * @evidence principles/core/source-units.md#source-substantive-completion The vector/null union lets environment assembly emit a ramp or platform with no guessed slope.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 environment.ts:572 kind = rampTo===null ? "platform" : "ramp"; :575 anchor/rampTo passed through.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Driveway-plan interpolates between garage floor and front-walk height, so rampTo stores its second datum while flat porch and terrace zones use null.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 driveway.md:29 D(Z) runs between the garage floor and the front walk; driveway zone rampTo (driveway.ts:63-67); porch.ts:182 and terrace.ts:112,123 rampTo null.
   */
  rampTo: IAutoMovieVector3 | null;
  /**
   * @evidence spaces/site/00-access.md Joined exterior walks can expose their actual standing bands as one zone.
   * @evidenceReview spaces/site/00-access.md #a8ac95c v-141 front-walk.ts:76-92 and side-walk.ts:96-120 patches; environment.ts:551-583 one space with per-patch cells/surfaces; 00-access.md:71 T walk.
   * @evidence spaces/site/00-access.md#site-local-routes Each patch retains its paving owner's grade while the zone stays continuous.
   * @evidenceReview spaces/site/00-access.md#site-local-routes #924803f v-141 Level patches at walkY/s, connector patches with pavingHeightfield of the owner's connectorHeight (front-walk.ts:90, side-walk.ts:118); routes through cross connector and side path in 00-access.md:63-65.
   * @evidence principles/core/source-units.md#source-scope-preservation Patches describe emitted paving, not extra slabs or off-site ground.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Patch rects equal emitted parts: front-walk.ts:78 vs :95, :83 vs :100-101; side-walk.ts:98-101 vs :128, :106 vs :129, :111 vs :134-135.
   * @evidence principles/core/source-units.md#source-substantive-completion Each patch supplies an outline and height points for separate cells and surfaces.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 environment.ts:557-563 cells per patch with Y from samples/anchor/rampTo; :565-580 surface per patch.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Front-walk-plan has a T connector and side-walk-plan has front and rear cross bands; patches retain those distinct paving heights under each continuous walking zone.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 front-walk.md:31 T connector; side-walk.md:29-31 front and back bands; patches front-walk.ts:77-102 (walk, connector heightfield), side-walk.ts:97-126 (long, back, connector).
   */
  patches?: readonly { outline: readonly IPlanPoint[]; anchor: IAutoMovieVector3; rampTo: IAutoMovieVector3 | null; height?: IAutoMovieHeightRule }[];
  /**
   * @evidence spaces/site/00-access.md Exterior standing volumes remain provisional until map ground and obstacles arrive.
   * @evidenceReview spaces/site/00-access.md #a8ac95c v-141 house.ts:246-249 marks every zone; environment.ts:734-737 lists them; 00-access.md:69 temporary until maps ground and later occupancy.
   * @evidence spaces/site/00-access.md#site-local-routes The temporary 2.00 m logical volume carries this marker in output.
   * @evidenceReview spaces/site/00-access.md#site-local-routes #924803f v-141 Cells to max+ZONE_HEAD_CLEARANCE (environment.ts:561); output pendingMapGround.zones (:734-737) lists all marked zones; 00-access.md:69 2.00 m volume marked map-ground-pending.
   * @evidence principles/core/source-units.md#source-scope-preservation The status reports map dependency without asserting ground or headroom certification.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 The marker is a literal status string; no ground/headroom claim.
   * @evidence principles/core/source-units.md#source-substantive-completion Consumers can find every exterior zone requiring later map validation.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 environment.ts:736 filters zones by the marker into the output record.
   * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work Source construction exposed the missing temporary volume rule; site access now owns it.
   * @evidenceReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 v-141 git log -S"2.00 m 높이까지 임시로" -> 04df855f added 00-access.md:69 (temporary 2.00 m, map-ground-pending, not stair clearance). Source ZONE_HEAD_CLEARANCE existed since 6520bb2e borrowing the 02-stair clearance; the repair followed.
   */
  pendingMapGround?: "map-ground-pending";
  /**
   * @evidence spaces/site/01-paving-support.md A joined connector retains the same height calculation as its emitted paving.
   * @evidenceReview spaces/site/01-paving-support.md #beb4a05 v-141 groundAt front-walk.ts:72-75 and side-walk.ts:92-95 call the same connectorHeight as blendedRun (:102, :136); 01-paving-support.md:33.
   * @evidence spaces/site/01-paving-support.md#paving-depth-reservation Bilinear connector samples need the source owner's X/Z height, not a single ramp interpolation.
   * @evidenceReview spaces/site/01-paving-support.md#paving-depth-reservation #70f28d6 v-141 01-paving-support.md:27 X and Z interpolation, not a corner plane; observations.ts:343 uses groundAt before the single-ramp patchFloor (:329-335).
   * @evidence principles/core/source-units.md#source-scope-preservation This callback reads the existing paving profile and adds no ground datum.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 The callbacks return walkY/s or connectorHeight only.
   * @evidence principles/core/source-units.md#source-substantive-completion Observation eyes can be placed over the actual sampled connector top.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 observations.ts:343 standingFloor uses zone.groundAt; :378-384 eye = floor + EYE.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Paving-depth-reservation requires the connector top to follow its sampled bilinear height, and groundAt returns that same height at each X/Z point.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 01-paving-support.md:27,33 walkable height uses the original X/Z formula; groundAt returns connectorHeight (the callback blendedRun uses) or the flat level (front-walk.ts:76, side-walk.ts:93-96).
   */
  groundAt?: (x: number, z: number) => number;
}

/**
 * Temporary 2.00 m display height above an exterior zone's standing surface,
 * pending map ground and obstacle inputs (`site/00-access.md#site-local-routes`).
 */
/**
 * @evidence spaces/site/00-access.md ZONE_HEAD_CLEARANCE carries the temporary 2.00 m logical exterior zone volume.
 * @evidenceReview spaces/site/00-access.md #a8ac95c v-141 zone.ts:103 2.0; 00-access.md:69.
 * @evidence spaces/site/00-access.md#site-local-routes The volume is a display datum pending map ground input, not a stair clearance certificate.
 * @evidenceReview spaces/site/00-access.md#site-local-routes #924803f v-141 00-access.md:69: display height, not 02-stair clearance or overhead certification, re-checked after maps.
 * @evidence principles/core/source-units.md#source-scope-preservation This is a logical clearance, not a ceiling slab height or a terrain top.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Used only as cell top offset and connector clearHeight (environment.ts:285,561).
 * @evidence principles/core/source-units.md#source-substantive-completion Environment space cells and exterior connectors receive the same numeric clear height.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 environment.ts:561 cells max+ZONE_HEAD_CLEARANCE; :285 exterior connector clearHeight ZONE_HEAD_CLEARANCE.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work The source exposed a missing exterior zone height; the site access design now declares its temporary value and map-ground pending status.
 * @evidenceReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 v-141 Same history as 930: 04df855f added 00-access.md:69 (value 2.00 m and map-ground-pending); the source constant predates it (6520bb2e).
 */
export const ZONE_HEAD_CLEARANCE = 2.0;

/** What a site owner emits: its zones and its solids. */
/**
 * @evidence spaces/site/00-access.md ISiteBuild carries each site owner's logical standing areas and actual solids together.
 * @evidenceReview spaces/site/00-access.md #a8ac95c v-141 zone.ts:112-127 zones+parts; buildSite returns it with all owners (fence parts appended site.ts:36).
 * @evidence principles/core/source-units.md#source-scope-preservation The pair keeps zone membership with source-owned paving parts without merging their authorship.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Parts keep their own owner fields; zones are a separate list.
 * @evidence principles/core/source-units.md#source-substantive-completion Both required arrays give buildSite a usable assembly boundary.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 site.ts:27-37 returns ISiteBuild from the four ISiteBuild owners plus fence.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-access-interface supplies named exterior standing zones and exterior-surface-handoff assigns visible paving to each source owner; ISiteBuild returns those two outputs together.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 00-access.md:29 exterior zones of house-site; 03-surface-owners.md:50-54 assign the paving and fence files; ISiteBuild (zone.ts:115-130) is {zones, parts}.
 */
export interface ISiteBuild {
  /**
   * @evidence spaces/site/00-access.md `zones` lists the named exterior places an owner contributes to route queries.
   * @evidenceReview spaces/site/00-access.md #a8ac95c v-141 Mostly true, but side-walk.ts:122-126 contributes zone "side-walk" that no route uses (05-route-network.md:33-49, routes.ts:70-84 use side-front-access/side-rear-access only).
   * @evidence principles/core/source-units.md#source-scope-preservation The array contains standing records, not duplicate slabs.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 IExteriorZone records only; parts are separate.
   * @evidence principles/core/source-units.md#source-substantive-completion A required typed list lets buildSite concatenate all site zones in fixed order.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 site.ts:35 builds.flatMap((b) => b.zones) in fixed order.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-local-routes uses front-walk, driveway, side access, terrace, and lower landing as existing walking places; zones collects their emitted records.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 00-access.md:63-65 routes use these places; zones: IExteriorZone[] is concatenated by site.ts:35.
   */
  zones: IExteriorZone[];
  /**
   * @evidence spaces/site/00-access.md `parts` carries actual paving or fence solids from the site owner.
   * @evidenceReview spaces/site/00-access.md #a8ac95c v-141 ISiteBuild.parts from walk/drive/terrace owners and fence via site.ts:36.
   * @evidence principles/core/source-units.md#source-scope-preservation The array retains each part's owner id instead of reconstructing a merged site mesh.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Each IHousePart keeps its owner; site.ts:36 concatenates without merging.
   * @evidence principles/core/source-units.md#source-substantive-completion A required IHousePart list gives house assembly concrete geometry to lower.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 house.ts:171 ...site.parts lowered to models/elements in environment.ts.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Exterior-surface-handoff assigns the front walk, drive, side walk, and terrace their own paving bodies; parts collects those emitted IHousePart records without claiming their faces.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 03-surface-owners.md:50-53 assigns front-walk, driveway, terrace and side-walk paving files; parts: IHousePart[] (zone.ts:129) keeps each part's owner id. Names the parent and a concrete fact. Fixes v141 UNANSWERED.
   */
  parts: IHousePart[];
}
