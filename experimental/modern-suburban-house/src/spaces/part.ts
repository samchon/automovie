/**
 * Space solid records shared by geometry emitters, the built-environment adapter, measurements and the source viewer. Coordinates are world metres in right-handed Y-up space. A wall face retains the pre-cut outline and authored voids so boundary assembly can inspect the same body it renders. These declarations and the part constructor select no surface owner; each emitting source supplies its own id, role, dimensions and mesh.
 */
import type { IAutoMovieMesh } from "@automovie/interface";
import type { HousePartRole } from "./HousePartRole";
import type { IWallSolid } from "./IWallSolid";
import type { IHousePart } from "./IHousePart";

/**
 * Build one part record.
 *
 * @evidence spaces/03-surface-owners.md Each emitting source keeps its own owner id and surface role.
 * @evidence spaces/03-surface-owners.md#exterior-surface-handoff Exterior wall parts retain their cut face without assigning a second owner.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff Room finish parts keep the room's owner id.
 * @evidence principles/core/source-units.md#source-scope-preservation The helper preserves caller identity, colour and geometry rather than selecting them.
 * @evidence principles/core/source-units.md#source-substantive-completion It returns a complete part and carries a wall face when the solid has one.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Exterior-surface-handoff gives garage-shared-wall to garage.ts and the upper siding to envelope/right.ts; part carries each caller's id, owner, colour and geometry without reassigning it.
 */
export const part: (id: string, owner: string, role: HousePartRole, color: number, solid: IAutoMovieMesh | IWallSolid) => IHousePart = (id: string, owner: string, role: HousePartRole, color: number, solid: IAutoMovieMesh | IWallSolid): IHousePart =>
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
