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
 * @evidenceReview spaces/03-surface-owners.md #9596716 HousePartRole labels wall, roof, floor, stair and site parts; the owner field remains separate so each family in the surface-owner table can retain its emitting file.
 * @evidence spaces/03-surface-owners.md#exterior-surface-handoff Exterior roles distinguish envelope, roof, porch, site and chimney parts.
 * @evidenceReview spaces/03-surface-owners.md#exterior-surface-handoff #9f3db3c The union provides wall, roof, porch, paving, fence and chimney labels for the separately assigned exterior bodies in the owner table.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff Floor and ceiling roles identify room finish parts made by their room owners.
 * @evidenceReview spaces/03-surface-owners.md#interior-surface-handoff #f1d029f The floor and ceiling variants can label the finishes the interior handoff assigns to each room; partition and stair variants do not transfer structural ownership to a room.
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
 * @evidenceReview spaces/03-surface-owners.md #9596716 IHousePart requires an owner alongside each mesh; part() copies its caller's owner, matching the document's allocation of a complete surface to one source file.
 * @evidence spaces/03-surface-owners.md#exterior-surface-handoff Exterior parts preserve one author for each emitted body.
 * @evidenceReview spaces/03-surface-owners.md#exterior-surface-handoff #9f3db3c The record holds one owner string for each emitted exterior body; part() preserves the file supplied by the envelope, roof, porch or site emitter.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff Room parts retain the owner of their floor and ceiling finish.
 * @evidenceReview spaces/03-surface-owners.md#interior-surface-handoff #f1d029f IHousePart.owner remains attached to roomFloor and roomCeiling parts from rooms/shared.ts, allowing the room named in the interior handoff to remain their finish owner.
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
   * @evidenceReview spaces/03-surface-owners.md #9596716 The id and owner fields coexist on each IHousePart; the surface-owner table assigns the body while house.ts rejects duplicate ids during assembly. This field does not claim that the later complete surface census is finished.
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
   * @evidenceReview spaces/03-surface-owners.md #9596716 The owner string stores the emitting source path, such as an envelope or room file, which is the unit named by the exterior table and interior handoff.
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
   * @evidenceReview spaces/03-surface-owners.md #9596716 The role field accepts HousePartRole while the owner field still names the source file; the exterior and room tables allocate files for those part families.
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
   * @evidenceReview spaces/03-surface-owners.md #9596716 The colour number is a field on the same IHousePart as owner and mesh; callers supply it to part() without changing the emitting file assigned by the surface-owner table.
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
   * @evidenceReview spaces/03-surface-owners.md #9596716 IHousePart.mesh holds the geometry emitted by the assigned envelope, roof, site or room source; the record does not generate a competing surface.
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
   * @evidenceReview spaces/03-surface-owners.md #9596716 The exterior handoff gives the elevation owner its wall body, void and cut face; IHousePart.wall retains the face beside the owner's mesh when part() receives a wall solid.
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
   * @evidenceReview spaces/site/fence.md#fence-ground-profile #9146a87 house.ts marks every fence part pending; the fence-ground profile reserves its displayed lower edge until maps supplies the actual ground at each centreline point.
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
 * @evidenceReview spaces/07-boundary-assembly.md #007d289 v-141 part.wall kept per wall body (L698); environment.ts:624-663 boundaries and :631-647 partition-junction check read it; 07-boundary-assembly.md:27,47.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-ownership A partition's face and openings belong to its single wall body.
 * @evidenceReview spaces/07-boundary-assembly.md#interior-boundary-ownership #6a03f13 v-141 straightWall returns mesh+face of one wallPanel (L426-446) -> part(); 07-boundary-assembly.md:27 common body and opening cut created once.
 * @evidence spaces/07-boundary-assembly.md#exterior-boundary-junctions Exterior junctions reuse the cut wall's face rather than a duplicate corner body.
 * @evidenceReview spaces/07-boundary-assembly.md#exterior-boundary-junctions #11dbbb5 v-141 No junction code reuses a face: corners sit inside the front/rear panel whose outline spans MAIN.outer.x (front.ts:81-88), side walls end at MAIN.inner.z (left.ts:73-74), and boundaries.ts:145 drops site|site corner cells. 'No duplicate corner body' matches 07-boundary-assembly.md:117-120; 'reuse' is loose.
 * @evidence principles/core/source-units.md#source-scope-preservation This record describes the caller's wall and does not own the room or facade.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Interface fields only; caller supplies axis/across/outline/holes.
 * @evidence principles/core/source-units.md#source-substantive-completion Axis, thickness, outline and void list define the inspection boundary.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 environment.ts:649-663 builds the boundary face from axis/across/outline; openings from holes (:667-693).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-ownership pairs each partition body with its void host, while exterior-boundary-junctions allows the garage/main wall's lower and upper bodies to carry separate faces.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 07-boundary-assembly.md:27 each shared partition's common body and opening cut are generated once by one owner; 07:123 main/garage wall divided into garage body up to the garage-roof weather line and right siding above. Code: garage.ts:50 and right.ts:110 are separate wallPanel solids with their own faces. Split added fa601efa/a15c1dd1; exposure owned by garage.ts:44/right.ts:79.
 */
