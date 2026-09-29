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
 * @evidence spaces/03-surface-owners.md#exterior-surface-handoff Exterior roles distinguish envelope, roof, porch, site and chimney parts.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff Floor and ceiling roles identify room finish parts made by their room owners.
 * @evidence principles/core/source-units.md#source-scope-preservation This role labels an assigned part without claiming its surface for the helper.
 * @evidence principles/core/source-units.md#source-substantive-completion The viewer can group every emitted structural or finish family.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The surface-owner table allocates exterior bodies and the interior handoff allocates room finishes; this role union labels those parts without assigning a new owner.
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
 * @evidence spaces/03-surface-owners.md#exterior-surface-handoff Exterior parts preserve one author for each emitted body.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff Room parts retain the owner of their floor and ceiling finish.
 * @evidence principles/core/source-units.md#source-scope-preservation The record carries an owner's geometry without making this helper the surface owner.
 * @evidence principles/core/source-units.md#source-substantive-completion Identity, owner, role, colour, mesh and optional wall face reach consumers together.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Exterior-surface-handoff assigns envelope and site bodies by source file and interior-surface-handoff assigns each room's finishes; IHousePart retains those owner ids with the meshes.
 */
export interface IHousePart {
  /**
   * @evidence spaces/03-surface-owners.md Each emitted body retains its own id beside the assigned surface owner.
   * @evidence principles/core/source-units.md#source-scope-preservation The id names an emitted part rather than a second owner.
   * @evidence principles/core/source-units.md#source-substantive-completion A unique id supports mesh and boundary census.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Exterior-surface-handoff requires each completed body to have one source owner, and the geometry census addresses garage-shared-wall and room floors by part id; this field keeps those emitted addresses.
   */
  id: string;
  /**
   * @evidence spaces/03-surface-owners.md The source path identifies the part's assigned surface author.
   * @evidence principles/core/source-units.md#source-scope-preservation The helper retains the caller's ownership rather than assigning itself.
   * @evidence principles/core/source-units.md#source-substantive-completion Consumers can trace every part to a source owner.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Exterior-surface-handoff assigns the lower garage shared wall to garage.ts and the upper siding to envelope/right.ts; owner preserves that split for each part.
   */
  owner: string;
  /**
   * @evidence spaces/03-surface-owners.md The role groups a surface part by its spatial function.
   * @evidence principles/core/source-units.md#source-scope-preservation Classification does not transfer ownership between room and envelope authors.
   * @evidence principles/core/source-units.md#source-substantive-completion Viewer and review census can separate walls, floors, roof and site parts.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-surface-handoff separates room finish from partition and exterior-surface-handoff separates roof from wall; role carries those distinctions into the viewer census.
   */
  role: HousePartRole;
  /**
   * @evidence spaces/03-surface-owners.md The emitted part keeps its colour beside the source owner assigned to that surface.
   * @evidence principles/core/source-units.md#source-scope-preservation The field is a flat source colour, leaving texture and optics to materials.
   * @evidence principles/core/source-units.md#source-substantive-completion The mesh has a reproducible visible colour for inspection.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The room source still owns its visible finish; color carries a blocking value on that owner's emitted part without changing the surface allocation.
   */
  color: number;
  /**
   * @evidence spaces/03-surface-owners.md The assigned owner emits a world-space body for its surface.
   * @evidence principles/core/source-units.md#source-scope-preservation This field carries the caller's mesh rather than synthesizing another surface owner.
   * @evidence principles/core/source-units.md#source-substantive-completion Triangles, normals and indices reach the deterministic viewer.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Exterior-surface-handoff requires actual envelope, roof and site bodies from their owners, and interior-surface-handoff requires room finish bodies; mesh transports each resulting geometry.
   */
  mesh: IAutoMovieMesh;
  /**
   * @evidence spaces/03-surface-owners.md A wall part may expose its opening-bearing boundary alongside the mesh.
   * @evidence principles/core/source-units.md#source-scope-preservation Only an emitted wall or partition supplies this face.
   * @evidence principles/core/source-units.md#source-substantive-completion Openings can be hosted on the same wall body that was cut.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work External-opening-interface places a rough door/window void in the boundary wall and leaves its fill to models; wall carries that cut face beside the emitting wall mesh.
   */
  wall?: IWallFace;
  /**
   * @evidence spaces/10-ground-floor.md Exterior walls at the temporary display bottom retain pending map-ground status.
   * @evidence spaces/site/fence.md#fence-ground-profile Fence parts retain pending map-ground status at their temporary display bottom.
   * @evidence spaces/10-ground-floor.md#ground-support-handoff The marker distinguishes a temporary wall display bottom from structural support.
   * @evidence principles/core/source-units.md#source-scope-preservation This is a review status on an emitted part, never a terrain datum.
   * @evidence principles/core/source-units.md#source-substantive-completion Downstream inspection can identify provisional ground contacts by part id.
   * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work The ground-support and fence-ground handoffs declare temporary display bottoms; this field exposes their pending status without resolving map contact.
   */
  pendingMapGround?: "map-ground-pending";
}

