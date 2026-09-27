/**
 * Exterior zone record: one named outdoor place on the site paving that the
 * route network (`docs/spaces/05-route-network.md#room-route-network`) starts
 * from, passes or ends at, or a continuous standing area sampled by the viewer.
 *
 * Owners: `porch.ts` (front-porch), `site/front-walk.ts`, `site/driveway.ts`,
 * `site/terrace.ts` (garden-terrace, garden-lower-landing) and
 * `site/side-walk.ts` (side-front-access, side-rear-access). Each zone is a
 * use area of its owner's paving, not a new slab: its plan outline, and its
 * standable ground as one anchor point, plus a second point when the ground
 * ramps (the driveway). The built-environment record turns each zone into a
 * logical space in `ground-storey` under `house-site` from the ground up to
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
 * @evidenceReview spaces/site/00-access.md #a8ac95c IExteriorZone separates a named logical exterior place and its owner, outline and standing heights from ISiteBuild.parts; buildHouseEnvironment turns each record into ground-storey cells and surfaces as site access specifies.
 * @evidence principles/core/source-units.md#source-scope-preservation The record is a logical zone and does not duplicate a paving slab or map terrain.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The type records a zone's plan and height inputs; ISiteBuild.parts holds the physical paving, while this declaration creates no slab or map ground.
 * @evidence principles/core/source-units.md#source-substantive-completion Id, owner, outline, anchor, and nullable ramp end give environment assembly a usable bounded place.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f buildHouseEnvironment uses the required id and outline or patches to form cells, uses the anchor and ramp end for surfaces, and passes owner to rectangle validation; the nullable ramp is present on every record.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-access-interface places named exterior standing zones below house-site while exterior-surface-handoff assigns their paving bodies to site and porch owners; this type carries that existing pair.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The site-access-interface binds exterior access to the ground storey and the exterior-surface-handoff assigns porch and site paving to separate files; IExteriorZone carries that pairing through id and owner without finding a missing parent decision.
 */
