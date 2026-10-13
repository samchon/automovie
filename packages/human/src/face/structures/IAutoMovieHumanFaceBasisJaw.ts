import type { IAutoMovieHumanFaceBasisJawLaterotrusion } from "./IAutoMovieHumanFaceBasisJawLaterotrusion";
import type { IAutoMovieHumanFaceBasisJawOpening } from "./IAutoMovieHumanFaceBasisJawOpening";
import type { IAutoMovieHumanFaceBasisJawTranslation } from "./IAutoMovieHumanFaceBasisJawTranslation";

/**
 * The articulated mandible: its pivot landmark and condylar offset, its
 * rotation axis, the channel-driven opening, protrusion and laterotrusion, and
 * the supported sagittal translation budget
 * (`IAutoMovieHumanFaceBasis.articulation` states the trajectory).
 *
 * @evidence contracts/common.md#principled-implementation The shaped pivot plus source condylar offset, unit axis and coupled opening/protrusive/lateral endpoint contributions define one shared mandibular rigid motion. The reader refuses summed sagittal translation past the source-supported budget without editing the request.
 * @evidence contracts/common.md#clear-and-simple-design Opening and translation owners carry their endpoint channels while this record owns the common centre/axis and supported-combination budget.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The endpoint-linear trajectory and sagittal budget are authored approximations, not a universal patient-specific motion envelope; lateral contributions do not imply independent clinically valid extrema.
 * @evidence contracts/common.md#meaningful-documentation Members identify pivot/offset, frame, axis direction, opening coupling and metre budget, linked to the complete approximation/source account.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This type executes no joint transform or combined-budget comparison.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Mandibular registration defines no cached shaped pivot or reused articulation result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The basis owns the joint records and fixed triples; no rig resource or task is acquired by the declaration.
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
