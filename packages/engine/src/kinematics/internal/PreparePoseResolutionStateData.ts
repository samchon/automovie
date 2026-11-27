import type { IAutoMovieQuaternion } from "@automovie/interface";
import { Quaternion } from "../../math/Quaternion";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "../../math/Vector3";

/*
 * Private identity operands; no returned transform aliases them.
 */
export const IDENTITY: IAutoMovieQuaternion = Quaternion.identity();

/*
 * Private root-relative origin.
 */
export const ORIGIN: IAutoMovieVector3 = Vector3.create();
