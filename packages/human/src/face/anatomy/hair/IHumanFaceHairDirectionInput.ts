import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";

/**
 * Inputs to the shared static hair direction field. The root supplies neutral chart coordinates for regional styling; the normal supplies the current host's unit direction in the common head axes. The admitted layer owns styling values and contact remains with the integrator.
 *
 * @evidence contracts/common.md#principled-implementation Neutral root, current unit normal and accumulated metric separate the static styling field from the integrator's surface-contact correction.
 * @evidence contracts/common.md#clear-and-simple-design Layer, root, normal, distance and seeded phase provide the complete per-station field context without embedding a collision solver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The admitted layer supplies styling; this input contains no alternate fixture direction or post-contact position correction.
 * @evidence contracts/common.md#meaningful-documentation Members identify metre lengths, radian angles, neutral root frame, current normal and accumulated arc length.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This direction-input schema performs no parting, fall or curl evaluation; evaluateHumanFaceHairDirection owns those fixed field calculations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Root and phase are per-lock field inputs rather than cached outputs, and this record coordinates no repeated requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The direction argument borrows an admitted layer and vectors without acquiring a persistent query or task.
 *
 * @author Samchon
 */
export interface IHumanFaceHairDirectionInput {
  /** Admitted styling layer, with metre lengths and radian angles. */
  layer: IAutoMovieHumanFaceHair.Layer;

  /** Neutral head-frame root position, metres. */
  root: IAutoMovieVector3;

  /** Current unit outward host normal. */
  normal: IAutoMovieVector3;

  /** Accumulated centreline arc length, metres. */
  distance: number;

  /** Seeded curl phase, radians. */
  phase: number;
}