export interface IExteriorZone {
  /** Zone id used for a logical exterior area; route edges select some ids. */
  /**
   * @evidence spaces/site/00-access.md This id names an exterior standing area; route edges select the access areas they traverse.
   * @evidenceReview spaces/site/00-access.md #a8ac95c buildSideWalk emits a continuous side-walk zone and separate side-front-access and side-rear-access zones; the route records use the access ids, while buildHouseEnvironment still builds the continuous zone as a logical area.
   * @evidence principles/core/source-units.md#source-scope-preservation It identifies a zone, not a new part or off-site network node.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 buildHouseEnvironment copies id to the logical space and surface association; the corresponding paving remains in parts and this id creates no outside network node.
   * @evidence principles/core/source-units.md#source-substantive-completion A required string gives every built exterior space a stable key that selected connectors and route edges can share.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f buildHouseEnvironment sets the space id from zone.id, exteriorConnectors finds its selected zone ids, and route assembly refers to those same selected ids; side-walk remains a valid space without a route edge.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-local-routes names front-walk, driveway, side access, garden terrace, and lower landing as route places; id preserves each emitted zone name.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The site-local-routes parent names the front walk, driveway, terrace, lower landing and side access places; buildSideWalk names its two access zones accordingly and also names its continuous walking surface for space observation.
   */
  id: string;
  /** Source owner path under `src/spaces`. */
  /**
   * @evidence spaces/site/00-access.md `owner` carries the source path of the paving that supplies this standing area.
   * @evidenceReview spaces/site/00-access.md #a8ac95c Each site builder sets zone.owner to its own site file path and the porch zone uses porch.ts; these records retain the paving source named by the access design.
   * @evidence principles/core/source-units.md#source-scope-preservation The field points to an existing site or porch author and does not transfer surface authorship.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The source path is metadata on the logical zone; each paving IHousePart retains its own owner and the zone field does not transfer its visible surfaces.
   * @evidence principles/core/source-units.md#source-substantive-completion A required owner string identifies the source when buildHouseEnvironment validates each zone outline.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f buildHouseEnvironment passes zone.owner to rectangles for contextual validation errors; cell placement comes from the outline and height fields, so owner supplies diagnostic provenance rather than coordinates.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 03-surface-owners.md#exterior-surface-handoff assigns front-walk, driveway, side-walk, and terrace their own paving; this owner field preserves those returned names.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The exterior-surface-handoff names front-walk.ts, driveway.ts, side-walk.ts and terrace.ts as the respective complete paving owners; each returned zone's owner string names its emitting file without changing that allocation.
   */
  owner: string;
  /** Plan outline, world X/Z metres, axis-aligned edges. */
  /**
   * @evidence spaces/site/00-access.md The outline bounds the logical walking zone over its owner's paving.
   * @evidenceReview spaces/site/00-access.md #a8ac95c The driveway and terrace builders set zone outlines to their paving rectangles; front-walk and side-walk outline their joined paving strips while patches describe each constituent band.
   * @evidence principles/core/source-units.md#source-scope-preservation It is a plan record and does not extrude another visible slab.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 buildHouseEnvironment reads each zone outline for logical cells and a standable surface polygon; physical slab geometry is supplied separately by the owning site's parts.
   * @evidence principles/core/source-units.md#source-substantive-completion Ordered world X/Z points can be decomposed into engine space cells.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f buildHouseEnvironment passes the outline or each patch outline to rectangles and turns the returned rectangles into space cells, so the typed X/Z sequence is a usable cell boundary.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-local-routes locates logical volumes above the walking surfaces, and exterior-surface-handoff assigns each complete paving body to its site owner; outline carries those owners' emitted walking boundaries without parcel terrain.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Site-local-routes requires the volume above each walking surface while exterior-surface-handoff assigns the paving to front-walk, driveway, side-walk and terrace; their zone outlines follow their own emitted plan rectangles or unions, with no new terrain outline.
   */
  outline: readonly IPlanPoint[];
  /** A point of the standable ground. */
  /**
   * @evidence spaces/site/00-access.md `anchor` records a point on the zone's standable top in world coordinates.
   * @evidenceReview spaces/site/00-access.md #a8ac95c buildDriveway obtains the anchor Y from driveTop; buildFrontWalk and buildSideWalk use their walking tops, and buildTerrace uses its raised and lower top values for the two waiting zones.
   * @evidence principles/core/source-units.md#source-scope-preservation It references paving height and cannot author an independent terrain elevation.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The driveway, walk and terrace builders reuse the height values supplied to their paving solids when filling anchor.y; anchor adds no independent ground or terrain elevation.
   * @evidence principles/core/source-units.md#source-substantive-completion The required vector makes the zone's floor surface queryable by the engine.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f buildHouseEnvironment uses the zone anchor for an unpatched surface and each patch anchor for joined walks, leaving the engine a concrete standing point for surface queries.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-local-routes starts each logical volume at its walking surface, and paving-depth-reservation requires walking height and opaque paving to consume one height formula; anchor transports a point on that source-owned top.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Site-local-routes fixes the logical volume's lower surface and paving-depth-reservation couples walkable and opaque tops; driveway and terrace anchors reuse their part heights, so this field needs no new standing-height decision.
   */
  anchor: IAutoMovieVector3;
  /** Second point for a whole-zone ramp; null when slope is held in patches or absent. */
  /**
   * @evidence spaces/site/00-access.md `rampTo` records the second point of a whole-zone ramp or null when slope is absent or represented by patches.
   * @evidenceReview spaces/site/00-access.md #a8ac95c buildDriveway sets rampTo at the opposite driveway Z end; buildFrontWalk and buildSideWalk use null on their joined zones because their sloped connectors are represented by patch heights, and level terrace zones also use null.
   * @evidence principles/core/source-units.md#source-scope-preservation It classifies the existing driveway grade rather than drawing a new connector.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The driveway zone obtains rampTo.y from driveTop at its far end while the driveway slab remains in buildDriveway.parts; this point does not generate another paving body.
   * @evidence principles/core/source-units.md#source-substantive-completion The vector/null union lets environment assembly emit a ramp or platform with no guessed slope.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f buildHouseEnvironment classifies a patch surface as platform or ramp from its nullable rampTo and passes its height rule or two points to the built surface; whole-zone driveway input reaches that path through the fallback patch.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Driveway-plan interpolates between garage floor and front-walk height, so rampTo stores its second datum while flat porch and terrace zones use null.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The driveway-plan parent fixes the garage-to-front-walk height run; buildDriveway reuses driveTop for rampTo, while porch and terrace waiting zones are level, so the nullable field exposes no missing parent grade.
   */
  rampTo: IAutoMovieVector3 | null;
  /**
   * @evidence spaces/site/00-access.md Joined exterior walks can expose their actual standing bands as one zone.
   * @evidenceReview spaces/site/00-access.md #a8ac95c buildFrontWalk emits one front-walk zone with flat and connector patches, and buildSideWalk emits a continuous side-walk zone with long, rear and connector patches; buildHouseEnvironment keeps one space id while adding cells and surfaces for each patch.
   * @evidence spaces/site/00-access.md#site-local-routes Each patch retains its paving owner's grade while the zone stays continuous.
   * @evidenceReview spaces/site/00-access.md#site-local-routes #924803f The front walk and side path builders set flat patch anchors at their paving tops and connector patch heightfields from their own connectorHeight functions, preserving the distinct walking bands used by the local routes.
   * @evidence principles/core/source-units.md#source-scope-preservation Patches describe emitted paving, not extra slabs or off-site ground.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 buildFrontWalk and buildSideWalk give patch outlines the same flat and connector footprints used by their slopedSlab and blendedRun parts; the optional records add no second physical paving.
   * @evidence principles/core/source-units.md#source-substantive-completion Each patch supplies an outline and height points for separate cells and surfaces.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f buildHouseEnvironment iterates each patch to produce cells from its outline and height samples or points, then emits a matching built surface, so the optional patch array supplies the complete joined-zone boundary.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Front-walk-plan has a T connector and side-walk-plan has front and rear cross bands; patches retain those distinct paving heights under each continuous walking zone.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Front-walk-plan specifies the T connector and side-walk-plan specifies the front and rear bands; the two builders' flat and heightfield patches use those same owned footprints and grades without asking a parent for another route or surface.
   */
  patches?: readonly { outline: readonly IPlanPoint[]; anchor: IAutoMovieVector3; rampTo: IAutoMovieVector3 | null; height?: IAutoMovieHeightRule }[];
  /**
   * @evidence spaces/site/00-access.md Exterior standing volumes remain provisional until map ground and obstacles arrive.
   * @evidenceReview spaces/site/00-access.md #a8ac95c buildHouse maps both porch and site zones to the literal map-ground-pending status; buildHouseEnvironment includes their ids in pendingMapGround.zones, matching the site's provisional exterior-volume rule.
   * @evidence spaces/site/00-access.md#site-local-routes The temporary 2.00 m logical volume carries this marker in output.
   * @evidenceReview spaces/site/00-access.md#site-local-routes #924803f buildHouseEnvironment extends each zone patch cell to its highest sampled top plus ZONE_HEAD_CLEARANCE and returns ids with this marker in pendingMapGround.zones; the parent calls that a temporary representation pending maps.
   * @evidence principles/core/source-units.md#source-scope-preservation The status reports map dependency without asserting ground or headroom certification.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 pendingMapGround is a literal status marker carried into the built environment; it neither supplies terrain geometry nor asserts that overhead obstacles have been measured.
   * @evidence principles/core/source-units.md#source-substantive-completion Consumers can find every exterior zone requiring later map validation.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f buildHouseEnvironment filters all house zones by this exact status and records their ids in pendingMapGround.zones, giving downstream consumers an explicit validation list.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-local-routes already sets the provisional 2.00 m zone volume and map-ground-pending status; the marker exposes that parent decision without requiring a further design change.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Site-local-routes explicitly makes the volume temporary and requires later map and occupancy checks; buildHouse attaches that status to exterior zones and buildHouseEnvironment returns the marked ids, so this field finds no missing parent status rule.
   */
  pendingMapGround?: "map-ground-pending";
  /**
   * @evidence spaces/site/01-paving-support.md A joined connector retains the same height calculation as its emitted paving.
   * @evidenceReview spaces/site/01-paving-support.md buildFrontWalk and buildSideWalk use the same connectorHeight functions in their groundAt callbacks and blendedRun paving builders; observation sampling and visible connector tops therefore consume the owner's height rule.
   * @evidence spaces/site/01-paving-support.md#paving-depth-reservation Bilinear connector samples need the source owner's X/Z height, not a single ramp interpolation.
   * @evidenceReview spaces/site/01-paving-support.md#paving-depth-reservation #a4d8a4d Paving-depth-reservation requires X and Z interpolation across the connector; buildObservations calls zone.groundAt before patchFloor, so a joined walk reports its actual bilinear top rather than a two-point ramp substitute.
   * @evidence principles/core/source-units.md#source-scope-preservation This callback reads the existing paving profile and adds no ground datum.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The walk callbacks return either their owner-defined flat paving top or connectorHeight; neither callback authors independent terrain elevation or a second slab.
   * @evidence principles/core/source-units.md#source-substantive-completion Observation eyes can be placed over the actual sampled connector top.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f buildObservations standingFloor calls groundAt at the requested X/Z before its patch fallback, then places an observation eye at the returned floor plus EYE, so the callback is a usable standing-height boundary.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Paving-depth-reservation requires the connector top to follow its sampled bilinear height, and groundAt returns that same height at each X/Z point.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Paving-depth-reservation requires the walkable and opaque connector tops to use the same X/Z rule; both joined walk builders pass connectorHeight to their paving and groundAt, with flat bands returned at their authored level.
   */
  groundAt?: (x: number, z: number) => number;
}

