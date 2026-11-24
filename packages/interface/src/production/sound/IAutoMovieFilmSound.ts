import type { IAutoMovieFilmTimeline } from "../IAutoMovieFilmTimeline";
import type { IAutoMovieProductionRoomTone } from "../IAutoMovieProductionRoomTone";
import type { IAutoMovieProductionSoundPlan } from "../IAutoMovieProductionSoundPlan";
import type { IAutoMovieDialogueSpeakerBinding } from "./IAutoMovieDialogueSpeakerBinding";

/**
 * A film's adopted sound: its spoken lines with their receipts, its cues, the
 * speakers its lines bind to and its score ducking.
 *
 * A scaffolded production declares it beside its delivery intent, and the
 * render mixes it into the soundtrack the delivery encodes. Every path is
 * relative to the production root and is read through the render host. Line ids
 * and cue ids are each unique within the film, because the report, ducking and
 * the viseme join key on them. A film that declares a sound list declares no
 * `delivery.audio.path`: the render refuses both.
 */
export interface IAutoMovieFilmSound {
  /**
   * Adopted dialogue lines, each a generated WAVE file admitted against its
   * receipt.
   */
  lines: IAutoMovieFilmSound.ILine[];

  /**
   * Adopted cues: music, ambience, effects and other recordings placed on the
   * film clock.
   */
  cues: IAutoMovieFilmSound.ICue[];

  /** Speaker-to-actor bindings that move each speaking actor's mouth. */
  speakers: IAutoMovieDialogueSpeakerBinding[];

  /**
   * Optional seeded room-tone beds on the ambience bus, the continuous noise
   * floor of a dialogue scene with no recording to supply one; omission adds
   * none.
   */
  roomTone?: IAutoMovieProductionRoomTone[];

  /**
   * Optional attenuation of music cues under each spoken line; omission leaves
   * music at its cue gain.
   */
  scoreDucking?: IAutoMovieProductionSoundPlan["scoreDucking"];
}

/** Members of a film's sound list. */
export namespace IAutoMovieFilmSound {
  /**
   * One adopted line: its text, where it starts, and the files that carry and
   * prove it.
   *
   * The line plays at its own length from `startFrame`; its speech span ends on
   * the first frame whose sample tick reaches the start tick plus the line's
   * sample count at 48 kHz.
   */
  export interface ILine {
    /** Line id, unique within the film; the receipt's `line` must equal it. */
    id: string;

    /** Spoken text; the receipt's `text` must equal it. */
    text: string;

    /** Language tag of the speech, such as `en-GB`. */
    language: string;

    /** Speaker whose binding moves an actor's mouth; absent, no mouth moves. */
    speaker?: string;

    /** Film-global start frame, a nonnegative safe integer. */
    startFrame: number;

    /** Production-relative path of the mono 32-bit float WAVE file. */
    pcm: string;

    /**
     * Production-relative path of the line's JSON
     * `IAutoMovieProductionTtsReceipt`.
     */
    receipt: string;
  }

  /**
   * One adopted cue, placed as a timeline audio track entry is, with `asset`
   * naming a production-relative WAVE file instead of a registered asset id.
   */
  export type ICue = IAutoMovieFilmTimeline["tracks"]["audio"][number];
}
