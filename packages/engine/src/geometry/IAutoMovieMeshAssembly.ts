import { IAutoMovieMesh } from "@automovie/interface";

import { IAutoMovieMeshGroup } from "./IAutoMovieMeshGroup";

/** One merged mesh plus the material groups its members occupy. */
export interface IAutoMovieMeshAssembly {
  /** The merged rigid mesh. */
  mesh: IAutoMovieMesh;
  /** Declaration-ordered index ranges, one per contributing member. */
  groups: IAutoMovieMeshGroup[];
}