/**
 * The face of one wall panel before its voids are cut: the boundary record a
 * built environment hosts openings on. `outline` is the panel outline in the
 * panel's (u, y); `holes` are its voids, each a door, window or open passage.
 * @evidence spaces/07-boundary-assembly.md One wall body retains the boundary record used at room and envelope junctions.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-ownership A partition's face and openings belong to its single wall body.
 * @evidence spaces/07-boundary-assembly.md#exterior-boundary-junctions The exterior corner's assigned wall body retains its own cut face without creating a second corner part.
 * @evidence principles/core/source-units.md#source-scope-preservation This record describes the caller's wall and does not own the room or facade.
 * @evidence principles/core/source-units.md#source-substantive-completion Axis, thickness, outline and void list define the inspection boundary.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-ownership pairs each partition body with its void host, while exterior-boundary-junctions allows the garage/main wall's lower and upper bodies to carry separate faces.
 */
export interface IWallFace {
  /**
   * @evidence spaces/07-boundary-assembly.md A wall boundary runs along one world horizontal axis.
   * @evidence principles/core/source-units.md#source-scope-preservation The axis describes the assigned wall's local frame only.
   * @evidence principles/core/source-units.md#source-substantive-completion Consumers can orient holes and boundary checks in that frame.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-junctions gives each straight partition a horizontal run and exterior-boundary-junctions gives each facade a wall line; axis records whether that run is world X or Z.
   */
  axis: "x" | "z";
  /**
   * @evidence spaces/07-boundary-assembly.md The wall records its thickness across the running axis.
   * @evidence principles/core/source-units.md#source-scope-preservation This range is the caller's wall thickness, not a second boundary.
   * @evidence principles/core/source-units.md#source-substantive-completion It locates both faces of the one emitted wall body.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Main-building-extent reserves 0.25 m exterior walls and interior-boundary-junctions uses the assigned partition band; across carries both physical faces of the selected wall.
   */
  across: readonly [number, number];
  /**
   * @evidence spaces/07-boundary-assembly.md The outer panel trace remains available after cutting openings.
   * @evidence principles/core/source-units.md#source-scope-preservation The trace belongs to the existing emitted wall.
   * @evidence principles/core/source-units.md#source-substantive-completion It allows void and junction validation against full wall bounds.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-ownership requires a partition body around its door void and front-roof-closures requires the complete front facade; outline retains the pre-cut perimeter for either owner.
   */
  outline: readonly IWallPoint[];
  /**
   * @evidence spaces/07-boundary-assembly.md Door and window voids remain hosted by their cut wall.
   * @evidence principles/core/source-units.md#source-scope-preservation The list records cuts without creating door or window fills.
   * @evidence principles/core/source-units.md#source-substantive-completion Consumers can bind each wall cut to a sided boundary segment.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work External-opening-interface keeps each rough window or door void in its wall host, and interior-boundary-ownership keeps partition doors in their one body; holes records those cuts.
   */
  holes: readonly IWallHole[];
}

/**
 * A wall panel's mesh together with the face it was cut from.
 * @evidence spaces/07-boundary-assembly.md A boundary has one body and one associated cut-face record.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-ownership Room partitions pair their physical body with the opening host.
 * @evidence principles/core/source-units.md#source-scope-preservation The pair stays under the caller's assigned wall owner.
 * @evidence principles/core/source-units.md#source-substantive-completion Geometry and opening-bearing face travel together.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-ownership requires one body per interior partition; exterior-boundary-junctions instead divide the main/garage contact into lower garage and upper siding bodies, which this interface can carry separately.
 */