export interface IWallFace {
  /**
   * @evidence spaces/07-boundary-assembly.md A wall boundary runs along one world horizontal axis.
   * @evidenceReview spaces/07-boundary-assembly.md #007d289 v-141 axis 'x'|'z' L147; all walls run on X/Z per 00-building.md:29-31 extents and 07 runs.
   * @evidence principles/core/source-units.md#source-scope-preservation The axis describes the assigned wall's local frame only.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 axis only orients the caller's wall (wallPanel L365-379).
   * @evidence principles/core/source-units.md#source-substantive-completion Consumers can orient holes and boundary checks in that frame.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 environment.ts:655-657 origin/rotation from face.axis; boundaries.ts:25-28 facePoint uses axis.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-junctions gives each straight partition a horizontal run and exterior-boundary-junctions gives each facade a wall line; axis records whether that run is world X or Z.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Boundary assembly already distinguishes straight partition junctions from left, right and garage facades; front, left, right and shared.ts partition callers pass their own axis, so this wall record exposes no missing axis decision.
   */
  axis: "x" | "z";
  /**
   * @evidence spaces/07-boundary-assembly.md The wall records its thickness across the running axis.
   * @evidenceReview spaces/07-boundary-assembly.md #007d289 v-141 across L154; 07-boundary-assembly.md:25 boundary consumes the reserved wall thickness.
   * @evidence principles/core/source-units.md#source-scope-preservation This range is the caller's wall thickness, not a second boundary.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 across is the caller's range; wallPanel only extrudes it (L349-350).
   * @evidence principles/core/source-units.md#source-substantive-completion It locates both faces of the one emitted wall body.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 depth=across[1]-across[0], centre mid-range (L349-350, L368, L376) put the two faces at across[0], across[1].
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Main-building-extent reserves 0.25 m exterior walls and interior-boundary-junctions uses the assigned partition band; across carries both physical faces of the selected wall.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Building and boundary assembly already fix 0.25 m exterior and 0.15 m partition thickness; front and garage pass MAIN.wall faces while stair.ts passes MAIN.partition faces, and wallPanel copies each across interval.
   */
  across: readonly [number, number];
  /**
   * @evidence spaces/07-boundary-assembly.md The outer panel trace remains available after cutting openings.
   * @evidenceReview spaces/07-boundary-assembly.md #007d289 v-141 face.outline = props.outline (L362) or the full rectangle incl. notches (L438-443).
   * @evidence principles/core/source-units.md#source-scope-preservation The trace belongs to the existing emitted wall.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Outline is the caller's own wall outline (L362, L438-443).
   * @evidence principles/core/source-units.md#source-substantive-completion It allows void and junction validation against full wall bounds.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 segmentsOf uses the full outline (boundaries.ts:120-127); environment.ts:667-686 requires each void inside a boundary segment; partition-junction check :631-647.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-ownership requires a partition body around its door void and front-openings requires complete facade around its windows; outline retains the pre-cut wall perimeter for both.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 07:27 partition body with its opening cut is true. But front-openings (envelope/front.md:57) only fixes wall thickness Z=[-0.25,0] and window binding; the complete front wall closure is front-roof-closures (front.md:25-31, same-file sibling). A holds: face outline is pre-cut (wallPanel solids.ts:355 outline without holes; straightWall solids.ts:431-436 full rectangle).
   */
  outline: readonly IWallPoint[];
  /**
   * @evidence spaces/07-boundary-assembly.md Door and window voids remain hosted by their cut wall.
   * @evidenceReview spaces/07-boundary-assembly.md #007d289 v-141 holes stay on the cut wall's face (L363, L444); 07-boundary-assembly.md:79 cut made once by the room owner.
   * @evidence principles/core/source-units.md#source-scope-preservation The list records cuts without creating door or window fills.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 IWallHole is id + four bounds; environment openings carry fill null (environment.ts:691).
   * @evidence principles/core/source-units.md#source-substantive-completion Consumers can verify every actual opening against the wall mesh.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 No consumer checks holes against the mesh: environment.ts:667-693 matches holes to face segments, house.ts:200-212 checks door host/floor, space-audit.ts:86 counts. Holes and mesh share input (L352-358) so a mesh check is possible, not performed.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work External-opening-interface keeps each rough window or door void in its wall host, and interior-boundary-ownership keeps partition doors in their one body; holes records those cuts.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 06:29 elevation owners own the void coordinates and rooms consume the same id; 07:27 partition owner cuts its opening once. holes: wallPanel face.holes = props.holes (solids.ts:356); straightWall face.holes lists every void incl. notched doors (solids.ts:437).
   */
  holes: readonly IWallHole[];
}

