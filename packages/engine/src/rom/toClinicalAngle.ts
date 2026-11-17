import type { IAutoMovieAxisFrame } from "@automovie/interface";

/** Admit the actual used affine frame before its forward clinical conversion. */
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
 * Convert rig degrees to clinical = sign * rig + neutral. Null rest remains null and an absent frame preserves the angle; an invalid supplied sign/neutral throws when used.
 * prepare reads the same expression repeatedly on unchanged frame objects:
 * construction admits nothing, first nonnull use captures the actual final
 * sign/neutral operands after original validation and replacement admits anew.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Preserve null rest, validate sign/neutral and compute sign*rig+neutral in degrees, with absent frame preserving the angle. Prepared use captures the actual final sign read, performs its original multiplication, then captures neutral and performs the original addition; unchanged scalars repeat exactly that arithmetic for each current rig value.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One private forward-conversion owner serves direct and prepared calls, with original diagnostics in assertAxisFrame. The scalar entry remains independent of skeletons; preparation adds only one bounded last-frame affine reading.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No hidden mirror, finite repair, reordered expression or normalization is added. Null returns before frame lookup/admission; first actual nonnull use keeps original checks and sign/multiplication/neutral/addition read order. Same-frame reuse requires unchanged values, replacements admit anew and failed admission installs no metadata.
 * @evidence contracts/development/common.md#meaningful-documentation States equation/units, null/undefined meanings, used-frame refusals, first-use preparation, unchanged-object lifetime and replacement behavior.
 * @evidence contracts/development/implementation.md#efficient-algorithms Direct conversion keeps fixed validation and multiply/add without metadata allocation. A prepared frame performs that work once on actual nonnull use; later matching identity reads omit immutable-frame revalidation but keep current-angle multiply/add. Work/storage are constant and runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The actual repeated box-projector candidate conversion shares only one unchanged frame's captured sign/neutral. Frame replacement invalidates the single reading and admits again, while every new rig value still undergoes original arithmetic. No clinical result, candidate or target is cached.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Direct calls retain nothing. A caller-owned prepared closure holds one state and at most one borrowed frame/two scalars, replacing its reading only after successful admission and releasing it with the query/operation. No joint population, result, global cache, handle or task is retained.
 */
export function toClinicalAngle(
  rig: number | null,
  frame: IAutoMovieAxisFrame | undefined,
): number | null {
  return convert(rig, frame);
}

/** Actual immutable affine operands, kept only for the latest prepared frame. */
interface IConversionState {
  /** Installed only after the first successful nonnull actual use. */
  reading?: {
    /** Borrowed unchanged frame identity, including the absent-frame case. */
    frame: IAutoMovieAxisFrame | undefined;

    /** Original multiplier read before the rig multiplication. */
    sign: number;

    /** Original neutral read after that multiplication. */
    neutral: number;
  };
}

/** Original forward expression with optional unchanged-frame preparation. */
function convert(
  rig: number | null,
  frame: IAutoMovieAxisFrame | undefined,
  state?: IConversionState,
): number | null {
  if (rig === null) return null;
  const known: IConversionState["reading"] = state?.reading;
  if (known !== undefined && known.frame === frame)
    return frame === undefined ? rig : known.sign * rig + known.neutral;
  assertAxisFrame("rest frame", frame);
  if (frame === undefined) {
    if (state !== undefined) state.reading = { frame, sign: 1, neutral: 0 };
    return rig;
  }
  const sign: number = frame.sign;
  const scaled: number = sign * rig;
  const neutral: number = frame.neutral;
  const result: number = scaled + neutral;
  if (state !== undefined) state.reading = { frame, sign, neutral };
  return result;
}

/**
 * Lazy unchanged-frame arithmetic for actual repeated clinical conversions.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines first nonnull validation/capture, null bypass, unchanged-object lifetime, replacement behavior and caller-owned bounded state.
 * @evidence contracts/development/design.md#principled-representation A forward clinical affine frame contributes only sign and neutral, while each current rig number still undergoes multiplication/addition; no candidate or completed clinical angle is represented.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One prepared reader serves the actual projector's repeated candidate conversions without exposing metadata, a generic transformation hook or a result cache. The original direct converter remains independent.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Same-identity reuse requires the documented unchanged-frame premise; no descriptor/freeze inference, numerical tolerance or target key replaces it. Replacement admits normally and overwrites one reading only after success.
 */
export namespace toClinicalAngle {
  /**
   * Prepare one lazy reader without reading a frame or angle. Null bypasses
   * unused frames; each used frame object stays unchanged until replacement
   * or release, and failed admission leaves any valid prior reading intact.
   */
  export function prepare(): (
    rig: number | null,
    frame: IAutoMovieAxisFrame | undefined,
  ) => number | null {
    const state: IConversionState = {};
    return (rig: number | null, frame: IAutoMovieAxisFrame | undefined): number | null =>
      convert(rig, frame, state);
  }
}
