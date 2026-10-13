import { IAutoMovieAxisFrame } from "./IAutoMovieAxisFrame";

const assertAxisFrame: (label: string, frame: IAutoMovieAxisFrame | undefined) => void = (
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
 * Convert clinical degrees to rig = (clinical - neutral) / sign. Null rest remains null and an absent frame preserves the angle; an invalid supplied sign/neutral throws when used.
 *
 * @evidence contracts/common.md#principled-implementation Preserve null rest, validate supplied frame sign/neutral and invert degrees as (clinical-neutral)/sign, with absence preserving the input.
 * @evidence contracts/common.md#clear-and-simple-design One scalar inverse shares the same frame contract as forward and interval conversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonfinite clinical angles are not silently repaired; null bypasses unused frames and intermediate representability remains a caller premise.
 * @evidence contracts/common.md#meaningful-documentation Docs state the exact inverse, degrees, identity absence and runtime refusal without corrupted formula prose.
 * @evidence contracts/performance.md#efficient-algorithms Fixed checks and subtraction/division by plus/minus one take constant work/storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Unchanged frames serve repeated angles but altered angle/neutral requires new conversion.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only number/null/error escapes and no pose array, rig handle or task is retained.
 */
export const toRigAngle: (clinical: number | null, frame: IAutoMovieAxisFrame | undefined) => number | null = (
  clinical: number | null,
  frame: IAutoMovieAxisFrame | undefined,
): number | null => {
  if (clinical === null) return null;
  assertAxisFrame("rest frame", frame);
  return frame === undefined
    ? clinical
    : (clinical - frame.neutral) / frame.sign;
};
