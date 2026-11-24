import type { IAutoMovieDialogueMouthRange } from "./IAutoMovieDialogueMouthRange";

/**
 * A film's dialogue mouths: for each adopted line whose speaker binds to one
 * actor, the mouth values that line gives the actor over its speech span.
 *
 * Render's `planAutoMovieDialogueMouths` builds it from the admitted lines on
 * the film clock. A draw host hands it to the draw page once, before the first
 * picture, as JSON, and the page shows it on the speaking actors' figures.
 * Engine's `sampleAutoMovieDialogueMouth` reads one actor's mouth from it at
 * any second.
 */
export interface IAutoMovieDialogueMouthTrack {
  /** Film frames per second; frame `f` stands for film second `f / fps`. */
  fps: number;

  /**
   * One entry per line bound to one actor, in sound-list order. Where two lines
   * of one actor overlap, the later-starting line moves the mouth from its
   * start frame.
   */
  lines: IAutoMovieDialogueMouthTrack.ILine[];
}

/** Members of a film's dialogue mouths. */
export namespace IAutoMovieDialogueMouthTrack {
  /** One line's mouth values over its speech span. */
  export interface ILine {
    /** Line id. */
    line: string;

    /** The actor the line's speaker binds to. */
    actor: string;

    /** First frame of the speech span, a nonnegative integer. */
    startFrame: number;

    /** Exclusive last frame of the speech span, after `startFrame`. */
    endFrame: number;

    /**
     * The envelope jaw opening in millimetres at the incisors, one per frame
     * from `startFrame` to `endFrame − 1`, from the line's own frame level
     * (engine's `autoMovieDialogueEnvelopeJaw`).
     */
    jaw: number[];

    /**
     * The line's viseme ranges on the emission clock, when its receipt has
     * phoneme chunks; null for a line without chunks.
     */
    ranges: IAutoMovieDialogueMouthRange[] | null;
  }
}