/**
 * Temporary 2.00 m display height above an exterior zone's standing surface,
 * pending map ground and obstacle inputs (`site/00-access.md#site-local-routes`).
 */
/**
 * @evidence spaces/site/00-access.md ZONE_HEAD_CLEARANCE carries the temporary 2.00 m logical exterior zone volume.
 * @evidenceReview spaces/site/00-access.md #a8ac95c ZONE_HEAD_CLEARANCE is 2.0 and buildHouseEnvironment adds it above each exterior patch's highest standing sample, implementing the site's temporary logical volume.
 * @evidence spaces/site/00-access.md#site-local-routes The volume is a display datum pending map ground input, not a stair clearance certificate.
 * @evidenceReview spaces/site/00-access.md#site-local-routes #924803f Site-local-routes calls 2.00 m a provisional representation pending maps and occupancy; the constant only sizes logical cells and connector clearHeight, without checking actual overhead obstacles.
 * @evidence principles/core/source-units.md#source-scope-preservation This is a logical clearance, not a ceiling slab height or a terrain top.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 buildHouseEnvironment reads this value for exterior cell tops and exteriorConnectors reads it for declared clearHeight; no physical ceiling or terrain part is built from it.
 * @evidence principles/core/source-units.md#source-substantive-completion Environment space cells and exterior connectors receive the same numeric clear height.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f buildHouseEnvironment raises each patch cell top by this exported value and exteriorConnectors passes the same value as clearHeight, giving both consumers a deterministic temporary datum.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-local-routes already fixes the 2.00 m temporary display volume and map-ground-pending status; this exported value carries that parent decision without a further design repair.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The site-local-routes parent expressly sets a 2.00 m temporary height over each walking top and defers real clearance checks; ZONE_HEAD_CLEARANCE supplies that number to cells and connectors without finding a missing parent height.
 */
