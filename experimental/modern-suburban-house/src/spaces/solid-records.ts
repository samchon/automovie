/**
 * Space solid records shared by geometry emitters, the built-environment
 * adapter, measurements and the source viewer. Coordinates are world metres
 * in right-handed Y-up space. A wall face retains the pre-cut outline and
 * authored voids so boundary assembly can inspect the same body it renders.
 * These declarations and the part constructor select no surface owner; each
 * emitting source supplies its own id, role, dimensions and mesh.
 */
import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * What a part is, so the viewer and later reviews can group it.
 * @evidence spaces/03-surface-owners.md Surface families are allocated to their emitting spaces owners.
 * @evidenceReview spaces/03-surface-owners.md #a830535 HousePartRole labels wall, roof, floor, stair and site parts; the owner field remains separate so each family in the surface-owner table can retain its emitting file.
 * @evidence spaces/03-surface-owners.md#exterior-surface-handoff Exterior roles distinguish envelope, roof, porch, site and chimney parts.
 * @evidenceReview spaces/03-surface-owners.md#exterior-surface-handoff #b1ed234 The union provides wall, roof, porch, paving, fence and chimney labels for the separately assigned exterior bodies in the owner table.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff Floor and ceiling roles identify room finish parts made by their room owners.
 * @evidenceReview spaces/03-surface-owners.md#interior-surface-handoff #dae8f88 The floor and ceiling variants can label the finishes the interior handoff assigns to each room; partition and stair variants do not transfer structural ownership to a room.
 * @evidence principles/core/source-units.md#source-scope-preservation This role labels an assigned part without claiming its surface for the helper.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 HousePartRole is a string union without an owner or mesh; IHousePart carries those separately, leaving the selected emitting file responsible for the surface.
 * @evidence principles/core/source-units.md#source-substantive-completion The viewer can group every emitted structural or finish family.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The role union is carried by each IHousePart into the environment element kind and the viewer finish lookup, so consumers can group emitted parts by their declared family.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The surface-owner table allocates exterior bodies and the interior handoff allocates room finishes; this role union labels those parts without assigning a new owner.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 HousePartRole supplies labels for the exterior and room-finish bodies allocated in the surface-owner document, while IHousePart.owner supplies the emitting file; the label type requires no change to those allocations.
 */
export type HousePartRole =
  | "wall"
  | "partition"
  | "floor"
  | "ceiling"
  | "roof"
  | "stair"
  | "guard"
  | "porch"
  | "chimney"
  | "paving"
  | "fence";

/**
 * One emitted solid: a stable id, the source owner that authors it, its role,
 * its base colour, and its world-space mesh.
 * @evidence spaces/03-surface-owners.md Every surface part keeps the identity of its assigned emitting owner.
 * @evidenceReview spaces/03-surface-owners.md #a830535 IHousePart requires an owner alongside each mesh; part() copies its caller's owner, matching the document's allocation of a complete surface to one source file.
 * @evidence spaces/03-surface-owners.md#exterior-surface-handoff Exterior parts preserve one author for each emitted body.
 * @evidenceReview spaces/03-surface-owners.md#exterior-surface-handoff #b1ed234 The record holds one owner string for each emitted exterior body; part() preserves the file supplied by the envelope, roof, porch or site emitter.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff Room parts retain the owner of their floor and ceiling finish.
 * @evidenceReview spaces/03-surface-owners.md#interior-surface-handoff #dae8f88 IHousePart.owner remains attached to roomFloor and roomCeiling parts from rooms/shared.ts, allowing the room named in the interior handoff to remain their finish owner.
 * @evidence principles/core/source-units.md#source-scope-preservation The record carries an owner's geometry without making this helper the surface owner.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 IHousePart describes the emitted record and part() copies the caller's owner; this shared record does not select a surface file.
 * @evidence principles/core/source-units.md#source-substantive-completion Identity, owner, role, colour, mesh and optional wall face reach consumers together.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The required id, owner, role, color and mesh fields plus optional wall face form one usable part record; part() constructs it and the environment adapter consumes its mesh, role and face.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Exterior-surface-handoff assigns envelope and site bodies by source file and interior-surface-handoff assigns each room's finishes; IHousePart retains those owner ids with the meshes.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The exterior table and interior handoff identify emitting files; IHousePart carries each emitted mesh with its supplied owner, so this record adds no competing allocation.
 */
