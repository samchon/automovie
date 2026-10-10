import type { IAutoMovieHumanFaceBasisJawLaterotrusion } from "./IAutoMovieHumanFaceBasisJawLaterotrusion";
import type { IAutoMovieHumanFaceBasisJawOpening } from "./IAutoMovieHumanFaceBasisJawOpening";
import type { IAutoMovieHumanFaceBasisJawTranslation } from "./IAutoMovieHumanFaceBasisJawTranslation";

/**
 * The articulated mandible: its pivot landmark and condylar offset, its
 * rotation axis, the channel-driven opening, protrusion and laterotrusion, and
 * the supported sagittal translation budget
 * (`IAutoMovieHumanFaceBasis.articulation` states the trajectory).
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisJaw {
  /** Landmark id of the source jaw pivot. */
  pivot: string;

  /** Metre offset from that landmark to the condylar axis point. */
  axisOffset: [number, number, number];

  /** Unit rotation axis; a positive angle opens the mouth. */
  axis: [number, number, number];

  /** Rotation about `axis` with its coupled translation. */
  opening: IAutoMovieHumanFaceBasisJawOpening;

  /** Forward translation of the mandible. */
  protrusion: IAutoMovieHumanFaceBasisJawTranslation;

  /** Sideways translations, one per side. */
  laterotrusion: IAutoMovieHumanFaceBasisJawLaterotrusion;

  /** Supported magnitude of the summed opening and protrusion translation, in metres. */
  translationLimitMetres: number;
}