export const ZONE_HEAD_CLEARANCE = 2.0;

/** What a site owner emits: its zones and its solids. */
/**
 * @evidence spaces/site/00-access.md ISiteBuild carries each site owner's logical standing areas and actual solids together.
 * @evidenceReview spaces/site/00-access.md #a8ac95c ISiteBuild requires zones and parts arrays; buildSite concatenates walk, drive, side path and terrace zones and parts, then appends fence parts, keeping logical use areas with the site's physical output.
 * @evidence principles/core/source-units.md#source-scope-preservation The pair keeps zone membership with source-owned paving parts without merging their authorship.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 ISiteBuild keeps typed logical zones apart from IHousePart solids; buildSite concatenates returned records without claiming a shared geometry owner.
 * @evidence principles/core/source-units.md#source-substantive-completion Both required arrays give buildSite a usable assembly boundary.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f buildSite constructs both required arrays from four paving builders and buildFence in fixed order; downstream house assembly can consume zones and parts without inventing a missing site return field.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-access-interface supplies named exterior standing zones and exterior-surface-handoff assigns visible paving to each source owner; ISiteBuild returns those two outputs together.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Site-access-interface assigns site.ts access assembly and exterior-surface-handoff assigns the four paving and fence files; ISiteBuild returns their zone and part populations without adding a parcel-boundary decision.
 */