/**
 * A wall panel's mesh together with the face it was cut from.
 * @evidence spaces/07-boundary-assembly.md A boundary has one body and one associated cut-face record.
 * @evidenceReview spaces/07-boundary-assembly.md #007d289 v-141 IWallSolid {mesh, face} L179-194; 07-boundary-assembly.md:27 one common body per shared boundary.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-ownership Room partitions pair their physical body with the opening host.
 * @evidenceReview spaces/07-boundary-assembly.md#interior-boundary-ownership #6a03f13 shared.ts partition() calls straightWall and then part() with that wall face, preserving one interior body and its opening cut under the caller owner.
 * @evidence principles/core/source-units.md#source-scope-preservation The pair stays under the caller's assigned wall owner.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Type pairs caller data; owner assigned only by part().
 * @evidence principles/core/source-units.md#source-substantive-completion Geometry and opening-bearing face travel together.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 wallPanel/straightWall return mesh and face together (L366-379, L433-446).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-ownership requires one body per interior partition; exterior-boundary-junctions instead divide the main/garage contact into lower garage and upper siding bodies, which this interface can carry separately.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 07:27 one common body per shared partition; 07:123 main/garage contact divided at the garage-roof weather line into garage body and right siding body. garage.ts:50 and right.ts:110 each return an IWallSolid. Old FALSE ('single wall body at shared boundaries') fixed. Split added fa601efa/a15c1dd1, exposure owned by garage.ts:44/right.ts:79.
 */
export interface IWallSolid {
  /**
   * @evidence spaces/07-boundary-assembly.md The wall's emitted body realizes the assigned boundary.
   * @evidenceReview spaces/07-boundary-assembly.md #007d289 v-141 mesh is the extruded wall body (L358-379); 07-boundary-assembly.md:27.
   * @evidence principles/core/source-units.md#source-scope-preservation The mesh belongs to the caller's wall owner.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 mesh passed through from the caller's wall call.
   * @evidence principles/core/source-units.md#source-substantive-completion The boundary is actual geometry rather than a plan-only line.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 extrudeAutoMovieRegion closed body (L358), not a plan line.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-ownership assigns each cut partition one emitted body and exterior-boundary-junctions divides the garage/main contact by height; mesh carries the body for one such assignment.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Same parents 07:27, 07:123. mesh is the one extruded body per call (wallPanel solids.ts:359-372; straightWall solids.ts:427).
   */
  mesh: IAutoMovieMesh;
  /**
   * @evidence spaces/07-boundary-assembly.md The same emitted wall carries the face and its voids.
   * @evidenceReview spaces/07-boundary-assembly.md #007d289 v-141 face and voids returned with the same mesh (L359-364, L433-446).
   * @evidence principles/core/source-units.md#source-scope-preservation The face does not assign a second wall author.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 face carries no owner; part() sets one owner.
   * @evidence principles/core/source-units.md#source-substantive-completion Openings and junction checks can inspect the cut body's source face.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 environment.ts:624-693 reads the face for boundaries/openings/junctions; casing-space-scan.cjs:76-85 reads part.wall.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work External-opening-interface requires a rough void through its own host wall, and interior-boundary-ownership keeps a door void on its partition; face preserves that host relation beside mesh.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 06:27 void passes through its elevation wall from inner to outer face; 07:27 opening cut once with the partition's common body. face holds the host's holes beside mesh (solids.ts:352-371, 426-438); environment.ts:691-713 binds the opening to that host part.
   */
  face: IWallFace;
}

