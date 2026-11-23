import type { AutoMovieChannelValueType } from "../../core/AutoMovieChannelValueType";
import type { IAutoMovieLightOverride } from "./IAutoMovieLightOverride";

/**
 * One supported light axis joins track type/bounds, kind admission, optional whole-vector validation and sparse override writing. The canonical property table supplies the implementations, while staged-kind validity and sample width are caller admission preconditions.
 *
 * @evidence contracts/development/design.md#principled-representation Represent one supported light axis with its value type, component bounds, light-kind predicate, optional whole-value fault and override writer; the shared table supplies actual rules.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The table co-locates gate admission and playback writing, while sampleClip owns type widths and the scene gate owns staged-light validity.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each rule follows the supported light/property pair; this interface does not validate arbitrary implementations or introduce an unsupported axis.
 * @evidence contracts/development/common.md#meaningful-documentation Members describe inclusive bounds, optional collective checks, kind admission and the write preconditions rather than promising unrestricted property assignment.
 */
export interface IAutoMovieLightChannelProperty {
  /**
   * Track value discriminator; sampleClip owns the corresponding component width and rejects mismatched payloads.
   */
  valueType: AutoMovieChannelValueType;

  /**
   * Per-component keyframe bounds shared by scene admission and playback semantics; positive-only axes use exclusive min.
   */
  bounds: {
    /** Lower bound. */
    min: number;

    /** Upper bound, `Infinity` for none. */
    max: number;

    /** Whether {@link min} itself is allowed (`false` for the spot cone). */
    inclusiveMin: boolean;
  };

  /**
   * Whether the admitted light kind carries this axis; the gate checks it before allowing a track to reach the writer.
   */
  carries: (kind: unknown) => boolean;

  /**
   * Optional whole-vector fault text, or null when valid. Rotation uses this for unit norm; scalar/color axes need only component bounds.
   */
  valueFault?: (value: readonly unknown[]) => string | null;

  /**
   * Write an admitted, correctly sized numeric sample into the sparse override. Kind admission and track width are caller preconditions.
   */
  write: (override: IAutoMovieLightOverride, value: readonly number[]) => void;
}
