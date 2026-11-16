import { IAutoMovieAxisFrame } from "./IAutoMovieAxisFrame";

/** Admit the original actual frame reads only when a nonnull angle uses them. */
const assertAxisFrame: (
  label: string,
  frame: IAutoMovieAxisFrame | undefined,
) => void = (label: string, frame: IAutoMovieAxisFrame | undefined): void => {
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
 * prepare supplies a lazy operation reader for unchanged frame objects. Null
 * reads admit no frame; the first nonnull read validates and captures the
 * exact neutral/sign used by the original expression. Replacing the frame
 * admits it again, while unchanged identity reuses only those affine scalars.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Preserve null rest, validate supplied frame sign/neutral and invert degrees as (clinical-neutral)/sign, with absence preserving the input. A prepared reader captures the actual final neutral/sign reads after the first successful nonnull admission and keeps subtraction before division. The same unchanged frame therefore gives exactly the same raw arithmetic for every later clinical number, including overflowing intermediate rig values.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One private conversion owner serves direct and prepared reads, while the existing assertion owns diagnostics. Direct calls supply no state; prepare adds only one lazy last-frame scalar reading and no angle or joint layer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nonfinite clinical angles are not silently repaired and no new angle validation is introduced. Null bypasses unused frames before any lookup/admission. First use retains the original sign/neutral checks and neutral/subtraction/sign/division read order; failures install no reading. Same-identity reuse requires the documented unchanged-frame premise, replacement admits anew and intermediate nonfinite results propagate without a finite repair or reordered expression.
 * @evidence contracts/development/common.md#meaningful-documentation States exact inverse degrees, null/absent meanings, used-frame refusal, lazy prepared first use, unchanged-object lifetime, replacement behavior and unaltered intermediate propagation.
 * @evidence contracts/development/implementation.md#efficient-algorithms Direct conversion keeps its fixed admission and two scalar operations, without metadata allocation. One prepared frame's first nonnull read performs that same work; later same-frame reads need an identity comparison and the original subtraction/division, omitting repeated immutable-frame validation. Work/storage are constant and runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Actual OnBasis query/operation readers share each fixed axis frame's captured neutral/sign while still admitting every clinical angle before invoking this converter. Frame identity and the caller's unchanged-object lifetime decide equivalence; null does no preparation, replacements overwrite the single reading only after successful admission, and no converted angle or target answer is retained.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Direct conversion retains nothing. Each caller-owned prepared closure retains one state and at most one borrowed frame plus two affine scalars, releasing replaced readings or all metadata with the owning query/operation. No angle, joint, pose population, global cache, handle or task is retained.
 */
export function toRigAngle(
  clinical: number | null,
  frame: IAutoMovieAxisFrame | undefined,
): number | null {
  return convert(clinical, frame);
}

/** One prepared axis's latest unchanged frame and its actual affine operands. */
interface IConversionState {
  /** Installed only after a successful nonnull read. */
  reading?: {
    /** Borrowed frame identity, including the absent-frame case. */
    frame: IAutoMovieAxisFrame | undefined;

    /** Actual neutral read by the original subtraction. */
    neutral: number;

    /** Actual sign read after that subtraction. */
    sign: number;
  };
}

/** The original conversion, optionally reusing one unchanged admitted frame. */
function convert(
  clinical: number | null,
  frame: IAutoMovieAxisFrame | undefined,
  state?: IConversionState,
): number | null {
  if (clinical === null) return null;
  const known: IConversionState["reading"] = state?.reading;
  if (known !== undefined && known.frame === frame)
    return frame === undefined ? clinical : (clinical - known.neutral) / known.sign;
  assertAxisFrame("rest frame", frame);
  if (frame === undefined) {
    if (state !== undefined) state.reading = { frame, neutral: 0, sign: 1 };
    return clinical;
  }
  const neutral: number = frame.neutral;
  const adjusted: number = clinical - neutral;
  const sign: number = frame.sign;
  const result: number = adjusted / sign;
  if (state !== undefined) state.reading = { frame, neutral, sign };
  return result;
}

/**
 * Lazy fixed-frame arithmetic for actual repeated joint composition.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines lazy nonnull first-use admission, same-frame immutable lifetime, replacement invalidation, null bypass and caller-owned bounded state.
 * @evidence contracts/development/design.md#principled-representation A fixed clinical affine frame contributes only neutral and sign; the current clinical number still undergoes the original subtraction/division. No joint or converted reading is represented in the preparation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One prepared scalar reader serves existing OnBasis F/A/T conversion without pre-reading optional frame members. Direct toRigAngle remains independent and no metadata/result getter or foreign validation hook is exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Same-frame reuse assumes its numeric values remain unchanged, as OnBasis already requires. No descriptor/freeze inference or target identity establishes equivalence; a new frame object is admitted normally and replaces the one bounded reading only on success.
 */
export namespace toRigAngle {
  /**
   * Prepare one lazy converter; construction reads no frame or angle. Null
   * remains null without admission. Each same-identity frame must stay
   * unchanged until replacement or reader release. A replacement runs the
   * original checks, and failed admission never replaces valid metadata.
   */
  export function prepare(): (
    clinical: number | null,
    frame: IAutoMovieAxisFrame | undefined,
  ) => number | null {
    const state: IConversionState = {};
    return (clinical: number | null, frame: IAutoMovieAxisFrame | undefined): number | null =>
      convert(clinical, frame, state);
  }
}
