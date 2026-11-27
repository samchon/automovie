import type { IAutoMovieClip } from "../core/IAutoMovieClip";
import type { IAutoMovieFlameCue } from "../cinematics/IAutoMovieFlameCue";
import type { IAutoMovieAffordance } from "../model/IAutoMovieAffordance";
import type { IAutoMoviePointLight } from "../scene/IAutoMoviePointLight";
import type { IAutoMovieSceneNode } from "../scene/IAutoMovieSceneNode";
import type { IAutoMovieSpotLight } from "../scene/IAutoMovieSpotLight";

/** Bake a staged point or spot source at a prop's model-local emitter. */
export interface IAutoMovieCompilePracticalLightMotion {
  /** Unique id for the returned clip within the shot's lightMotions. */
  id: string;

  /** Positive finite shot duration in seconds. */
  duration: number;

  /** The staged practical light. Its intensity is the on-state value. */
  light: IAutoMoviePointLight | IAutoMovieSpotLight;

  /** Placed prop root. Its staged world TRS fills channels before they start. */
  prop: Pick<IAutoMovieSceneNode, "id" | "transform">;

  /**
   * The shot's admitted object-motion clips in playback order. Each started
   * prop TRS channel follows the engine's own per-channel clip authority. Omit
   * for a placed prop at rest.
   */
  objectMotions?: readonly IAutoMovieClip[];

  /**
   * The prop's fixed model-local emitter, such as the torch's lens or the
   * lamp's light affordance. A spot shines along the emitter's local +Y. Supply
   * the frame from the model as staged, including any fixed articulation.
   */
  emitter: Pick<IAutoMovieAffordance, "frame">;

  /**
   * Shot-local sample times in seconds within [0, duration]. Include every
   * output frame that needs exact alignment. A prop with TRS tracks requires at
   * least one explicit sample time. Position and aim interpolate between
   * samples, including around held or delayed source keys. The bake samples
   * both shot endpoints and switch boundaries, and canonicalizes order and
   * duplicates.
   */
  sampleTimes?: readonly number[];

  /**
   * Shot-local half-open interval in seconds, 0 <= start < end <= duration.
   * Omit to preserve staged intensity across the shot, including its endpoint.
   */
  on?: IAutoMovieFlameCue.IOnInterval;

  /**
   * The flame this light's source shows, from `compileFlameFlicker`:
   * key times, the silhouette area at each, which keys lie inside `on`, and the
   * mean area over those keys. Present, the light always gets a `step`
   * intensity track on exactly these keys, holding `intensity · area / mean`
   * inside `on` and 0 elsewhere, so the light flickers with the flame and
   * averages its on-state intensity. Omit for a steady light.
   */
  flicker?: {
    /** Strictly increasing key times in [0, duration], seconds. */
    times: readonly number[];

    /** Flame silhouette area at each key, square metres. */
    areas: readonly number[];

    /** Whether each key lies inside `on`, or every key when `on` is omitted. */
    inside: readonly boolean[];

    /** Mean area over the inside keys, square metres, positive. */
    mean: number;
  };
}