export interface IWallSolid {
  /**
   * @evidence spaces/07-boundary-assembly.md The wall's emitted body realizes the assigned boundary.
   * @evidence principles/core/source-units.md#source-scope-preservation The mesh belongs to the caller's wall owner.
   * @evidence principles/core/source-units.md#source-substantive-completion The boundary is actual geometry rather than a plan-only line.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-ownership assigns each cut partition one emitted body and exterior-boundary-junctions divides the garage/main contact by height; mesh carries the body for one such assignment.
   */
  mesh: IAutoMovieMesh;
  /**
   * @evidence spaces/07-boundary-assembly.md The same emitted wall carries the face and its voids.
   * @evidence principles/core/source-units.md#source-scope-preservation The face does not assign a second wall author.
   * @evidence principles/core/source-units.md#source-substantive-completion Openings and junction checks can inspect the cut body's source face.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work External-opening-interface requires a rough void through its own host wall, and interior-boundary-ownership keeps a door void on its partition; face preserves that host relation beside mesh.
   */
  face: IWallFace;
}

/**
 * A point of a plan polygon in world X/Z metres.
 * @evidence spaces/site/00-access.md House and site use one world plan frame for their extents.
 * @evidence spaces/site/00-access.md#site-access-interface The site assembles the house and exterior zones in the inherited coordinate frame.
 * @evidence principles/core/source-units.md#source-scope-preservation The point is supplied by a design owner, not chosen by this helper.
 * @evidence principles/core/source-units.md#source-substantive-completion Both plan axes are present for closed surface rings.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-access-interface keeps house and exterior-zone coordinates in the common frame from settings/00-production.md#coordinate-units; IPlanPoint passes caller-supplied world X/Z metres without borrowing one building's bounds.
 */
export interface IPlanPoint {
  /**
   * @evidence spaces/site/00-access.md World X places a plan point across the site.
   * @evidence principles/core/source-units.md#source-scope-preservation This is the caller's authored X value.
   * @evidence principles/core/source-units.md#source-substantive-completion A horizontal coordinate is available to polygon builders.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-access-interface assembles house and exterior zones in the common world frame, whose +X points toward the garage in coordinate-units; x retains the caller's value on that axis.
   */
  x: number;
  /**
   * @evidence spaces/site/00-access.md World Z places a plan point toward or away from the street.
   * @evidence principles/core/source-units.md#source-scope-preservation This is the caller's authored Z value.
   * @evidence principles/core/source-units.md#source-substantive-completion A depth coordinate is available to polygon builders.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Site-access-interface uses the common world frame for building and paving, whose +Z points to the front walk and -Z to the garden in coordinate-units; z retains the caller's depth on that axis.
   */
  z: number;
}

/**
 * A point of a wall outline: u along the wall axis, y the world height.
 * @evidence spaces/07-boundary-assembly.md Cut wall panels retain their planar boundary trace.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-junctions The trace supports continuous room corners and door heads.
 * @evidence principles/core/source-units.md#source-scope-preservation Coordinates describe the caller's wall only.
 * @evidence principles/core/source-units.md#source-substantive-completion Both running distance and height locate each outline vertex.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-ownership fixes the partition's full height, interior-boundary-junctions fixes its door cuts, and exterior-boundary-junctions carries sloped wall contacts; IWallPoint records their run and height vertices.
 */
export interface IWallPoint {
  /**
   * @evidence spaces/07-boundary-assembly.md This point locates a vertex along the wall run.
   * @evidence principles/core/source-units.md#source-scope-preservation The value uses the assigned wall's local running axis.
   * @evidence principles/core/source-units.md#source-substantive-completion The outline can order corners and door notches.
    * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Main-building-extent and attached-garage-extent set outer wall runs, roof-mass-allocation sets the gable and ridge stations, chimney-roof-interface locates the left-wall split, and interior-boundary-junctions assigns door cuts to partition runs. u carries these outline stations; window intervals remain in IWallHole.
   */
  u: number;
  /**
   * @evidence spaces/07-boundary-assembly.md This point locates a vertex at world height.
   * @evidence principles/core/source-units.md#source-scope-preservation The height follows the assigned wall datum.
   * @evidence principles/core/source-units.md#source-substantive-completion Head, sill and top vertices are explicit.
    * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Ground-support-handoff sets the displayed exterior wall bottom, roof-wall-head-junctions and roof-mass-allocation govern sloped wall tops, and storey-datums fixes partition levels; interior-boundary-junctions keeps room-owned door heads aligned with their partition notches. y carries those outline heights, while enclosed window heads remain in IWallHole.top.
   */
  y: number;
}

