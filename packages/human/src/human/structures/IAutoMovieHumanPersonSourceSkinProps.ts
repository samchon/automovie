import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanPersonSeam } from "./IAutoMovieHumanPersonSeam";
import type { IAutoMovieHumanPersonSkinSurface } from "./IAutoMovieHumanPersonSkinSurface";

/**
 * What a final face skin evaluator in the performed body frame is compiled
 * from: the face skin's vertex count and region sources, the body basis and
 * its skin surface, the neck seam, the neutral cut body positions, the
 * mandible-carried face vertices and the neutral head anchor (metres, Y up,
 * +Z forward).
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceSkinProps {
  /** Number of face skin vertices. */
  faceCount: number;

  /** Face skin vertex per render-part vertex, by face region (part) ID. */
  faceRegions: ReadonlyMap<string, readonly number[]>;

  /** The body basis. */
  bodyBasis: IAutoMovieHumanBodyBasis;

  /** The body basis's skin surface. */
  bodySkin: IAutoMovieHumanPersonSkinSurface<
    IAutoMovieHumanBodyBasis["surfaces"][number]
  >;

  /** The face/body neck seam, with its frozen body cut. */
  seam: IAutoMovieHumanPersonSeam;

  /** Neutral body skin positions after the cut, metres. */
  neutralBody: readonly number[];

  /** Face skin vertices the mandible carries. */
  jawVertices: readonly number[];

  /** The head anchor on the neutral body, metres. */
  neutralAnchor: IAutoMovieVector3;
}