/**
 * A point of a plan polygon in world X/Z metres.
 * @evidence spaces/site/00-access.md House and site use one world plan frame for their extents.
 * @evidenceReview spaces/site/00-access.md #a8ac95c The site document puts main, garage, porch and exterior zones in an identity-transformed coordinate base; IPlanPoint carries rings for room outlines in shared.ts, site zones and the upper-floor notch.
 * @evidence spaces/site/00-access.md#site-access-interface The site assembles the house and exterior zones in the inherited coordinate frame.
 * @evidenceReview spaces/site/00-access.md#site-access-interface #0ee9bff 00-access.md:29 site.ts assembles containment of house and exterior zones and coordinates use settings coordinate-units. IPlanPoint carries world X/Z (solids.ts:197-212) for those outlines.
 * @evidence principles/core/source-units.md#source-scope-preservation The point is supplied by a design owner, not chosen by this helper.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 IPlanPoint has no default; callers pass extents (e.g. upper.ts:43-56 from MAIN).
 * @evidence principles/core/source-units.md#source-substantive-completion Both plan axes are present for closed surface rings.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 x and z fields L211, L218 used by slab/rect/slopedSlab rings.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-access-interface keeps house and exterior-zone coordinates in the common frame from settings/00-production.md#coordinate-units; IPlanPoint passes caller-supplied world X/Z metres without borrowing one building's bounds.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 00-access.md:29 '좌표는 [공통 기준](coordinate-units)을 사용한다' for house-site with main/garage/porch/zones. IPlanPoint is a plain {x,z} type (solids.ts:197-212) and reads no building bounds.
 */
export interface IPlanPoint {
  /**
   * @evidence spaces/site/00-access.md World X places a plan point across the site.
   * @evidenceReview spaces/site/00-access.md #a8ac95c 00-access.md:101 house authored directly in the common coordinates (identity site transform); :103 port widths are each paving owner's X interval. x holds world X (solids.ts:204); rect passes caller X unchanged (solids.ts:481-484).
   * @evidence principles/core/source-units.md#source-scope-preservation This is the caller's authored X value.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The x member carries a caller-supplied lateral world coordinate into IPlanPoint without a default or local placement rule.
   * @evidence principles/core/source-units.md#source-substantive-completion A horizontal coordinate is available to polygon builders.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 slab L467, rect L488-491, slopedSlab L535-539 read x.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-access-interface assembles house and exterior zones in the common world frame, whose +X points toward the garage in coordinate-units; x retains the caller's value on that axis.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 00-access.md:29 common base; settings/00-production.md:97 '+X는 정면에서 보아 오른쪽 차고 방향'. x is the caller's value (solids.ts:204, rect 481-484).
   */
  x: number;
  /**
   * @evidence spaces/site/00-access.md World Z places a plan point toward or away from the street.
   * @evidenceReview spaces/site/00-access.md #a8ac95c 00-access.md:31 paving end at Z=6.50 toward the front sidewalk; :103 connection direction +Z. z holds world Z (solids.ts:211).
   * @evidence principles/core/source-units.md#source-scope-preservation This is the caller's authored Z value.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The z member carries caller-supplied world depth toward the front walk or garden without a default or source-owned dimension.
   * @evidence principles/core/source-units.md#source-substantive-completion A depth coordinate is available to polygon builders.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 slab L467, rect L488-491, slopedSlab L535-539 read z.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-access-interface uses the common world frame for building and paving, whose +Z points to the front walk and -Z to the garden in coordinate-units; z retains the caller's depth on that axis.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 00-access.md:29 common frame; 00-production.md:97 '+Z는 주택에서 앞 보도 쪽… 후면 정원은 -Z' ('front walk' paraphrases 앞 보도; same +Z sense). z is the caller's depth (solids.ts:211).
   */
  z: number;
}

