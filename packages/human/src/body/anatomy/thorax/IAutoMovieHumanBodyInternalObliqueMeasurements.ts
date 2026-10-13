import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Deep abdominal wall muscle beneath external oblique, arising from iliac crest and fascia toward lower ribs and aponeurosis. One side's muscle belly accepts named volume or MRI fat fraction only.
 *
 * @evidence contracts/common.md#principled-implementation Internal oblique reuses independent belly-volume and fat-fraction quantities for the deep lateral abdominal muscle.
 * @evidence contracts/common.md#clear-and-simple-design One trunk member names the deep belly; shared muscle contracts own physical quantity and acquisition alternatives.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts External-oblique or skin measurements cannot supply this separately owned deep muscle's boundary or attachments.
 * @evidence contracts/common.md#meaningful-documentation The prose states its position beneath external oblique and iliac/fascial-to-rib/aponeurotic relationships.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Internal-oblique typing chooses no deep abdominal segmentation or layered tissue algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This deep abdominal muscle alias holds no prior reconstruction result equivalent across bodies.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Internal-oblique scalar metadata owns no fascial boundary buffers or layer-generation resource.
 * @author Samchon
 */
export type IAutoMovieHumanBodyInternalObliqueMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
