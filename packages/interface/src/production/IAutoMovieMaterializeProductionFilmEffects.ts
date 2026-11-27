import type { IAutoMovieFilmTimeline } from "./IAutoMovieFilmTimeline";
import type { IAutoMovieProductionFrameRate } from "./IAutoMovieProductionFrameRate";
import type { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";
import type { IAutoMovieFilmEffectCurrentIdentity } from "./IAutoMovieFilmEffectCurrentIdentity";
import type { IAutoMovieShotEffectFilmInterval } from "./IAutoMovieShotEffectFilmInterval";

/**
 * Inputs for admitting film-owned cues and materializing their frame-clock
 * streams.
 */
export namespace IAutoMovieMaterializeProductionFilmEffects {
  /**
   * Materialize normalized film cues into current, deterministic effect
   * streams.
   *
   * Every cue becomes one `IAutoMovieCompiledFilmEffect` in start-frame then
   * code-unit id order, stamped with exactly the four fields of `identity`, the
   * reduced `frameRate`, its half-open frame interval and a digest of all of
   * them. The inner stream steps one frame at a time, spans the exact boundary
   * seconds of the interval, holds the cue's intensity constant, and takes its
   * seed from the film seed protocol of {@link materializeCompiledEffects}.
   *
   * Every refusal throws {@link AutoMovieEngineFilmEffectRuntimeError}: a malformed
   * identity, rate, world id, shot interval or cue, or a repeated cue id, is
   * `film-effect-input-invalid`; a cue on an unknown zone is
   * `film-effect-zone-missing`; a zone whose recipe is unknown is
   * `film-effect-recipe-missing`; and two film cues, or a film cue and a shot
   * interval, overlapping on one zone are `film-effect-owner-conflict`, naming
   * both cues and the shared frames.
   */
  export type IProps = {
    /**
     * Current production, film, compile and edit identity, validated before
     * materialization and copied into each runtime for later stale-runtime
     * checks.
     */
    identity: IAutoMovieFilmEffectCurrentIdentity;
    /**
     * Film frames per second as a positive safe integer or a rational with
     * positive safe-integer terms. Fractional scalar rates are refused.
     * productionFilmEffectFrameRate reduces the ratio; the inner step is one
     * frame's boundary duration.
     */
    frameRate: number | IAutoMovieProductionFrameRate;
    /**
     * Borrowed world recipe and zone declarations. Blank or duplicate IDs
     * throw; cues must resolve their zone and that zone's recipe. Stream
     * payloads are cloned.
     */
    world: IAutoMovieWorldDesign;
    /**
     * Normalized film cue track. Empty input returns an empty array after input
     * admission; output is ordered by start frame then code-unit id and
     * independently owns the materialized streams.
     */
    effects: IAutoMovieFilmTimeline["tracks"]["effects"];
    /**
     * Shot-owned half-open film-frame intervals used for zone-conflict
     * detection. Omitted means an empty conflict set; each supplied owner and
     * interval is validated.
     */
    shotEffects?: readonly IAutoMovieShotEffectFilmInterval[];
  };
}
