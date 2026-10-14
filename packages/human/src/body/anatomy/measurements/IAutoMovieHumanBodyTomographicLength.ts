import type { AutoMovieHumanBodyTomographicModality } from "./AutoMovieHumanBodyTomographicModality";
import type { IAutoMovieHumanBodyMeasuredLength } from "./IAutoMovieHumanBodyMeasuredLength";

/**
 * A 3D imaging-derived length or a fictional target of the same quantity.
 *
 * Sphere fitting to a whole articular head requires 3D geometry; a single projected radiographic circle does not establish its 3D sphere radius. Shao et al. 2024, doi:10.1038/s41598-024-72123-6, map serial CT head slices into 3D before fitting a femoral-head sphere.
 *
 * @evidence contracts/common.md#principled-implementation The length specialization narrows observations to CT/MRI when the named quantity requires three-dimensional geometry.
 * @evidence contracts/common.md#clear-and-simple-design A measured-length intersection reuses provenance while this owner excludes projection-only acquisition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A projected radiographic circle cannot silently establish a whole articular-head sphere radius.
 * @evidence contracts/common.md#meaningful-documentation Comments distinguish target millimetres from tomographic observation and explain the read CT-to-three-dimensional fitting example.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Tomographic-length typing performs no sphere fit, serial-slice traversal or image reconstruction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The specialized length union coordinates no completed articular reconstruction across consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Tomographic length metadata retains no serial image bytes, sphere-fit arrays or scanner sessions.
 * @author Samchon
 */
export type IAutoMovieHumanBodyTomographicLength =
  | {
      /** Desired three-dimensional anatomical length rather than an acquisition. */
      readonly kind: "target";

      /** Target length in millimetres using the owning three-dimensional landmarks. */
      readonly millimetres: number;
    }
  | (IAutoMovieHumanBodyMeasuredLength & {
      /** CT or MRI acquisition establishing the required three-dimensional quantity. */
      readonly modality: AutoMovieHumanBodyTomographicModality;
    });
