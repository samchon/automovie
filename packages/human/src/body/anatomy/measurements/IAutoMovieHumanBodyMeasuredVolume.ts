import type { AutoMovieHumanBodyAcquisitionPosture } from "./AutoMovieHumanBodyAcquisitionPosture";
import type { AutoMovieHumanBodyTomographicModality } from "./AutoMovieHumanBodyTomographicModality";

/** Directly segmented bone or tissue volume in millilitres. @author Samchon */
export interface IAutoMovieHumanBodyMeasuredVolume {
  /** A real 3D image segmentation rather than a fictional target. */
  readonly kind: "observed";
  /** Volume of exactly the named tissue and side, excluding other depots. */
  readonly millilitres: number;
  /** A tomographic acquisition; a plain radiograph cannot provide this. */
  readonly modality: AutoMovieHumanBodyTomographicModality;
  /** Supine/prone volumes do not imply the same standing skin outline. */
  readonly acquisitionPosture: AutoMovieHumanBodyAcquisitionPosture;
  /** Absent when segmentation error is not quantified. */
  readonly uncertaintyMillilitres?: number;
}
