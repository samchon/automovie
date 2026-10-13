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
 * Convert rig degrees to clinical = sign * rig + neutral. Null rest remains null and an absent frame preserves the angle; an invalid supplied sign/neutral throws when used.
 *
 * @evidence contracts/common.md#principled-implementation Preserve null rest, validate supplied frame sign/neutral and compute sign*rig+neutral in degrees, with absence returning the angle unchanged.
 * @evidence contracts/common.md#clear-and-simple-design The scalar forward transform exposes the same convention as inverse/interval helpers without skeleton-specific branches.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No side selects a hidden mirror; angle finiteness/representability remain caller premises and null bypasses validation of an unused frame.
 * @evidence contracts/common.md#meaningful-documentation Docs state the forward equation, degree units, null/undefined meaning and sign/neutral refusal.
 * @evidence contracts/performance.md#efficient-algorithms Fixed validation and multiply/add take constant work/storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Rig callers reuse unchanged frame definitions while new angles require fresh arithmetic without record-identity caching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only number/null/error returns, retaining no joint history, handle or task.
 */
export const toClinicalAngle: (rig: number | null, frame: IAutoMovieAxisFrame | undefined) => number | null = (
  rig: number | null,
  frame: IAutoMovieAxisFrame | undefined,
): number | null => {
  if (rig === null) return null;
  assertAxisFrame("rest frame", frame);
  return frame === undefined ? rig : frame.sign * rig + frame.neutral;
};