export interface IHousePart {
  /**
   * @evidence spaces/03-surface-owners.md Each emitted body retains its own id beside the assigned surface owner.
   * @evidenceReview spaces/03-surface-owners.md #a830535 The id and owner fields coexist on each IHousePart; the surface-owner table assigns the body while house.ts rejects duplicate ids during assembly. This field does not claim that the later complete surface census is finished.
   * @evidence principles/core/source-units.md#source-scope-preservation The id names an emitted part rather than a second owner.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The id field addresses the emitted part while the separate owner field carries the source file, so an id cannot reassign its surface.
   * @evidence principles/core/source-units.md#source-substantive-completion A unique id supports mesh and boundary census.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f house.ts rejects duplicate part ids; the environment adapter uses each id for its element and pending-ground report, giving consumers a stable address for the emitted record.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Exterior-surface-handoff requires each completed body to have one source owner, and the geometry census addresses garage-shared-wall and room floors by part id; this field keeps those emitted addresses.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The surface-owner table assigns complete bodies by file; this id field distinguishes their emitted records for the house duplicate check and part measurements without changing that allocation.
   */
  id: string;
  /**
   * @evidence spaces/03-surface-owners.md The source path identifies the part's assigned surface author.
   * @evidenceReview spaces/03-surface-owners.md #a830535 The owner string stores the emitting source path, such as an envelope or room file, which is the unit named by the exterior table and interior handoff.
   * @evidence principles/core/source-units.md#source-scope-preservation The helper retains the caller's ownership rather than assigning itself.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 part() requires an owner argument and copies it into IHousePart; solid-records.ts cannot silently substitute itself as the source.
   * @evidence principles/core/source-units.md#source-substantive-completion Consumers can trace every part to a source owner.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The environment adapter and viewer receive the owner with each part, allowing an emitted body to be traced back to its source file.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Exterior-surface-handoff assigns the lower garage shared wall to garage.ts and the upper siding to envelope/right.ts; owner preserves that split for each part.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The surface-owner table divides the garage shared wall at the roof weather line; garage.ts and envelope/right.ts pass distinct owner strings for their respective bodies, and part() preserves them.
   */
  owner: string;
  /**
   * @evidence spaces/03-surface-owners.md The role groups a surface part by its spatial function.
   * @evidenceReview spaces/03-surface-owners.md #a830535 The role field accepts HousePartRole while the owner field still names the source file; the exterior and room tables allocate files for those part families.
   * @evidence principles/core/source-units.md#source-scope-preservation Classification does not transfer ownership between room and envelope authors.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Role and owner are independent IHousePart fields, so classifying a part as a wall or floor does not change its author.
   * @evidence principles/core/source-units.md#source-substantive-completion Viewer and review census can separate walls, floors, roof and site parts.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The environment element kind uses role, roof-overlap selects roof parts, and exterior-support selects paving and porch parts; this field gives those consumers a usable category.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-surface-handoff separates room finish from partition and exterior-surface-handoff separates roof from wall; role carries those distinctions into the viewer census.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The source allocation distinguishes roof slopes, walls and room finishes; role carries that distinction on each emitted part while owner retains the file chosen by the allocation.
   */
  role: HousePartRole;
  /**
   * @evidence spaces/03-surface-owners.md The emitted part keeps its colour beside the source owner assigned to that surface.
   * @evidenceReview spaces/03-surface-owners.md #a830535 The colour number is a field on the same IHousePart as owner and mesh; callers supply it to part() without changing the emitting file assigned by the surface-owner table.
   * @evidence principles/core/source-units.md#source-scope-preservation The field is a flat source colour, leaving texture and optics to materials.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The field is only a numeric base colour; it carries no texture image, repeat length or optical parameter reserved for materials by the visual-grammar setting.
   * @evidence principles/core/source-units.md#source-substantive-completion The mesh has a reproducible visible colour for inspection.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Each part carries a colour number consumed by environment.ts as its base colour and by materialPreview.ts with the role as a finish key.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The room source still owns its visible finish; color carries a blocking value on that owner's emitted part without changing the surface allocation.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The interior handoff assigns room finishes to room files; color accompanies each part while owner keeps that file, so the colour field introduces no new finish owner.
   */
  color: number;
  /**
   * @evidence spaces/03-surface-owners.md The assigned owner emits a world-space body for its surface.
   * @evidenceReview spaces/03-surface-owners.md #a830535 IHousePart.mesh holds the geometry emitted by the assigned envelope, roof, site or room source; the record does not generate a competing surface.
   * @evidence principles/core/source-units.md#source-scope-preservation This field carries the caller's mesh rather than synthesizing another surface owner.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 part() copies the caller solid's mesh into IHousePart while keeping the supplied owner; this field does not author another body.
   * @evidence principles/core/source-units.md#source-substantive-completion Triangles, normals and indices reach the deterministic viewer.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f environment.ts uses the supplied mesh as the part's model geometry, giving the viewer its triangle positions, normals and indices.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Exterior-surface-handoff requires actual envelope, roof and site bodies from their owners, and interior-surface-handoff requires room finish bodies; mesh transports each resulting geometry.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The exterior table and interior room handoff allocate emitted bodies to files; mesh transports each assigned file's result through part() without changing those owners.
   */
  mesh: IAutoMovieMesh;
  /**
   * @evidence spaces/03-surface-owners.md A wall part may expose its opening-bearing boundary alongside the mesh.
   * @evidenceReview spaces/03-surface-owners.md #a830535 The exterior handoff gives the elevation owner its wall body, void and cut face; IHousePart.wall retains the face beside the owner's mesh when part() receives a wall solid.
   * @evidence principles/core/source-units.md#source-scope-preservation Only an emitted wall or partition supplies this face.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 IHousePart.wall is optional and part() fills it only for a solid with a face; a plain mesh receives no extra wall boundary.
   * @evidence principles/core/source-units.md#source-substantive-completion Openings can be hosted on the same wall body that was cut.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f environment-links.ts takes openings from the wall face of the same part that supplies the mesh; house.ts also locates a door host through part.wall.holes.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work External-opening-interface places a rough door/window void in the boundary wall and leaves its fill to models; wall carries that cut face beside the emitting wall mesh.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The opening interface assigns the rough void to its wall owner and the fill to later models; wall carries the cut face with that owner's mesh rather than allocating a second opening surface.
   */
  wall?: IWallFace;
  /**
   * @evidence spaces/10-ground-floor.md Exterior walls at the temporary display bottom retain pending map-ground status.
   * @evidenceReview spaces/10-ground-floor.md #9f27f8e house.ts marks exterior walls whose outline reaches EXTERIOR_WALL_BOTTOM; pendingMapGround records the unresolved support that the ground-floor handoff separates from its display cut.
   * @evidence spaces/site/fence.md#fence-ground-profile Fence parts retain pending map-ground status at their temporary display bottom.
   * @evidenceReview spaces/site/fence.md#fence-ground-profile #8697d24 house.ts marks every fence part pending; the fence-ground profile reserves its displayed lower edge until maps supplies the actual ground at each centreline point.
   * @evidence spaces/10-ground-floor.md#ground-support-handoff The marker distinguishes a temporary wall display bottom from structural support.
   * @evidenceReview spaces/10-ground-floor.md#ground-support-handoff #e70bb49 The marker is a status string, not a height; house.ts applies it to exterior wall parts at the provisional EXTERIOR_WALL_BOTTOM, as the handoff requires.
   * @evidence principles/core/source-units.md#source-scope-preservation This is a review status on an emitted part, never a terrain datum.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The optional literal records pending ground status without assigning a terrain height or changing the part's emitting owner.
   * @evidence principles/core/source-units.md#source-substantive-completion Downstream inspection can identify provisional ground contacts by part id.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f environment.ts filters pendingMapGround parts and exposes their ids in its pending-ground report, so the status is observable downstream.
   * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work The ground-support and fence-ground handoffs declare temporary display bottoms; this field exposes their pending status without resolving map contact.
   * @evidenceReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The ground-floor handoff marks wall display closure pending and the fence-ground profile marks fence display closure pending; house.ts applies the field to both part families, leaving actual ground contact for maps.
   */
  pendingMapGround?: "map-ground-pending";
}

