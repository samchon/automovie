import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/** Posed bone source frame and native segment length, in body-frame metres. */
export interface IBodyContactBone {
  position: IAutoMovieVector3;
  rotation: IAutoMovieQuaternion;
  length: number;
  parent: AutoMovieHumanoidBone | null;
}
