import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";

/**
 * Current lock geometry and compiled gather direction passed to its tie stage.
 * An ungathered layer omits anchor and gatherDirection; a gathered layer needs
 * both actual resolved values, which the stage admits together before walking.
 *
 * @author Samchon
 */
export interface ICreateHumanFaceHairGatherStageProps {
  /** Existing numerical hairstyle layer. */
  layer: IAutoMovieHumanFaceHair.Layer;

  /** Neutral chart position of the root, the frame the fields are read in. */
  reference: IAutoMovieVector3;

  /** Posed root the lock grows from, in head-frame metres. */
  root: IAutoMovieVector3;

  /** Deterministic source-root sequence identity. */
  sequence: number;

  /** Resolved current scalp tie in head-frame metres, when gathered. */
  anchor?: IAutoMovieVector3;

  /**
   * Compiled current scalp direction field, when gathered.
   * Its owning graph resolver returns the tangent toward the tie and retains
   * its undefined-direction refusal; this callback adds no authoring point.
   */
  gatherDirection?: (point: IAutoMovieVector3) => IAutoMovieVector3;
}
