/**
 * Space solid records shared by geometry emitters, the built-environment adapter, measurements and the source viewer. Coordinates are world metres in right-handed Y-up space. A wall face retains the pre-cut outline and authored voids so boundary assembly can inspect the same body it renders. These declarations and the part constructor select no surface owner; each emitting source supplies its own id, role, dimensions and mesh.
 */
import type { IAutoMovieMesh } from "@automovie/interface";
import type { HousePartRole } from "./HousePartRole";
import type { IWallFace } from "./IWallFace";

/**
 * One emitted solid: a stable id, the source owner that authors it, its role, its base colour, and its world-space mesh.
 *
 * @evidence spaces/03-surface-owners.md Every surface part keeps the identity of its assigned emitting owner.
 * @evidence spaces/03-surface-owners.md#exterior-surface-handoff Exterior parts preserve one author for each emitted body.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff Room parts retain the owner of their floor and ceiling finish.
 * @evidence principles/core/source-units.md#source-scope-preservation The record carries an owner's geometry without making this helper the surface owner.
 * @evidence principles/core/source-units.md#source-substantive-completion Identity, owner, role, colour, mesh and optional wall face reach consumers together.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Exterior-surface-handoff assigns envelope and site bodies by source file and interior-surface-handoff assigns each room's finishes; IHousePart retains those owner ids with the meshes.
 *
 *
 * @author Samchon
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