/**
 * A point of a wall outline: u along the wall axis, y the world height.
 * @evidence spaces/07-boundary-assembly.md Cut wall panels retain their planar boundary trace.
 * @evidenceReview spaces/07-boundary-assembly.md #007d289 v-141 face.outline keeps the (u,y) trace (L362, L438-443).
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-junctions The trace supports continuous room corners and door heads.
 * @evidenceReview spaces/07-boundary-assembly.md#interior-boundary-junctions #78b06b5 v-141 Notch vertices give door heads (L414-420); environment.ts:631-647 checks partition ends via the face; 07-boundary-assembly.md:75-79 junction corners and door cuts.
 * @evidence principles/core/source-units.md#source-scope-preservation Coordinates describe the caller's wall only.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Points are caller-local (u,y) of one wall.
 * @evidence principles/core/source-units.md#source-substantive-completion Both running distance and height locate each outline vertex.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 u and y fields L236, L243.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-junctions requires a full height trace around each partition door and exterior-boundary-junctions requires sloped wall heads; IWallPoint carries their run/height vertices.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 07:113 exterior walls end at the roof-wall-head contact (sloped heads) true; code garage.ts:53-57 weatherLine, right.ts stepRun. But the full floor-to-ceiling partition height is 07:45 (#interior-boundary-ownership, same-file sibling); interior-boundary-junctions (07:75-87) covers junction zones and door cuts only. IWallPoint vertices from straightWall notches (solids.ts:406-418).
 */
export interface IWallPoint {
  /**
   * @evidence spaces/07-boundary-assembly.md This point locates a vertex along the wall run.
   * @evidenceReview spaces/07-boundary-assembly.md #007d289 v-141 u L236 along the axis (wallPanel L351).
   * @evidence principles/core/source-units.md#source-scope-preservation The value uses the assigned wall's local running axis.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 u runs along props.axis (L365-379).
   * @evidence principles/core/source-units.md#source-substantive-completion The outline can order corners and door notches.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 straightWall sorts notches by from (L410-412) and emits vertices in u order (L413-425).
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Front-openings locates door/window spans along X and left-openings locates them along Z; u carries the selected host wall's running coordinate.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 front-openings (front.md:57) fixes the wall thickness in Z (so spans run along X) but the X spans are in child H2s front.md:83,107,133,157, and it leaves the front-door void to rooms/entry.md:31; left-openings (left.md:55) same, spans at left.md:81,105. A holds: front.ts:82 axis 'x', left.ts:92 axis 'z'; u is the running coordinate (solids.ts:344).
   */
  u: number;
  /**
   * @evidence spaces/07-boundary-assembly.md This point locates a vertex at world height.
   * @evidenceReview spaces/07-boundary-assembly.md #007d289 v-141 y L243 is world height (no local offset in wallPanel L351).
   * @evidence principles/core/source-units.md#source-scope-preservation The height follows the assigned wall datum.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Callers set y from storey datums (shared.ts partitionSpan), EXTERIOR_WALL_BOTTOM, roof undersides.
   * @evidence principles/core/source-units.md#source-substantive-completion Head, sill and top vertices are explicit.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Outline carries notch heads and top; sills explicit as IWallHole.bottom.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Storey-datums fixes floor/ceiling levels and front-openings fixes its window heads; y carries each authored wall vertex in world height.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Storeys fixes floor and ceiling datums Y=0/3.06 and 2.75/5.66; shared.ts partitionSpan and straightWall carry them to IWallPoint.y. Window heads belong to the front child units and pass through IWallHole.top and segment clipping, so this point type requires no parent revision.
   */
  y: number;
}

