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