/**
 * The face of one wall panel before its voids are cut: the boundary record a
 * built environment hosts openings on. `outline` is the panel outline in the
 * panel's (u, y); `holes` are its voids, each a door, window or open passage.
 * @evidence spaces/07-boundary-assembly.md One wall body retains the boundary record used at room and envelope junctions.
 * @evidenceReview spaces/07-boundary-assembly.md #007d289 IWallFace carries one wall's axis, thickness, outline and cuts; part() attaches that face to the emitted mesh, and environment-links.ts derives sided boundary segments from it.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-ownership A partition's face and openings belong to its single wall body.
 * @evidenceReview spaces/07-boundary-assembly.md#interior-boundary-ownership #6a03f13 straightWall returns a mesh and complete face for one partition run; part() keeps that pair under the caller's owner, so its door cut remains on the common body.
 * @evidence spaces/07-boundary-assembly.md#exterior-boundary-junctions The exterior corner's assigned wall body retains its own cut face without creating a second corner part.
 * @evidenceReview spaces/07-boundary-assembly.md#exterior-boundary-junctions #11dbbb5 IWallFace describes the face of the wall actually emitted by its owner; the front and rear panels take their assigned corner body while side-wall runs stop at their inner faces, so this type introduces no corner body.
 * @evidence principles/core/source-units.md#source-scope-preservation This record describes the caller's wall and does not own the room or facade.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The interface retains axis, across, outline and holes supplied by the wall emitter; it sets no room or facade dimensions.
 * @evidence principles/core/source-units.md#source-substantive-completion Axis, thickness, outline and void list define the inspection boundary.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f environment-links.ts uses axis and across to place boundary faces, clips outline for sided segments, and binds holes to those segments, making this record usable for inspection.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-ownership pairs each partition body with its void host, while exterior-boundary-junctions allows the garage/main wall's lower and upper bodies to carry separate faces.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The boundary document assigns one partition body and divides the garage contact by height; each resulting wall solid has its own IWallFace and owner, matching those two existing assignments.
 */
