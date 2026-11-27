import type { IAutoMovieAxisFrame } from "@automovie/interface";

/** Own clinical angle conversion and its prepared readers. */
export namespace AutoMovieEngineClinicalAngle {
    /**
   * Convert rig degrees to clinical = sign * rig + neutral. Null rest remains
   * null and an absent frame preserves the angle; an invalid supplied
   * sign/neutral throws when used. prepare reads the same expression repeatedly
   * on unchanged frame objects: construction admits nothing, first nonnull use
   * captures the actual final sign/neutral operands after original validation and
   * replacement admits anew.
   */
  export function toClinicalAngle(
    rig: number | null,
    frame: IAutoMovieAxisFrame | undefined,
  ): number | null {
    return convert(rig, frame);
  }

  /** Lazy unchanged-frame arithmetic for actual repeated clinical conversions. */

    /**
     * Prepare one lazy reader without reading a frame or angle. Null bypasses
     * unused frames; each used frame object stays unchanged until replacement or
     * release, and failed admission leaves any valid prior reading intact.
     */
    export function prepareToClinicalAngle(): (
      rig: number | null,
      frame: IAutoMovieAxisFrame | undefined,
    ) => number | null {
      const state: IConversionState = {};
      return (
        rig: number | null,
        frame: IAutoMovieAxisFrame | undefined,
      ): number | null => convert(rig, frame, state);
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
}

/** Admit the actual used affine frame before its forward clinical conversion. */
function assertAxisFrame(
  label: string,
  frame: IAutoMovieAxisFrame | undefined,
): void {
  if (frame === undefined) return;
  if (frame.sign !== 1 && frame.sign !== -1)
    throw new Error(`${label} sign must be 1 or -1, but was ${frame.sign}`);
}
