import type { IAutoMovieViewerAudioCue } from "./IAutoMovieViewerAudioCue";
import { planAudioPlayback } from "./internal/planAudioPlayback";
import { playAudioCues } from "./internal/playAudioCues";

/** Owns the Viewer audio planning and Web Audio playback operations. */
export namespace AutoMovieViewerAudio {
  /** Inputs for planning the cue starts audible from a film instant. */
  export interface IPlanPlaybackRequest {
    /** Cues to consider. */
    cues: readonly IAutoMovieViewerAudioCue[];
    /** Film second playback begins at. */
    seconds: number;
    /** Film seconds per wall second; must be positive. */
    rate: number;
    /** Decoded source lengths in seconds, keyed by asset id. */
    lengths: Readonly<Record<string, number>>;
  }

  /** Inputs for starting the cues that sound from a film instant. */
  export interface IPlayCuesRequest {
    /** Web Audio context that owns playback nodes. */
    context: BaseAudioContext;
    /** Decoded buffers keyed by asset id. */
    decoded: Readonly<Record<string, AudioBuffer>>;
    /** Cues to play. */
    cues: readonly IAutoMovieViewerAudioCue[];
    /** Film second playback begins at. */
    seconds: number;
    /** Film seconds per wall second. */
    rate: number;
  }

  /** One source start in the playback plan. */
  export interface IStart {
    /** Source id. */
    asset: string;
    /** Wall seconds from now until it starts. */
    delay: number;
    /** Source seconds it starts from. */
    offset: number;
    /** Wall seconds it sounds. */
    duration: number;
    /** Linear gain. */
    gain: number;
    /** Equal-power pan in [-1, 1]. */
    pan: number;
    /** Source seconds per wall second. */
    playbackRate: number;
  }

  /** Callable operation that stops all sources started by `playCues`. */
  export type IStop = () => void;

  /**
   * Plan the audible cue starts at a film instant and transport rate.
   * Sounding cues begin part-way into their excerpts; later cues are delayed,
   * and ended cues are omitted. Source offsets and playback rates include each
   * cue's own rate. The operation is pure and deterministic.
   *
   * @param request Cues, film instant, transport rate and source lengths.
   * @returns One start per sounding cue, in cue order.
   */
  export function planPlayback(
    request: IPlanPlaybackRequest,
  ): IStart[] {
    return planAudioPlayback(request);
  }

  /**
   * Start the planned cues through Web Audio, using one buffer source, gain
   * and equal-power stereo panner per cue. The returned stop operation releases
   * each source once, so a pause, seek or rate change stops and replans.
   *
   * @param request Context, decoded buffers, cues, film instant and rate.
   * @returns A once-only operation that stops and disconnects started sources.
   */
  export function playCues(request: IPlayCuesRequest): IStop {
    return playAudioCues(request);
  }
}
