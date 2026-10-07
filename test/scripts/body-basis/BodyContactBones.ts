import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IBodyContactBone } from "./IBodyContactBone";

/** Posed bone frames consumed by source contact planes, in metres. */
export type BodyContactBones = Map<AutoMovieHumanoidBone, IBodyContactBone>;