export interface IWallFace {
  /**
   * @evidence spaces/07-boundary-assembly.md A wall boundary runs along one world horizontal axis.
   * @evidenceReview spaces/07-boundary-assembly.md #007d289 The axis union is limited to world X or Z, the two horizontal directions of the assigned straight wall runs in the boundary assembly.
   * @evidence principles/core/source-units.md#source-scope-preservation The axis describes the assigned wall's local frame only.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The axis field records the orientation passed to wallPanel by an assigned wall owner and chooses no new run.
   * @evidence principles/core/source-units.md#source-substantive-completion Consumers can orient holes and boundary checks in that frame.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f boundaries.ts uses face.axis to map u into world X or Z, and environment-links.ts uses it to orient the boundary plane and its openings.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-junctions gives each straight partition a horizontal run and exterior-boundary-junctions gives each facade a wall line; axis records whether that run is world X or Z.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The assigned facade and partition emitters supply X or Z wall runs to wallPanel; recording that choice on IWallFace does not revise the boundary allocation.
   */
  axis: "x" | "z";
  /**
   * @evidence spaces/07-boundary-assembly.md The wall records its thickness across the running axis.
   * @evidenceReview spaces/07-boundary-assembly.md #007d289 The across pair stores the two world coordinates of the assigned wall thickness that the boundary assembly says the room and envelope junctions must share.
   * @evidence principles/core/source-units.md#source-scope-preservation This range is the caller's wall thickness, not a second boundary.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 wallPanel receives across from its caller and uses that interval for extrusion depth and placement, without selecting a new wall band.
   * @evidence principles/core/source-units.md#source-substantive-completion It locates both faces of the one emitted wall body.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f wallPanel extrudes by the difference of across endpoints and centres the mesh at their midpoint, placing both faces at the supplied coordinates.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Main-building-extent reserves 0.25 m exterior walls and interior-boundary-junctions uses the assigned partition band; across carries both physical faces of the selected wall.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Building and boundary sources provide the exterior or partition wall band; across records the caller's two faces rather than setting another thickness or owner.
   */
  across: readonly [number, number];
  /**
   * @evidence spaces/07-boundary-assembly.md The outer panel trace remains available after cutting openings.
   * @evidenceReview spaces/07-boundary-assembly.md #007d289 wallPanel retains the supplied polygon as face.outline; straightWall retains its full rectangular face even when the emitted mesh uses bottom door notches.
   * @evidence principles/core/source-units.md#source-scope-preservation The trace belongs to the existing emitted wall.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The outline field records the emitting wall's boundary in its own u/Y frame and does not draw a second panel.
   * @evidence principles/core/source-units.md#source-substantive-completion It allows void and junction validation against full wall bounds.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f boundaries.ts derives wall segments from face.outline, and environment-links.ts clips that outline to each sided segment before assigning openings.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-ownership requires a partition body around its door void and front-roof-closures requires the complete front facade; outline retains the pre-cut perimeter for either owner.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The partition parent assigns one cut body and the front facade parent assigns a complete wall closure; wallPanel retains the supplied pre-cut outline while straightWall keeps a full face around its door notch, so neither parent needs a new perimeter rule.
   */
  outline: readonly IWallPoint[];
  /**
   * @evidence spaces/07-boundary-assembly.md Door and window voids remain hosted by their cut wall.
   * @evidenceReview spaces/07-boundary-assembly.md #007d289 wallPanel stores its hole list on the face returned with the mesh; straightWall includes bottom notches in that face list, keeping each opening on its assigned wall body.
   * @evidence principles/core/source-units.md#source-scope-preservation The list records cuts without creating door or window fills.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 IWallHole records an id and four cut bounds; holes stores those wall cuts without supplying a door leaf or window fill.
   * @evidence principles/core/source-units.md#source-substantive-completion Consumers can bind each wall cut to a sided boundary segment.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f environment-links.ts finds a containing segment for each face hole or throws, then emits an opening with the hole id; the field supports boundary binding without claiming a mesh congruence check.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work External-opening-interface keeps each rough window or door void in its wall host, and interior-boundary-ownership keeps partition doors in their one body; holes records those cuts.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The external-opening parent assigns rough cuts to their elevation wall and the interior boundary parent assigns a partition cut once; wallPanel and straightWall keep the respective caller's hole list on that wall face.
   */
  holes: readonly IWallHole[];
}

