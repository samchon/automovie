import { IAutoMovieAxisFrame } from "./IAutoMovieAxisFrame";

const assertAxisFrame = (
  label: string,
  frame: IAutoMovieAxisFrame | undefined,
): void => {
  if (frame === undefined) return;
  if (frame.sign !== 1 && frame.sign !== -1)
    throw new Error(`${label} sign must be 1 or -1, but was ${frame.sign}`);
  if (!Number.isFinite(frame.neutral))
    throw new Error(
      `${label} neutral must be finite, but was ${frame.neutral}`,
    );
};

/**
 * A **clinical** angle (what the ROM table and pose authors write) → the
 * **rest-relative** angle the rig actually rotates by: `r = (clinical −
 * neutral) / sign`. The inverse of {@link toClinicalAngle}. An undefined frame
 * (or a `null` angle) is the identity, so non-mirrored axes pass through.
 *
 * @evidence requirements/asset-authoring/rig-and-state.md#asset-rig-basis-controls Lowers a clinical control value into the declared rig rest basis.
 * @evidence specifications/asset-and-representation/rig-deformation-and-state.md#asset-spec-rig-inputs Applies the declared affine rest-frame conversion.
 */
export const toRigAngle = (
  clinical: number | null,
  frame: IAutoMovieAxisFrame | undefined,
): number | null => {
  if (clinical === null) return null;
  assertAxisFrame("rest frame", frame);
  return frame === undefined
    ? clinical
    : (clinical - frame.neutral) / frame.sign;
};
