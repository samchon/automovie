import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/** One bone world frame; position in metres and unit quaternion rotation. */
export interface IBodyBoneWorldFrame {
  position: IAutoMovieVector3;
  rotation: IAutoMovieQuaternion;
}
