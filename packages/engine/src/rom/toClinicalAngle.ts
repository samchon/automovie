import { IAutoMovieAngleRange } from "@automovie/interface";
import { IAutoMovieAxisFrame } from "./IAutoMovieAxisFrame";
import { IAutoMovieRestFrame } from "./IAutoMovieRestFrame";

/**
 * The **rest-relative** angle the rig rotates by → the **clinical** angle:
 * `clinical = sign · r + neutral`. The inverse of {@link toRigAngle}.
 *
 * @evidence requirements/asset-authoring/rig-and-state.md#asset-rig-basis-controls Lifts a rig-relative rotation back into its named clinical control value.
 * @evidence specifications/asset-and-representation/rig-deformation-and-state.md#asset-spec-rig-inputs Reconstructs the semantic angle from the declared rest-frame conversion.
 */
export const toClinicalAngle = (
  rig: number | null,
  frame: IAutoMovieAxisFrame | undefined,
): number | null => {
  if (rig === null) return null;
  assertAxisFrame("rest frame", frame);
  return frame === undefined ? rig : frame.sign * rig + frame.neutral;
};

const shift = (
  axis: keyof IAutoMovieRestFrame,
  range: IAutoMovieAngleRange | null,
  frame: IAutoMovieAxisFrame | undefined,
): IAutoMovieAngleRange | null => {
  assertAxisFrame(`rest frame ${axis}`, frame);
  if (range === null) return null;
  if (frame === undefined) return range;
  // r = (clinical − neutral) / sign; a sign of −1 flips the interval, so sort.
  const a = (range.min - frame.neutral) / frame.sign;
  const b = (range.max - frame.neutral) / frame.sign;
  return { min: Math.min(a, b), max: Math.max(a, b) };
};
