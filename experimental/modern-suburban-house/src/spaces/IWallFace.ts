import type { IWallPoint } from "./IWallPoint";
import type { IWallHole } from "./IWallHole";

/**
 * The face of one wall panel before its voids are cut: the boundary record a built environment hosts openings on. `outline` is the panel outline in the panel's (u, y); `holes` are its voids, each a door, window or open passage.
 *
 * @evidence spaces/07-boundary-assembly.md One wall body retains the boundary record used at room and envelope junctions.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-ownership A partition's face and openings belong to its single wall body.
 * @evidence spaces/07-boundary-assembly.md#exterior-boundary-junctions The exterior corner's assigned wall body retains its own cut face without creating a second corner part.
 * @evidence principles/core/source-units.md#source-scope-preservation This record describes the caller's wall and does not own the room or facade.
 * @evidence principles/core/source-units.md#source-substantive-completion Axis, thickness, outline and void list define the inspection boundary.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-ownership pairs each partition body with its void host, while exterior-boundary-junctions allows the garage/main wall's lower and upper bodies to carry separate faces.
 *
 *
 * @author Samchon
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
