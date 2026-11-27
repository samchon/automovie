import { AutoMovieEngineSound } from "@automovie/engine";
import type {
  IAutoMovieDialogueMouthTrack,
  IAutoMovieDialogueMouths,
  IAutoMovieDrawnMouth,
  IAutoMovieHumanVisemeWeights,
} from "@automovie/interface";

/**
 * The dialogue mouths a draw page hands its subject, recording what each read
 * returned, so the page reports the mouth the subject was handed for the drawn
 * second.
 *
 * `mouths` samples the film's track with engine's
 * `AutoMovieEngineSound.sampleDialogueMouth` and returns a fresh value per
 * read. Each read replaces the actor's recorded value of the same form, so
 * after a placement that places other seconds and then the drawn one again, the
 * record holds the drawn second's values. The draw page clears the record
 * before placing a picture's second and reports it after.
 *
 * ```ts
 * const recorder = new AutoMovieDialogueMouthRecorder(track);
 * subject.speak?.(recorder.mouths);
 * recorder.clear();
 * await subject.seek(seconds);
 * const mouths = recorder.drawn();
 * ```
 */
export class AutoMovieDialogueMouthRecorder {
  /** The mouths handed to the subject, which record every read. */
  public readonly mouths: IAutoMovieDialogueMouths;

  /*
   * What the subject read since the last `clear`, by actor in first-read order.
   */
  private readonly read: Map<string, IAutoMovieDrawnMouth> = new Map();

  /** Sample `track` for every read of `mouths`. */
  public constructor(track: IAutoMovieDialogueMouthTrack) {
    const entry: (actor: string) => IAutoMovieDrawnMouth = (
      actor: string,
    ): IAutoMovieDrawnMouth => {
      const known: IAutoMovieDrawnMouth | undefined = this.read.get(actor);
      if (known !== undefined) return known;
      const created: IAutoMovieDrawnMouth = { actor };
      this.read.set(actor, created);
      return created;
    };
    this.mouths = {
      jaw: (actor: string, seconds: number): number => {
        const jaw: number = AutoMovieEngineSound.sampleDialogueMouth({
          track,
          actor,
          seconds,
        }).jaw;
        entry(actor).jaw = jaw;
        return jaw;
      },
      visemes: (
        actor: string,
        seconds: number,
      ): IAutoMovieHumanVisemeWeights => {
        const visemes: IAutoMovieHumanVisemeWeights =
          AutoMovieEngineSound.sampleDialogueMouth({
            track,
            actor,
            seconds,
          }).visemes;
        entry(actor).visemes = { ...visemes };
        return visemes;
      },
    };
  }

  /** Forget every recorded read, before a picture's second is placed. */
  public clear(): void {
    this.read.clear();
  }

  /** Copies of what the subject read since the last `clear`, one per actor. */
  public drawn(): IAutoMovieDrawnMouth[] {
    return [...this.read.values()].map(
      (mouth: IAutoMovieDrawnMouth): IAutoMovieDrawnMouth => ({
        actor: mouth.actor,
        ...(mouth.jaw === undefined ? {} : { jaw: mouth.jaw }),
        ...(mouth.visemes === undefined
          ? {}
          : { visemes: { ...mouth.visemes } }),
      }),
    );
  }
}
