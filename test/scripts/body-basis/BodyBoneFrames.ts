import type { AutoMovieHumanoidBone } from "@automovie/interface";
import type { IBodyBoneFramePair } from "./IBodyBoneFramePair";

/** Rest and posed world frames keyed by their source bone identity. */
export type BodyBoneFrames = Map<AutoMovieHumanoidBone, IBodyBoneFramePair>;