/**
 * A wall panel's mesh together with the face it was cut from.
 * @evidence spaces/07-boundary-assembly.md A boundary has one body and one associated cut-face record.
 * @evidenceReview spaces/07-boundary-assembly.md #007d289 IWallSolid pairs the emitted wall mesh with its IWallFace, letting the boundary assembly use one part for the cut body and its opening host.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-ownership Room partitions pair their physical body with the opening host.
 * @evidenceReview spaces/07-boundary-assembly.md#interior-boundary-ownership #6a03f13 rooms/shared.ts passes straightWall's mesh and face to part() for an assigned partition, keeping the common body and its door host together.
 * @evidence principles/core/source-units.md#source-scope-preservation The pair stays under the caller's assigned wall owner.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 IWallSolid has no owner field; part() supplies the caller's owner when it wraps this mesh and face, so the pair does not claim a wall run.
 * @evidence principles/core/source-units.md#source-substantive-completion Geometry and opening-bearing face travel together.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f wallPanel and straightWall return both fields of IWallSolid; part() carries the face with its mesh for downstream boundary assembly.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-ownership requires one body per interior partition; exterior-boundary-junctions instead divide the main/garage contact into lower garage and upper siding bodies, which this interface can carry separately.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The boundary handoff calls for one body per interior partition and separate lower and upper bodies at the garage contact; each wallPanel result can carry its own face with its assigned mesh.
 */
export interface IWallSolid {
  /**
   * @evidence spaces/07-boundary-assembly.md The wall's emitted body realizes the assigned boundary.
   * @evidenceReview spaces/07-boundary-assembly.md #007d289 wallPanel extrudes the caller's cut outline through its reserved thickness and puts that geometry in mesh, realizing the assigned boundary body.
   * @evidence principles/core/source-units.md#source-scope-preservation The mesh belongs to the caller's wall owner.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The mesh field receives geometry made from the caller's wall plan; IWallSolid itself selects no room or exterior author.
   * @evidence principles/core/source-units.md#source-substantive-completion The boundary is actual geometry rather than a plan-only line.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f wallPanel fills mesh with an extruded region, so this field holds a wall volume instead of a plan trace alone.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-ownership assigns each cut partition one emitted body and exterior-boundary-junctions divides the garage/main contact by height; mesh carries the body for one such assignment.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The interior and garage contact parents each assign a body to a source owner; mesh carries the extruded result of one wall call without merging those assignments.
   */
  mesh: IAutoMovieMesh;
  /**
   * @evidence spaces/07-boundary-assembly.md The same emitted wall carries the face and its voids.
   * @evidenceReview spaces/07-boundary-assembly.md #007d289 wallPanel returns face and mesh together, and straightWall preserves all door cuts in face.holes beside its notched mesh.
   * @evidence principles/core/source-units.md#source-scope-preservation The face does not assign a second wall author.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The face field contains geometry coordinates and holes but no owner; part() supplies the same caller owner to the enclosing part.
   * @evidence principles/core/source-units.md#source-substantive-completion Openings and junction checks can inspect the cut body's source face.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f environment-links.ts reads the carried face to derive sided boundaries and attach openings to the emitted wall part.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work External-opening-interface requires a rough void through its own host wall, and interior-boundary-ownership keeps a door void on its partition; face preserves that host relation beside mesh.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The exterior opening and interior partition parents keep a rough cut on its host wall; this face retains that wall's cuts beside its mesh for the boundary adapter.
   */
  face: IWallFace;
}

/**
 * A point of a plan polygon in world X/Z metres.
 * @evidence spaces/site/00-access.md House and site use one world plan frame for their extents.
 * @evidenceReview spaces/site/00-access.md #a8ac95c IPlanPoint contains world X and Z for caller-supplied polygon rings; the site handoff places house, garage, porch and access zones in the same coordinate base.
 * @evidence spaces/site/00-access.md#site-access-interface The site assembles the house and exterior zones in the inherited coordinate frame.
 * @evidenceReview spaces/site/00-access.md#site-access-interface #0ee9bff The site assembly uses the shared X/Z frame; this two-field point represents plan coordinates consumed by both building and exterior-zone polygon builders.
 * @evidence principles/core/source-units.md#source-scope-preservation The point is supplied by a design owner, not chosen by this helper.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 IPlanPoint declares x and z without a default or site offset; the polygon owner supplies each value.
 * @evidence principles/core/source-units.md#source-substantive-completion Both plan axes are present for closed surface rings.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The x and z fields give slab, rect and slopedSlab both horizontal coordinates needed to form closed plan rings.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-access-interface keeps house and exterior-zone coordinates in the common frame from settings/00-production.md#coordinate-units; IPlanPoint passes caller-supplied world X/Z metres without borrowing one building's bounds.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The site-access handoff requires one shared coordinate frame for house and zones; IPlanPoint only carries caller-supplied X/Z values, so it changes no site placement decision.
 */
