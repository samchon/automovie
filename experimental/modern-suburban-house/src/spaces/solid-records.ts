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
 * @evidenceReview spaces/03-surface-owners.md #9596716 v-141 HousePartRole L46-57 names the 11 part families; owner travels separately via part() L690-701. 03-surface-owners.md:29-54 allocates elevations, roofs, porch, floor/ceiling bases, stair+guard, paving and fence to spaces source files.
 * @evidence spaces/03-surface-owners.md#exterior-surface-handoff Exterior roles distinguish envelope, roof, porch, site and chimney parts.
 * @evidenceReview spaces/03-surface-owners.md#exterior-surface-handoff #9f3db3c v-141 Roles wall/roof/porch/paving/fence/chimney used by envelope/*.ts, roof/*.ts, porch.ts:74, site/*, left.ts:104-148 (chimney). 03-surface-owners.md:31-44,50-54 exterior table incl. chimney interface :33.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff Interior roles distinguish room finishes, partitions, stair and guards.
 * @evidenceReview spaces/03-surface-owners.md#interior-surface-handoff #f1d029f The role union includes floor, ceiling, partition, stair and guard; stair.ts calls stair-guards.ts for the guard role. The cited interior handoff covers room finish zones only, while the stair allocation sits in the surface-owner table and partitions are governed by boundary assembly.
 * @evidence principles/core/source-units.md#source-scope-preservation This role labels an assigned part without claiming its surface for the helper.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Type-only union L46-57; carries no owner or geometry; owner is the separate field L83.
 * @evidence principles/core/source-units.md#source-substantive-completion The viewer can group every emitted structural or finish family.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 role reaches every viewer item (houseScene.cts:99), finish bound per role/colour and unbound key throws (materialPreview.ts:171-175), payload type scenePayload.ts:31; all 11 roles are emitted.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Exterior-surface-handoff allocates walls, roofs, porch, paving and fence while interior-surface-handoff allocates room floors, ceilings and partitions; this role union labels their parts.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The surface-owner table allocates exterior bodies, while the interior handoff allocates room finish zones and refers structural walls to boundary assembly. The role union carries those labels; rooms/shared.ts and stair.ts emit partitions under their respective owners, so this record exposes no missing parent assignment.
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
 * @evidenceReview spaces/03-surface-owners.md #9596716 v-141 part() copies the caller's owner into the record L690-701; 03-surface-owners.md:27-29 assigns each complete surface to one source owner.
 * @evidence spaces/03-surface-owners.md#exterior-surface-handoff Exterior parts preserve one author for each emitted body.
 * @evidenceReview spaces/03-surface-owners.md#exterior-surface-handoff #9f3db3c v-141 owner is a single string per emitted body L83; 03-surface-owners.md:27 hands one complete surface to one owner.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff Room parts keep their own floor, ceiling and partition ownership.
 * @evidenceReview spaces/03-surface-owners.md#interior-surface-handoff #f1d029f rooms/shared.ts roomFloor, roomCeiling and partition take their room or caller owner, carrying the interior handoff's separate floor, ceiling and inner partition finish roles.
 * @evidence principles/core/source-units.md#source-scope-preservation The record carries an owner's geometry without making this helper the surface owner.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Interface only; part() never substitutes solids.ts as owner (L690-701).
 * @evidence principles/core/source-units.md#source-substantive-completion Identity, owner, role, colour, mesh and optional wall face reach consumers together.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 part() returns one record with id/owner/role/color/mesh/wall (L691-701); environment.ts:611,624,725 and houseScene.cts:97-100 consume them from that one record.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Exterior-surface-handoff assigns envelope and site bodies by source file and interior-surface-handoff assigns each room's finishes; IHousePart retains those owner ids with the meshes.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The surface-owner table assigns envelope and site bodies to source files and each room's finishes to its room file; IHousePart carries owner and mesh, while part() copies the supplied owner unchanged for facade, garage and roomFloor parts.
 */