/**
 * A rectangular void cut through a wall panel, in the panel's (u, y).
 * @evidence spaces/06-openings.md Door and window sites are actual wall voids before model fills.
 * @evidenceReview spaces/06-openings.md #bad6451 v-141 holes become real voids (L352-358) or notches (L410-420); 06-openings.md:31 real cuts; 03-surface-owners.md:58 fills by models.
 * @evidence spaces/06-openings.md#external-opening-interface Exterior openings keep their structural host distinct from door/window models.
 * @evidenceReview spaces/06-openings.md#external-opening-interface #457149c v-141 06-openings.md:29,37 structural host vs model fills; environment opening fill null (environment.ts:691).
 * @evidence principles/core/source-units.md#source-scope-preservation This record cuts the assigned wall only and does not supply a model leaf.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Record is id + bounds only; no leaf geometry.
 * @evidence principles/core/source-units.md#source-substantive-completion Id and four bounds locate a real rectangular cut.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 from/to/bottom/top become a rectangle ring (L352-357) or notch.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work External-opening-interface assigns the rough door/window cut to its wall source and leaves frames/leaves to models; IWallHole carries only that four-bound wall cut.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 06:29 elevation owners (front-door via entry) own the rough void coordinates; 06:31,33 frame/sash/glass fill are later members (models per 03:58). IWallHole is id + from/to/bottom/top only (solids.ts:247-283).
 */
export interface IWallHole {
  /**
   * @evidence spaces/06-openings.md The opening retains a stable host-relative id.
   * @evidenceReview spaces/06-openings.md #bad6451 v-141 Ids are house-global ('living-left-window', 'front-door'): environment.ts:688 uses hole.id as the opening id and house.ts:204-208 finds the host by id; 06-openings.md:29 rooms consume the same id. Not host-relative.
   * @evidence principles/core/source-units.md#source-scope-preservation This names a void, not its later model fill.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 id names the void; fills are models (03-surface-owners.md:58).
   * @evidence principles/core/source-units.md#source-substantive-completion The environment can connect a compiled opening to its cut.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 environment.ts:688 opening id = hole.id with boundary idOf(k).
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Front-openings names front-door and garage-front-opening names garage-front-door; id preserves the authored opening address through wall and environment assembly.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 garage-front-opening names garage-front-door (front.md:209; front.ts:54) true. front-openings (front.md:57) never names id front-door; it leaves the 현관문 void to rooms/entry.md:31, which names `front-door`, as does sibling front-entry-filling (front.md:183). A holds: FRONT_DOOR.id entry.ts:46; opening id = hole.id (environment.ts:712); house.ts:204-209.
   */
  id: string;
  /**
   * @evidence spaces/06-openings.md The void starts at a position along its host wall.
   * @evidenceReview spaces/06-openings.md #bad6451 v-141 06-openings.md:27 X or Z interval is the horizontal width.
   * @evidence principles/core/source-units.md#source-scope-preservation The start lies in the existing wall coordinate frame.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 from uses the wall's u frame (L353, L416).
   * @evidence principles/core/source-units.md#source-substantive-completion The left edge participates in a measurable opening width.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 environment.ts:680-684 width from from/to with >= 0.3 m check.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garage-front-opening fixes the garage door's left X=6.10 and entry-plan fixes the entry door's left X=0.40; from carries each caller's first running coordinate into its host cut.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 front.md:209 6.10, entry.md:31 0.40; from carries each caller coordinate. v-144 F13 minor closed.
   */
  from: number;
  /**
   * @evidence spaces/06-openings.md The void ends at a position along its host wall.
   * @evidenceReview spaces/06-openings.md #bad6451 v-141 06-openings.md:27 horizontal interval.
   * @evidence principles/core/source-units.md#source-scope-preservation The end remains within the assigned wall run.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 straightWall refuses to >= along[1] (L406); wallPanel requires the outline to enclose holes (L335).
   * @evidence principles/core/source-units.md#source-substantive-completion Together with from, it fixes the cut width.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 from/to give the cut width (L353-356).
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garage-front-opening fixes the garage door's right X=11.10 and entry-plan fixes the entry door's right X=1.40; to carries each caller's second running coordinate into its host cut.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 front.md:209 11.10, entry.md:31 1.40. v-144 F14 minor closed.
   */
  to: number;
  /**
   * @evidence spaces/06-openings.md The opening has a sill or threshold height.
   * @evidenceReview spaces/06-openings.md #bad6451 v-141 06-openings.md:27 Y interval in world height.
   * @evidence principles/core/source-units.md#source-scope-preservation The lower edge describes a wall cut, not a separate threshold object.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Thresholds are separate parts (front.ts:168, rear.ts:145); bottom is only a bound.
   * @evidence principles/core/source-units.md#source-substantive-completion A floor-reaching opening can become a true bottom notch.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 bottom <= panel bottom -> notch (L410-420).
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Ground-threshold-junctions extends floor-reaching door voids into their base while living-front-window fixes its own sill above the floor; bottom carries that opening-specific lower edge.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 10-ground-floor.md:92 wall owner excludes the base reservation under each entrance door, no wall below the opening lower edge (also 07:85); code FRONT_DOOR.bottom = floor-finish-base (entry.ts:49), GARAGE_FRONT_DOOR.bottom garage base (front.ts:57). living-front-window Y=[0.70,2.30] (front.md:83) -> bottom 0.7 (front-windows.ts). Scope is the four entrances.
   */
  bottom: number;
  /**
   * @evidence spaces/06-openings.md The opening has an explicit head height.
   * @evidenceReview spaces/06-openings.md #bad6451 v-141 06-openings.md:27 Y interval top.
   * @evidence principles/core/source-units.md#source-scope-preservation The top edge belongs to the host wall cut.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 top only bounds the cut (L355-356, L417-418).
   * @evidence principles/core/source-units.md#source-substantive-completion Header clearance can be checked against the wall top.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 straightWall refuses h.top >= wall top (L406), keeping a header.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garage-front-opening fixes its door head Y=2.15 and living-front-window fixes its window head; top carries each host's upper cut limit.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 front.md:209 garage door Y top 2.15 -> front.ts:58 top 2.15; front.md:83 living window head 2.30 -> front-windows.ts top 2.3. top is the cut's upper limit (solids.ts:282, used 348-349).
   */
  top: number;
}

