import type { IAutoMovieAxisFrame } from "@automovie/interface";

/** Admit the original actual frame reads only when a nonnull angle uses them. */
function assertAxisFrame(
  label: string,
  frame: IAutoMovieAxisFrame | undefined,
): void {
  if (frame === undefined) return;
  if (frame.sign !== 1 && frame.sign !== -1)
    throw new Error(`${label} sign must be 1 or -1, but was ${frame.sign}`);
}

/** Own rig angle conversion and its prepared readers. */
export namespace AutoMovieEngineRigAngle {
    /**
   * Convert clinical degrees to rig = (clinical - neutral) / sign. Null rest
   * remains null and an absent frame preserves the angle; an invalid supplied
   * sign/neutral throws when used. prepare supplies a lazy operation reader for
   * unchanged frame objects. Null reads admit no frame; the first nonnull read
   * validates and captures the exact neutral/sign used by the original
   * expression. Replacing the frame admits it again, while unchanged identity
   * reuses only those affine scalars.
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
      return frame === undefined
        ? clinical
        : (clinical - known.neutral) / known.sign;
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

  /** Lazy fixed-frame arithmetic for actual repeated joint composition. */

    /**
     * Prepare one lazy converter; construction reads no frame or angle. Null
     * remains null without admission. Each same-identity frame must stay
     * unchanged until replacement or reader release. A replacement runs the
     * original checks, and failed admission never replaces valid metadata.
     */
    export function prepareToRigAngle(): (
      clinical: number | null,
      frame: IAutoMovieAxisFrame | undefined,
    ) => number | null {
      const state: IConversionState = {};
      return (
        clinical: number | null,
        frame: IAutoMovieAxisFrame | undefined,
      ): number | null => convert(clinical, frame, state);
    }
}
