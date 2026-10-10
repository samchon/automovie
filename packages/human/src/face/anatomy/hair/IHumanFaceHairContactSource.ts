import type { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";

/**
 * What `humanFaceHairContact` builds one curve's contact from.
 *
 * The layer supplies the sampling step and requested clearance; the root and
 * length scale the rounding allowance; the query is the closed collider the
 * contact reads. Positions and lengths are head-frame metres.
 *
 * @author Samchon
 */
export interface IHumanFaceHairContactSource {
  /** Sampling step, requested surface gap and optional physical shaft diameter of the admitted layer. */
  layer: Pick<IAutoMovieHumanFaceHair.Layer, "samplingStep" | "clearance" | "terminalShaftDiameter">;

  /** The curve's root, scaling the rounding allowance. */
  root: IAutoMovieVector3;

  /** The curve's metric length, scaling the rounding allowance. */
  length: number;

  /** Signed query of the closed host collider. */
  query: ReturnType<typeof createAutoMovieSignedMeshQuery>;
}