/**
 * A rectangular void cut through a wall panel, in the panel's (u, y).
 * @evidence spaces/06-openings.md Door and window sites are actual wall voids before model fills.
 * @evidence spaces/06-openings.md#external-opening-interface Exterior openings keep their structural host distinct from door/window models.
 * @evidence principles/core/source-units.md#source-scope-preservation This record cuts the assigned wall only and does not supply a model leaf.
 * @evidence principles/core/source-units.md#source-substantive-completion Id and four bounds locate a real rectangular cut.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work External-opening-interface assigns the rough door/window cut to its wall source and leaves frames/leaves to models; IWallHole carries only that four-bound wall cut.
 */
export interface IWallHole {
  /**
   * @evidence spaces/06-openings.md The opening retains one house-wide id shared by its wall and room bindings.
   * @evidence principles/core/source-units.md#source-scope-preservation This names a void, not its later model fill.
   * @evidence principles/core/source-units.md#source-substantive-completion The environment can connect a compiled opening to its cut.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The entry plan names front-door and garage-front-opening names garage-front-door; id preserves those authored addresses through wall and environment assembly.
   */
  id: string;
  /**
   * @evidence spaces/06-openings.md The void starts at a position along its host wall.
   * @evidence principles/core/source-units.md#source-scope-preservation The start lies in the existing wall coordinate frame.
   * @evidence principles/core/source-units.md#source-substantive-completion The left edge participates in a measurable opening width.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garage-front-opening fixes the garage door's left X=6.10 and entry-plan fixes the entry door's left X=0.40; from carries each caller's first running coordinate into its host cut.
   */
  from: number;
  /**
   * @evidence spaces/06-openings.md The void ends at a position along its host wall.
   * @evidence principles/core/source-units.md#source-scope-preservation The end remains within the assigned wall run.
   * @evidence principles/core/source-units.md#source-substantive-completion Together with from, it fixes the cut width.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garage-front-opening fixes the garage door's right X=11.10 and entry-plan fixes the entry door's right X=1.40; to carries each caller's second running coordinate into its host cut.
   */
  to: number;
  /**
   * @evidence spaces/06-openings.md The opening has a sill or threshold height.
   * @evidence principles/core/source-units.md#source-scope-preservation The lower edge describes a wall cut, not a separate threshold object.
   * @evidence principles/core/source-units.md#source-substantive-completion A floor-reaching opening can become a true bottom notch.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Ground-threshold-junctions extends floor-reaching door voids into their base while living-front-window fixes its own sill above the floor; bottom carries that opening-specific lower edge.
   */
  bottom: number;
  /**
   * @evidence spaces/06-openings.md The opening has an explicit head height.
   * @evidence principles/core/source-units.md#source-scope-preservation The top edge belongs to the host wall cut.
   * @evidence principles/core/source-units.md#source-substantive-completion Header clearance can be checked against the wall top.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garage-front-opening fixes its door head Y=2.15 and living-front-window fixes its window head; top carries each host's upper cut limit.
   */
  top: number;
}

/**
 * Build one part record.
 * @evidence spaces/03-surface-owners.md Each emitting source keeps its own owner id and surface role.
 * @evidence spaces/03-surface-owners.md#exterior-surface-handoff Exterior wall parts retain their cut face without assigning a second owner.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff Room finish parts keep the room's owner id.
 * @evidence principles/core/source-units.md#source-scope-preservation The helper preserves caller identity, colour and geometry rather than selecting them.
 * @evidence principles/core/source-units.md#source-substantive-completion It returns a complete part and carries a wall face when the solid has one.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Exterior-surface-handoff gives garage-shared-wall to garage.ts and the upper siding to envelope/right.ts; part carries each caller's id, owner, colour and geometry without reassigning it.
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
