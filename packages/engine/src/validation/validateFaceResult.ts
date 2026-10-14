import { IAutoMovieFace, IAutoMovieValidation } from "@automovie/interface";

import { validateFace } from "./validateFace";

/**
 * Expose validateFace through a canonical success/failure validation result.
 *
 * @evidence contracts/common.md#principled-implementation Expose validateFace through a canonical success/failure validation result.
 * @evidence contracts/common.md#clear-and-simple-design Face admission stays with validateFace and result construction with the collector.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The wrapper adds no anatomical acceptance exception or corrective geometry.
 * @evidence contracts/common.md#meaningful-documentation The result reports metadata faults, not visual face quality.
 * @evidence contracts/performance.md#efficient-algorithms Face-field checks plus V-row partitioning determine time/storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing face rules are reused directly for every current input.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The report owns arrays/rows and the wrapper retains no face object or host task.
 */
export const validateFaceResult: (
  face: IAutoMovieFace,
) => IAutoMovieValidation = (face: IAutoMovieFace): IAutoMovieValidation =>
  validateFace({ face }).toValidation();
