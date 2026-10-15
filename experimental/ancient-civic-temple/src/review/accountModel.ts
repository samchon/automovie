import type { IAutoMovieModel } from "@automovie/interface";
import { accountMeshes } from "./accountMeshes";
import { partMeshes } from "./partMeshes";
import { MeshAccount } from "./MeshAccount";

/** Accounts for the part geometry of one model. */

export const accountModel = (model: IAutoMovieModel): MeshAccount => accountMeshes(model.id, partMeshes(model));
