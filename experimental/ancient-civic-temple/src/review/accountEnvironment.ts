import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { accountModel } from "./accountModel";
import { MeshAccount } from "./MeshAccount";

/** Accounts for every model in one environment generation in declaration order. */

export const accountEnvironment = (environment: IAutoMovieBuiltEnvironment): MeshAccount[] => environment.models.map(accountModel);