export interface IHousePart {
  /**
   * @evidence spaces/03-surface-owners.md Each part has a stable address for inspection.
   * @evidenceReview spaces/03-surface-owners.md #9596716 v-141 Ids are deterministic and unique (house.ts:175 throws on duplicates). 03-surface-owners.md body only says surface-id census is not complete (:27) and part measurement exists (:27,:56); stable identity is obligations/design/space-sources.md:13 (cited at house.ts:126), not 03.
   * @evidence principles/core/source-units.md#source-scope-preservation The id names an emitted part rather than a second owner.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 id is a plain string on the part L76; owner is a separate field L83.
   * @evidence principles/core/source-units.md#source-substantive-completion A unique id supports mesh and boundary census.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 house.ts:175 refuses duplicate part ids; environment boundary ids are built from p.id (environment.ts:627-628); space-audit.ts rows per part id.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Exterior-surface-handoff requires each completed body to have one source owner, and the geometry census addresses garage-shared-wall and room floors by part id; this field keeps those emitted addresses.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 03:27 hands each complete surface to one source owner (table 03:31-54). Part ids are the census addresses: space-audit.ts:71 measures every part by id (incl. garage-shared-wall, <room>-floor); house.ts:175 duplicate-id check; house.ts:211-212 finds door floor strips by id; casing-space-scan.cjs:76 selects garage-shared-wall by id.
   */
  id: string;
  /**
   * @evidence spaces/03-surface-owners.md The source path identifies the part's assigned surface author.
   * @evidenceReview spaces/03-surface-owners.md #9596716 v-141 Owners are src/spaces-relative paths ('envelope/left.ts', 'rooms/entry.ts', 'garage.ts', ...) matching the file owners in 03-surface-owners.md:31-54,100-114.
   * @evidence principles/core/source-units.md#source-scope-preservation The helper retains the caller's ownership rather than assigning itself.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 part() takes owner from the caller L690 with no default.
   * @evidence principles/core/source-units.md#source-substantive-completion Consumers can trace every part to a source owner.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Viewer items carry owner (houseScene.cts:100); duplicate/door errors cite owner (house.ts:175, environment.ts:677); materialPreview.ts:193-201 reads owner.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Exterior-surface-handoff assigns the lower garage shared wall to garage.ts and the upper siding to envelope/right.ts; owner preserves that split for each part.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 03:35: garage owns the door-bearing shared body up to the garage-roof weather line, right owns the siding above. Code garage.ts:63 part('garage-shared-wall','garage.ts'); right.ts:53,159 'right-garage-shared-upper-wall' owner 'envelope/right.ts'; part() keeps owner. Split text added fa601efa/a15c1dd1; exposure owned by positive rows garage.ts:44, right.ts:79, so not HIST for this field.
   */
  owner: string;
  /**
   * @evidence spaces/03-surface-owners.md The role groups a surface part by its spatial function.
   * @evidenceReview spaces/03-surface-owners.md #9596716 v-141 role classifies parts by function; 03-surface-owners.md:29-54,98-114 organise surfaces by the same families.
   * @evidence principles/core/source-units.md#source-scope-preservation Classification does not transfer ownership between room and envelope authors.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 role and owner are independent fields; environment.ts:630-647 only changes boundary kind, never owner.
   * @evidence principles/core/source-units.md#source-substantive-completion Viewer and review census can separate walls, floors, roof and site parts.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 roof-overlap.ts:296 filters role roof; exterior-support.ts:62 paving/porch; environment.ts:621 partition/floor; space-audit.ts:73 role column; viewer houseScene.cts:99.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-surface-handoff separates room finish from partition and exterior-surface-handoff separates roof from wall; role carries those distinctions into the viewer census.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The surface-owner design separates room finish from structural walls and elevation walls from roof slopes; shared.ts emits partition, floor and ceiling roles, and viewer payload, material preview and space census consume those existing distinctions.
   */
  role: HousePartRole;
  /**
   * @evidence spaces/03-surface-owners.md The surface owner supplies a blocking base colour with its part.
   * @evidenceReview spaces/03-surface-owners.md #9596716 v-141 Callers pass PALETTE colours (palette.ts:21-39). 03-surface-owners.md body contains no colour/base-colour handoff; the basis is settings/20-verification.md:49 visual-grammar (palette.ts:4).
   * @evidence principles/core/source-units.md#source-scope-preservation The field is a flat source colour, leaving texture and optics to materials.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 color is a number only (L97); finishes/textures bound in viewer materialPreview.ts:171; settings/20-verification.md:49 gives repetition/optics/texture to materials.
   * @evidence principles/core/source-units.md#source-substantive-completion The mesh has a reproducible visible colour for inspection.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Fixed PALETTE constant per part; viewer finish keyed deterministically by role/colour (materialPreview.ts:171-175).
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-surface-handoff keeps visible room finish with its room source while material optics belong to later material work; color supplies only the blocking palette value.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 03:96 keeps visible room finish with the room file (true). The clause 'material optics belong to later material work' is not in interior-surface-handoff; it is stated in palette.ts:8-9 (flat colour only, optics to materials branch). A holds: color is a flat PALETTE number, used by materialPreview.ts:171-176 only as a lookup key with role.
   */
  color: number;
  /**
   * @evidence spaces/03-surface-owners.md The assigned owner emits a world-space body for its surface.
   * @evidenceReview spaces/03-surface-owners.md #9596716 v-141 Helpers return world-space meshes (block L313-322, wallPanel L366-379); 03-surface-owners.md:29-54 owners emit complete surfaces.
   * @evidence principles/core/source-units.md#source-scope-preservation This field carries the caller's mesh rather than synthesizing another surface owner.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 part() stores the caller solid's mesh (L697, L701); nothing synthesised.
   * @evidence principles/core/source-units.md#source-substantive-completion Triangles, normals and indices reach the deterministic viewer.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 environment.ts:193 model geometry = p.mesh; houseScene.cts:86-89 requires normals/indices and draws positions/normals/indices.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Exterior-surface-handoff requires actual envelope, roof and site bodies from their owners, and interior-surface-handoff requires room finish bodies; mesh transports each resulting geometry.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 03:27 hands each complete surface to one spaces source; table 03:31-54 names envelope, roof, site owners; 03:96 room-finish owners. mesh (solids.ts:104) is the caller's geometry copied by part() (solids.ts:690,693).
   */
  mesh: IAutoMovieMesh;
  /**
   * @evidence spaces/03-surface-owners.md A wall part may expose its opening-bearing boundary alongside the mesh.
   * @evidenceReview spaces/03-surface-owners.md #9596716 03:58 each elevation owner owns wall body, own void and cut face. part() sets wall: solid.face whenever an IWallSolid is passed (solids.ts:684-691). The removed openSharedEdges field does not touch this.
   * @evidence principles/core/source-units.md#source-scope-preservation Only an emitted wall or partition supplies this face.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 IWallSolid producers are wallPanel, straightWall and blindRecessWall; their callers pass wall or partition roles, including shared.ts room partitions and stair.ts enclosed stair walls. Plain mesh callers have no wall face.
   * @evidence principles/core/source-units.md#source-substantive-completion Openings can be hosted on the same wall body that was cut.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f environment.ts:691-713 turns each face.holes entry of a part into an opening on that same part's boundary segment; house.ts:209 finds a door's host by hole id on p.wall.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work External-opening-interface places a rough door/window void in the boundary wall and leaves its fill to models; wall carries that cut face beside the emitting wall mesh.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 06-openings.md:27 elevation opening H2s give rough rectangular voids passing through the exterior wall; 06:29,33 frame/sash/glass are reserved later fill members (H2 '거친 개구부와 충전 부재의 경계'; models named at 03:58). wall carries the wallPanel face (solids.ts:352-356) beside the mesh via part().
   */
  wall?: IWallFace;
  /**
   * @evidence spaces/10-ground-floor.md Exposed wall closure and fence display may await actual map ground.
   * @evidenceReview spaces/10-ground-floor.md #9f27f8e v-141 Marker set on exterior walls reaching EXTERIOR_WALL_BOTTOM, all fence parts and chimney-body (house.ts:177-180; fence.ts:60,65). 10-ground-floor.md:120 covers only the exterior-wall display bottom; the fence display bottom is site/fence.md:97.
   * @evidence spaces/10-ground-floor.md#ground-support-handoff The marker distinguishes a temporary wall display bottom from structural support.
   * @evidenceReview spaces/10-ground-floor.md#ground-support-handoff #e70bb49 v-141 10-ground-floor.md:120 Y=-0.45 is a display cut, not support, marked map-ground-pending; house.ts:177-178 marks walls whose outline reaches EXTERIOR_WALL_BOTTOM.
   * @evidence principles/core/source-units.md#source-scope-preservation This is a review status on an emitted part, never a terrain datum.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Literal union 'map-ground-pending' L126; carries no height.
   * @evidence principles/core/source-units.md#source-substantive-completion Downstream inspection can identify provisional ground contacts by part id.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 environment.ts:734-736 lists pending part ids and zone ids.
   * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work The source exposed the absent wall bottom rule; the reviewed design now declares this marker.
   * @evidenceReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 v-141 Repair exists: 04df855f added 10-ground-floor.md:120 (EXTERIOR_WALL_BOTTOM in source since 2d75a76d; marker added 0fae5e8d). Row names no repaired target (10-ground-floor.md#ground-support-handoff) and omits site/fence.md:97, repaired in the same commit and served by the same field (house.ts:179).
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
