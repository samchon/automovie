/**
 * Space solid records shared by geometry emitters, the built-environment adapter, measurements and the source viewer. Coordinates are world metres in right-handed Y-up space. A wall face retains the pre-cut outline and authored voids so boundary assembly can inspect the same body it renders. These declarations and the part constructor select no surface owner; each emitting source supplies its own id, role, dimensions and mesh.
 */
import type { IAutoMovieMesh } from "@automovie/interface";
import type { HousePartRole } from "../types/HousePartRole";
import type { IWallSolid } from "../types/IWallSolid";
import type { IHousePart } from "../types/IHousePart";

/**
 * Build one part record.
 *
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
