import { IAutoMovieMesh } from "@automovie/interface";

import { IAutoMovieMeshTransform } from "./IAutoMovieMeshTransform";

/** One named member of an assembly, optionally placed by its own transform. */
export interface IAutoMovieMeshPart {
  /** Stable member identity, unique inside one assembly. */
  id: string;
  /** The member's geometry in its own local frame. */
  mesh: IAutoMovieMesh;
  /** Where the member sits in the assembly frame. */
  transform?: IAutoMovieMeshTransform;
}