export interface IPlanPoint {
  /**
   * @evidence spaces/site/00-access.md World X places a plan point across the site.
   * @evidenceReview spaces/site/00-access.md #a8ac95c The x member retains the world lateral coordinate used for house and paving extents in the site's identity frame; rect copies the caller's X interval into its corners.
   * @evidence principles/core/source-units.md#source-scope-preservation This is the caller's authored X value.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The x member is a required caller-supplied number with no default or new lateral placement rule.
   * @evidence principles/core/source-units.md#source-substantive-completion A horizontal coordinate is available to polygon builders.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f slab, rect and slopedSlab read x to position each plan corner, so the field has a direct geometry consumer.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-access-interface assembles house and exterior zones in the common world frame, whose +X points toward the garage in coordinate-units; x retains the caller's value on that axis.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The site handoff uses the common coordinate frame whose +X points toward the garage; x retains the owner's selected value on that axis without redefining the frame.
   */
  x: number;
  /**
   * @evidence spaces/site/00-access.md World Z places a plan point toward or away from the street.
   * @evidenceReview spaces/site/00-access.md #a8ac95c The z member holds depth in the site's world frame; the access handoff uses +Z for the front paving ends and their outgoing connection.
   * @evidence principles/core/source-units.md#source-scope-preservation This is the caller's authored Z value.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The z member requires a caller-supplied depth coordinate and adds no default or site-owned dimension.
   * @evidence principles/core/source-units.md#source-substantive-completion A depth coordinate is available to polygon builders.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f slab, rect and slopedSlab read z for their plan rings, making world depth available to the emitted geometry.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-access-interface uses the common world frame for building and paving, whose +Z points to the front walk and -Z to the garden in coordinate-units; z retains the caller's depth on that axis.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The site handoff inherits +Z toward the front sidewalk and -Z toward the garden; z records an owner's depth in that frame without changing the site parent.
   */
  z: number;
}

/**
 * A point of a wall outline: u along the wall axis, y the world height.
 * @evidence spaces/07-boundary-assembly.md Cut wall panels retain their planar boundary trace.
 * @evidenceReview spaces/07-boundary-assembly.md #007d289 IWallPoint stores a coordinate along the wall and a world height; IWallFace.outline uses those points to retain the cut wall's boundary trace.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-junctions The trace supports continuous room corners and door heads.
 * @evidenceReview spaces/07-boundary-assembly.md#interior-boundary-junctions #78b06b5 straightWall uses u/Y points around bottom-reaching door notches; the resulting face lets environment-links.ts inspect the sided boundary at room junctions.
 * @evidence principles/core/source-units.md#source-scope-preservation Coordinates describe the caller's wall only.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The point describes a vertex in the emitting wall's own run and world height, with no independent room or facade origin.
 * @evidence principles/core/source-units.md#source-substantive-completion Both running distance and height locate each outline vertex.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The required u and y numbers locate each outline vertex; wallPanel maps them into the extruded region and straightWall uses them for door notch corners.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-ownership fixes the partition's full height, interior-boundary-junctions fixes its door cuts, and exterior-boundary-junctions carries sloped wall contacts; IWallPoint records their run and height vertices.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The boundary parents distinguish a partition's complete body, its door junction and exterior wall contacts; IWallPoint provides u/Y vertices for those caller-owned traces without choosing a new height or junction owner.
 */
export interface IWallPoint {
  /**
   * @evidence spaces/07-boundary-assembly.md This point locates a vertex along the wall run.
   * @evidenceReview spaces/07-boundary-assembly.md #007d289 The u value locates one wall-outline vertex along the horizontal run used by the boundary's assigned owner.
   * @evidence principles/core/source-units.md#source-scope-preservation The value uses the assigned wall's local running axis.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 wallPanel interprets u along the axis supplied by its caller, so this field introduces no separate wall direction.
   * @evidence principles/core/source-units.md#source-substantive-completion The outline can order corners and door notches.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f straightWall orders door notches by their running coordinate and emits u vertices around each notch before closing the wall outline.
    * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Main-building-extent and attached-garage-extent set outer wall runs, roof-mass-allocation sets the gable and ridge stations, chimney-roof-interface locates the left-wall split, and interior-boundary-junctions assigns door cuts to partition runs. u carries these outline stations; window intervals remain in IWallHole.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The front, rear, left, right and garage wallPanel callers put building, roof and chimney run stations in their outline u vertices; straightWall adds u vertices for floor-reaching door notches. Enclosed window spans instead enter the separate IWallHole.from/to list, so this field sets no opening location.
   */
  u: number;
  /**
   * @evidence spaces/07-boundary-assembly.md This point locates a vertex at world height.
   * @evidenceReview spaces/07-boundary-assembly.md #007d289 The y number places a wall-outline vertex at its world height, letting the boundary follow the caller's top, bottom or door head.
   * @evidence principles/core/source-units.md#source-scope-preservation The height follows the assigned wall datum.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The caller supplies y from its wall and storey datums; this field stores the value without choosing a new elevation.
   * @evidence principles/core/source-units.md#source-substantive-completion Head, sill and top vertices are explicit.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f wallPanel reads y for each outline vertex, and straightWall uses it for the wall top and the head of every bottom notch.
    * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Ground-support-handoff sets the displayed exterior wall bottom, roof-wall-head-junctions and roof-mass-allocation govern sloped wall tops, and storey-datums fixes partition levels; interior-boundary-junctions keeps room-owned door heads aligned with their partition notches. y carries those outline heights, while enclosed window heads remain in IWallHole.top.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Exterior wallPanel outlines take y from EXTERIOR_WALL_BOTTOM and their roof-underside functions; partitionSpan supplies straightWall's bottom and top, and a floor-reaching door contributes its own top to notch vertices. Window heads stay in IWallHole.top rather than IWallPoint.y, so this field chooses no new elevation.
   */
  y: number;
}