/**
 * Build one part record.
 * @evidence spaces/03-surface-owners.md Each emitting source keeps its own owner id and surface role.
 * @evidenceReview spaces/03-surface-owners.md #9596716 03-surface-owners.md table assigns each surface to one source file. part() keeps caller id, owner and role verbatim (solids.ts:683-693).
 * @evidence spaces/03-surface-owners.md#exterior-surface-handoff Exterior wall parts retain their cut face without assigning a second owner.
 * @evidenceReview spaces/03-surface-owners.md#exterior-surface-handoff #9f3db3c 03:58 elevation owner owns its wall body and cut face. part() forwards solid.face as wall with the caller's owner (solids.ts:684-691); no second owner field.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff Room finish and partition parts keep the room's owner id.
 * @evidenceReview spaces/03-surface-owners.md#interior-surface-handoff #f1d029f Room files own their finish zones; shared.ts roomFloor, roomCeiling and partition pass the room or caller owner to part(), which retains it on each part record.
 * @evidence principles/core/source-units.md#source-scope-preservation The helper preserves caller identity, colour and geometry rather than selecting them.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 part() only assembles caller id, owner, role, color and solid (solids.ts:683-693); it selects nothing.
 * @evidence principles/core/source-units.md#source-substantive-completion It returns a complete part and carries a wall face when the solid has one.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f part() returns id/owner/role/color/mesh and adds wall when the solid carries a face (solids.ts:684-693). openSharedEdges is gone from part and IHousePart; no row mentions it.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Exterior-surface-handoff gives garage-shared-wall to garage.ts and the upper siding to envelope/right.ts; part carries each caller's id, owner, colour and geometry without reassigning it.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 03:35 lower shared wall to garage.ts, siding above to envelope/right.ts; code garage.ts:63 and right.ts:159. part() copies id, owner, color, mesh unchanged (solids.ts:683-693).
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
