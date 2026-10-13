import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieAnalysisSolid } from "./IAutoMovieAnalysisSolid";
import { autoMovieSolidBlocks } from "./autoMovieSolidBlocks";

/** Whether any of the given solids stops the ray. */
export const autoMovieRayObstructed = (props: {
  origin: IAutoMovieVector3;
  direction: IAutoMovieVector3;
  solids: readonly IAutoMovieAnalysisSolid[];
  maxDistance: number;
}): boolean =>
  props.solids.some((solid) =>
    autoMovieSolidBlocks({
      origin: props.origin,
      direction: props.direction,
      planes: solid.planes,
      maxDistance: props.maxDistance,
    }),
  );