/**
 * A rectangular void cut through a wall panel, in the panel's (u, y).
 * @evidence spaces/06-openings.md Door and window sites are actual wall voids before model fills.
 * @evidenceReview spaces/06-openings.md #bad6451 IWallHole holds an id and four u/Y bounds; wallPanel cuts an enclosed ring from those bounds and straightWall uses a bottom-reaching hole as an open notch, matching the rough-void rule.
 * @evidence spaces/06-openings.md#external-opening-interface Exterior openings keep their structural host distinct from door/window models.
 * @evidenceReview spaces/06-openings.md#external-opening-interface #457149c The record has cut coordinates and no frame, sash, glass or leaf geometry; the external-opening handoff keeps those later fills separate from the wall void.
 * @evidence principles/core/source-units.md#source-scope-preservation This record cuts the assigned wall only and does not supply a model leaf.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The void record contains only its id and horizontal and vertical bounds, so it cannot claim the later door or window model.
 * @evidence principles/core/source-units.md#source-substantive-completion Id and four bounds locate a real rectangular cut.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f wallPanel turns the four bounds into an interior rectangular ring; straightWall turns a floor-reaching cut into a bottom notch, so the record supplies actual wall-cut inputs.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work External-opening-interface assigns the rough door/window cut to its wall source and leaves frames/leaves to models; IWallHole carries only that four-bound wall cut.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The opening handoff gives each rough void to its wall owner and reserves fills for models; IWallHole carries only the owner's cut coordinates, so no fill or owner decision is added here.
 */
