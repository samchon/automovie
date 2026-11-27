import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineMath } from "../../math/AutoMovieEngineMath";

/** Shared rotation-between implementation used by the Kinematics owner. */
export const aimRotationImplementation: IAimRotationImplementation = {
  run(from: IAutoMovieVector3, to: IAutoMovieVector3): IAutoMovieQuaternion {
    return AutoMovieEngineMath.rotationBetween(from, to);
  },
  prepare(from: IAutoMovieVector3): (to: IAutoMovieVector3) => IAutoMovieQuaternion {
    return AutoMovieEngineMath.prepareRotationBetween(from);
  },
};

interface IAimRotationImplementation {
  run(from: IAutoMovieVector3, to: IAutoMovieVector3): IAutoMovieQuaternion;
  prepare(from: IAutoMovieVector3): (to: IAutoMovieVector3) => IAutoMovieQuaternion;
}