export interface ISiteBuild {
  /**
    * @evidence spaces/site/00-access.md `zones` lists exterior standing areas, including access places used by route queries and continuous areas used by spatial observation.
    * @evidenceReview spaces/site/00-access.md #a8ac95c buildSideWalk contributes a continuous side-walk zone as well as the two access zones used by routes; buildSite collects all three, and house assembly passes every zone to built-space and observation consumers.
   * @evidence principles/core/source-units.md#source-scope-preservation The array contains standing records, not duplicate slabs.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The array type holds IExteriorZone records only; visible slabs stay in the separate parts array returned by each builder.
   * @evidence principles/core/source-units.md#source-substantive-completion A required typed list lets buildSite concatenate all site zones in fixed order.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f buildSite flatMaps zones from the fixed front-walk, driveway, side-walk and terrace builder order, giving house assembly a deterministic zone list.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-local-routes uses front-walk, driveway, side access, terrace, and lower landing as existing walking places; zones collects their emitted records.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Site-local-routes orders the front and rear walking places while requiring exterior observation questions; the builders emit their logical zones and buildSite collects them without inventing another outside network node.
   */
  zones: IExteriorZone[];
  /**
   * @evidence spaces/site/00-access.md `parts` carries actual paving or fence solids from the site owner.
    * @evidenceReview spaces/site/00-access.md #a8ac95c buildSite concatenates paving parts from the four walking and driving builders and appends buildFence's fixed solids, matching the site assembly's owned outdoor parts.
   * @evidence principles/core/source-units.md#source-scope-preservation The array retains each part's owner id instead of reconstructing a merged site mesh.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 buildSite preserves each returned IHousePart and its owner field when it appends the builder arrays; no merged site mesh replaces the separate paving and fence owners.
   * @evidence principles/core/source-units.md#source-substantive-completion A required IHousePart list gives house assembly concrete geometry to lower.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f buildHouse spreads site.parts into its house parts, and buildHouseEnvironment lowers those parts to models and elements; the required typed array provides concrete geometry to the assembly.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Exterior-surface-handoff assigns the front walk, drive, side walk, and terrace their own paving bodies; parts collects those emitted IHousePart records without claiming their faces.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Exterior-surface-handoff assigns front-walk, driveway, side-walk and terrace their complete paving bodies; parts carries the records emitted by those files, retaining their owner ids rather than making new site-owned faces.
   */
  parts: IHousePart[];
}