export interface IWallHole {
  /**
   * @evidence spaces/06-openings.md The opening retains one house-wide id shared by its wall and room bindings.
   * @evidenceReview spaces/06-openings.md #bad6451 The id field passes through environment-links.ts as the opening id; house.ts finds the host wall by the same id, matching the handoff's requirement that the room consume its wall's opening address.
   * @evidence principles/core/source-units.md#source-scope-preservation This names a void, not its later model fill.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 This id names the rough wall cut rather than a door leaf or glazing part, leaving the separate fill to its assigned model owner.
   * @evidence principles/core/source-units.md#source-substantive-completion The environment can connect a compiled opening to its cut.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f environment-links.ts emits the hole id as an opening id and house.ts matches expected door ids to host wall holes, making the field a usable connection key.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The entry plan names front-door and garage-front-opening names garage-front-door; id preserves those authored addresses through wall and environment assembly.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The entry and garage-front parents name their separate door voids; their wall callers supply those ids, and the environment adapter retains them as opening ids without creating another opening address.
   */
  id: string;
  /**
   * @evidence spaces/06-openings.md The void starts at a position along its host wall.
   * @evidenceReview spaces/06-openings.md #bad6451 The from number is the first endpoint of the horizontal X or Z interval on the assigned wall, as required for a rough door or window void.
   * @evidence principles/core/source-units.md#source-scope-preservation The start lies in the existing wall coordinate frame.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 wallPanel and straightWall interpret from along their caller's wall axis; this field adds no independent world placement.
   * @evidence principles/core/source-units.md#source-substantive-completion The left edge participates in a measurable opening width.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f environment-links.ts computes each opening's width from its from and to bounds and rejects a clipped passage that is too narrow.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garage-front-opening fixes the garage door's left X=6.10 and entry-plan fixes the entry door's left X=0.40; from carries each caller's first running coordinate into its host cut.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The garage-front-opening and entry-plan parents set the respective left X limits for their doors; from carries each chosen bound into its owner's cut.
   */
  from: number;
  /**
   * @evidence spaces/06-openings.md The void ends at a position along its host wall.
   * @evidenceReview spaces/06-openings.md #bad6451 The to number is the second endpoint of the wall's horizontal X or Z interval, completing the rough opening span.
   * @evidence principles/core/source-units.md#source-scope-preservation The end remains within the assigned wall run.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 straightWall checks to against its caller-supplied wall run; wallPanel receives the same host's cut extent without assigning a new run.
   * @evidence principles/core/source-units.md#source-substantive-completion Together with from, it fixes the cut width.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f wallPanel forms the cut ring using from and to, and environment-links.ts uses their difference as the opening width.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garage-front-opening fixes the garage door's right X=11.10 and entry-plan fixes the entry door's right X=1.40; to carries each caller's second running coordinate into its host cut.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The garage-front-opening and entry-plan parents set the right X limits of their respective doors; to keeps the caller's endpoint in the cut record.
   */
  to: number;
  /**
   * @evidence spaces/06-openings.md The opening has a sill or threshold height.
   * @evidenceReview spaces/06-openings.md #bad6451 The bottom number is the world Y lower endpoint of the rough wall void, serving as a sill or a door threshold cut.
   * @evidence principles/core/source-units.md#source-scope-preservation The lower edge describes a wall cut, not a separate threshold object.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The field sets a wall-cut bound only; an exterior threshold remains a separately emitted body under its assigned owner.
   * @evidence principles/core/source-units.md#source-substantive-completion A floor-reaching opening can become a true bottom notch.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f straightWall turns a hole whose bottom reaches the panel bottom into an outline notch, leaving a true floor-reaching passage.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Ground-threshold-junctions extends floor-reaching door voids into their base while living-front-window fixes its own sill above the floor; bottom carries that opening-specific lower edge.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The ground-threshold handoff keeps wall material out of a floor-reaching entrance and the living window parent gives a raised sill; bottom carries each opening's assigned lower edge without deciding a new threshold.
   */
  bottom: number;
  /**
   * @evidence spaces/06-openings.md The opening has an explicit head height.
   * @evidenceReview spaces/06-openings.md #bad6451 The top number is the world Y upper endpoint of the rough opening, giving the wall cut an explicit head.
   * @evidence principles/core/source-units.md#source-scope-preservation The top edge belongs to the host wall cut.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The top field bounds the cut ring or notch supplied by the host wall; it adds no separate header or window fill.
   * @evidence principles/core/source-units.md#source-substantive-completion Header clearance can be checked against the wall top.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f straightWall rejects a hole reaching its wall top, preserving an actual header above the opening in the emitted mesh.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garage-front-opening fixes its door head Y=2.15 and living-front-window fixes its window head; top carries each host's upper cut limit.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The garage door and living front window parents set their distinct head heights; top retains the caller's selected height in the host wall cut.
   */
  top: number;
}

/**
 * Build one part record.
 * @evidence spaces/03-surface-owners.md Each emitting source keeps its own owner id and surface role.
 * @evidenceReview spaces/03-surface-owners.md #a830535 part() requires the emitting file's owner and copies it with the supplied id and role into one part; the surface-owner table assigns those source files.
 * @evidence spaces/03-surface-owners.md#exterior-surface-handoff Exterior wall parts retain their cut face without assigning a second owner.
 * @evidenceReview spaces/03-surface-owners.md#exterior-surface-handoff #b1ed234 When an elevation caller passes a wall solid, part() retains its cut face with the mesh and preserves that elevation's owner.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff Room finish parts keep the room's owner id.
 * @evidenceReview spaces/03-surface-owners.md#interior-surface-handoff #dae8f88 Room floor and ceiling callers pass their own owner to part(), which stores it unchanged beside the finish mesh assigned by the interior handoff.
 * @evidence principles/core/source-units.md#source-scope-preservation The helper preserves caller identity, colour and geometry rather than selecting them.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 part() takes the id, owner, role, colour and solid from its caller and selects no new space, geometry or finish assignment.
 * @evidence principles/core/source-units.md#source-substantive-completion It returns a complete part and carries a wall face when the solid has one.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f part() returns all required IHousePart fields and, when given IWallSolid, carries its face into wall beside the emitted mesh.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Exterior-surface-handoff gives garage-shared-wall to garage.ts and the upper siding to envelope/right.ts; part carries each caller's id, owner, colour and geometry without reassigning it.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The surface handoff assigns garage and right elevation separate shared-wall bodies by height; part() preserves the owner supplied for either body, with no new allocation.
 */
export const part = (id: string, owner: string, role: HousePartRole, color: number, solid: IAutoMovieMesh | IWallSolid): IHousePart =>
  "face" in solid
    ? {
        id,
        owner,
        role,
        color,
        mesh: solid.mesh,
        wall: solid.face,
      }
    : { id, owner, role, color, mesh: solid };
