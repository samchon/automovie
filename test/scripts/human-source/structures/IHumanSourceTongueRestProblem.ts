import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import type { IHumanFaceOralArchFrame } from "@automovie/human/face/anatomy/oral/IHumanFaceOralArchFrame";
import type { IHumanFaceOralLiningField } from "@automovie/human/face/anatomy/oral/IHumanFaceOralLiningField";

import type { IHumanSourceCrownSolid } from "./IHumanSourceCrownSolid.ts";

/** Immutable post-occlusion source and the normal lining's exact fields. */
export interface IHumanSourceTongueRestProblem {
  face: IAutoMovieHumanFaceBasis;
  positions: number[];
  indices: number[];
  upper: IHumanFaceOralArchFrame;
  lower: IHumanFaceOralArchFrame;
  palate: IHumanFaceOralLiningField;
  floor: IHumanFaceOralLiningField;
  crowns: IHumanSourceCrownSolid[];
  coordinateU: number[];
  coordinateV: number[];
  coordinateA: number[];
  minimumV: number;
  maximumV: number;
  rootEndV: number;
  qualification: string;
}
