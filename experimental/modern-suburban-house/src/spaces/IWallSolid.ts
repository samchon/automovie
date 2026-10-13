/**
 * Space solid records shared by geometry emitters, the built-environment adapter, measurements and the source viewer. Coordinates are world metres in right-handed Y-up space. A wall face retains the pre-cut outline and authored voids so boundary assembly can inspect the same body it renders. These declarations and the part constructor select no surface owner; each emitting source supplies its own id, role, dimensions and mesh.
 */
import type { IAutoMovieMesh } from "@automovie/interface";
import type { IWallFace } from "./IWallFace";

/**
 * A wall panel's mesh together with the face it was cut from.
 *
 * @evidence spaces/07-boundary-assembly.md A boundary has one body and one associated cut-face record.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-ownership Room partitions pair their physical body with the opening host.
 * @evidence principles/core/source-units.md#source-scope-preservation The pair stays under the caller's assigned wall owner.
 * @evidence principles/core/source-units.md#source-substantive-completion Geometry and opening-bearing face travel together.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-ownership requires one body per interior partition; exterior-boundary-junctions instead divide the main/garage contact into lower garage and upper siding bodies, which this interface can carry separately.
 *
 *
 * @author Samchon
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
