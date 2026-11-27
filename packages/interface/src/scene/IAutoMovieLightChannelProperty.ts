import type { AutoMovieChannelValueType } from "../core/AutoMovieChannelValueType";
import type { IAutoMovieLightChannelBounds } from "./IAutoMovieLightChannelBounds";
import type { IAutoMovieLightOverride } from "./IAutoMovieLightOverride";

/**
 * One supported light axis joins track type/bounds, kind admission, optional
 * whole-vector validation and sparse override writing. The canonical property
 * table supplies the implementations, while staged-kind validity and sample
 * width are caller admission preconditions.
 */
export interface IAutoMovieLightChannelProperty {
  /**
   * Track value discriminator; sampleClip owns the corresponding component
   * width and rejects mismatched payloads.
   */
  valueType: AutoMovieChannelValueType;

  /**
   * Per-component keyframe bounds shared by scene admission and playback
   * semantics; positive-only axes use exclusive min.
   */
  bounds: IAutoMovieLightChannelBounds;

  /**
   * Whether the admitted light kind carries this axis; the gate checks it
   * before allowing a track to reach the writer.
   */
  carries: (kind: unknown) => boolean;

  /**
   * Optional whole-vector fault text, or null when valid. Rotation uses this
   * for unit norm; scalar/color axes need only component bounds.
   */
  valueFault?: (value: readonly number[]) => string | null;

  /**
   * Write an admitted, correctly sized numeric sample into the sparse override.
   * Kind admission and track width are caller preconditions.
   */
  write: (override: IAutoMovieLightOverride, value: readonly number[]) => void;
}
